import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { QuestionAxis, QuestionDifficulty } from "@prisma/client";

interface OptionInput {
    text: string;
    isCorrect: boolean;
}

interface QuestionInput {
    text: string;
    explanation?: string;
    difficulty?: QuestionDifficulty;
    cognitiveLevel?: string;
    options: OptionInput[];
}

function getBigrams(str: string) {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
        bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
}

function bigramSimilarity(str1: string, str2: string) {
    if (!str1 || !str2) return 0;
    const s1 = str1.replace(/[\s\p{P}]/gu, '').toLowerCase();
    const s2 = str2.replace(/[\s\p{P}]/gu, '').toLowerCase();
    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;
    const bg1 = getBigrams(s1);
    const bg2 = getBigrams(s2);
    let intersectionSize = 0;
    for (const bg of bg1) {
        if (bg2.has(bg)) intersectionSize++;
    }
    return (2.0 * intersectionSize) / (bg1.size + bg2.size);
}

// Extract meaningful Arabic words (remove common stopwords)
function extractKeywords(text: string): Set<string> {
    const stopWords = new Set([
        'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هو', 'هي', 'هل', 'ما', 'أن', 'لا',
        'أو', 'و', 'ثم', 'بل', 'لكن', 'إذا', 'عند', 'بعد', 'قبل', 'حتى', 'كل',
        'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'اللذين', 'التالية', 'التالي',
        'يجب', 'يمكن', 'يتم', 'كان', 'كانت', 'يكون', 'تكون', 'أي', 'أحد', 'بين',
        'خلال', 'أثناء', 'عبر', 'فوق', 'تحت', 'ضد', 'لدى', 'حول', 'دون',
        'الأكثر', 'الأقل', 'الأفضل', 'الصحيح', 'الصحيحة', 'الخاطئة',
        'السؤال', 'الإجابة', 'الخيار', 'العامل', 'المهني', 'العمل',
    ]);
    const words = text.replace(/[\p{P}]/gu, '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
    return new Set(words.filter(w => !stopWords.has(w)));
}

// Jaccard Similarity: measures conceptual overlap between two sets of keywords
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 0;
    let intersection = 0;
    for (const word of set1) {
        if (set2.has(word)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

// Combined conceptual similarity: question text (Jaccard) + correct answer (Bigram)
function isConceptuallySimilar(
    newQ: string, newCorrectAnswer: string,
    existingQ: string, existingCorrectAnswer: string
): boolean {
    // Layer A: Jaccard keyword overlap on question text
    const kw1 = extractKeywords(newQ);
    const kw2 = extractKeywords(existingQ);
    const questionJaccard = jaccardSimilarity(kw1, kw2);

    // Layer B: Bigram similarity on correct answer text
    const answerSimilarity = bigramSimilarity(newCorrectAnswer, existingCorrectAnswer);

    // If question keywords overlap 50%+ AND correct answer is 60%+ similar => duplicate concept
    if (questionJaccard >= 0.50 && answerSimilarity >= 0.60) return true;

    // If question text itself is very similar (bigram 70%+) regardless of answer
    if (bigramSimilarity(newQ, existingQ) >= 0.70) return true;

    // If question keywords overlap very highly (65%+)
    if (questionJaccard >= 0.65) return true;

    return false;
}


export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId, axis, mode, questions } = body;

        if (!professionId || !axis || !mode || !Array.isArray(questions)) {
            return NextResponse.json({ error: "Missing required fields: professionId, axis, mode, questions array." }, { status: 400 });
        }

        if (questions.length === 0) {
            return NextResponse.json({ error: "Questions array is empty." }, { status: 400 });
        }

        // Fetch existing questions WITH options for answer comparison
        const existingDBQuestions = await prisma.question.findMany({
            where: { professionId, axis },
            include: { options: true }
        });
        // Build comparison data: question text + correct answer text
        const existingQA = existingDBQuestions.map(q => ({
            text: q.text.trim().toLowerCase(),
            correctAnswer: (q.options as any[]).find((o: any) => o.isCorrect)?.text?.trim()?.toLowerCase() || ""
        }));
        const existingTexts = new Set(existingQA.map(q => q.text));

        const validQuestionsToInsert: any[] = [];
        const report = {
            totalProvided: questions.length,
            imported: 0,
            skippedDuplicates: 0,
            failed: 0,
            errors: [] as { index: number, text: string, reason: string }[],
        };

        const currentBatchTexts = new Set<string>();
        // Track batch questions with their correct answers for within-batch similarity
        const currentBatchQA: { text: string, correctAnswer: string }[] = [];

        // Validation & Duplicate Checking loop
        for (let i = 0; i < questions.length; i++) {
            const q: QuestionInput = questions[i];
            const qText = q.text?.trim() || "";

            if (!qText) {
                report.failed++;
                report.errors.push({ index: i, text: "N/A", reason: "نص السؤال مفقود." });
                continue;
            }

            const normalizedText = qText.toLowerCase();
            const correctOption = q.options?.find(o => o.isCorrect);
            const correctAnswerText = correctOption?.text?.trim()?.toLowerCase() || "";

            // Duplicate in same file check (exact + conceptual)
            if (currentBatchTexts.has(normalizedText)) {
                report.skippedDuplicates++;
                report.errors.push({ index: i, text: qText, reason: "سؤال مكرر حرفياً داخل نفس ملف الـ JSON." });
                continue;
            }
            
            // Within-batch conceptual similarity check
            let batchDuplicate = false;
            for (const existing of currentBatchQA) {
                if (isConceptuallySimilar(normalizedText, correctAnswerText, existing.text, existing.correctAnswer)) {
                    batchDuplicate = true;
                    break;
                }
            }
            if (batchDuplicate) {
                report.skippedDuplicates++;
                report.errors.push({ index: i, text: qText, reason: "فكرة السؤال مكررة داخل نفس الملف (نفس المفهوم أو الإجابة)." });
                continue;
            }

            currentBatchTexts.add(normalizedText);
            currentBatchQA.push({ text: normalizedText, correctAnswer: correctAnswerText });

            // Duplicate in DB check (Conceptual Similarity)
            if (mode !== "replace_axis_questions") {
                let isSimilar = false;
                
                // 1. Exact match (Fast)
                if (existingTexts.has(normalizedText)) {
                    isSimilar = true;
                } else {
                    // 2. Conceptual similarity check against all existing questions
                    for (const existing of existingQA) {
                        if (isConceptuallySimilar(normalizedText, correctAnswerText, existing.text, existing.correctAnswer)) {
                            isSimilar = true;
                            break;
                        }
                    }
                }

                if (isSimilar) {
                    if (mode === "skip_duplicates") {
                        report.skippedDuplicates++;
                        report.errors.push({ index: i, text: qText, reason: "تم رفض السؤال: فكرته أو إجابته متشابهة مع سؤال موجود في قاعدة البيانات." });
                        continue;
                    } else if (mode === "append") {
                        report.failed++;
                        report.errors.push({ index: i, text: qText, reason: "لا يمكن إضافة السؤال: يتشابه مفاهيمياً مع سؤال موجود (مطابقة بالفكرة والإجابة)." });
                        continue;
                    }
                }
            }

            if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
                report.failed++;
                report.errors.push({ index: i, text: qText, reason: "Must have exactly 4 options." });
                continue;
            }

            const correctCount = q.options.filter(opt => opt.isCorrect).length;
            if (correctCount !== 1) {
                report.failed++;
                report.errors.push({ index: i, text: qText, reason: "Exactly one option must be correct." });
                continue;
            }

            // Valid payload to insert
            validQuestionsToInsert.push({
                text: qText,
                explanation: q.explanation || null,
                difficulty: q.difficulty || "MEDIUM",
                cognitiveLevel: q.cognitiveLevel || "K2",
                options: q.options.map(opt => ({
                    text: opt.text.trim(),
                    isCorrect: !!opt.isCorrect
                }))
            });
        }

        // Execution Phase (Transactions)
        if (validQuestionsToInsert.length > 0) {
            await prisma.$transaction(async (tx) => {
                if (mode === "replace_axis_questions") {
                    // First, delete options and session answers for these questions before deleting the questions
                    const questionsToDelete = await tx.question.findMany({
                        where: { professionId, axis },
                        select: { id: true }
                    });
                    const questionIds = questionsToDelete.map(q => q.id);

                    if (questionIds.length > 0) {
                        await tx.examSessionQuestion.deleteMany({
                            where: { questionId: { in: questionIds } }
                        });
                        await tx.questionOption.deleteMany({
                            where: { questionId: { in: questionIds } }
                        });
                        await tx.question.deleteMany({
                            where: { professionId, axis }
                        });
                    }
                }

                // Insert new questions one by one natively because createMany doesn't support nested relations easily across all Prisma DB connectors
                for (const q of validQuestionsToInsert) {
                    await tx.question.create({
                        data: {
                            professionId,
                            axis,
                            text: q.text,
                            explanation: q.explanation,
                            difficulty: q.difficulty,
                            cognitiveLevel: q.cognitiveLevel,
                            options: {
                                create: q.options
                            }
                        }
                    });
                    report.imported++;
                }
            }, {
                timeout: 30000 // 30 seconds to allow for remote DB latency during 30+ sequential inserts
            });
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error("POST Bulk Import Error:", error);
        return NextResponse.json({ error: "Failed to import questions." }, { status: 500 });
    }
}
