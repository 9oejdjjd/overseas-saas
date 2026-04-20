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

// === Deep Arabic Text Normalization ===
function normalizeArabic(text: string): string {
    return text
        .replace(/[\u064B-\u065F\u0670]/g, '')   // Remove tashkeel
        .replace(/[أإآٱ]/g, 'ا')                  // Normalize alef
        .replace(/ة/g, 'ه')                       // taa marbuta -> haa
        .replace(/ى/g, 'ي')                       // alef maqsura -> yaa
        .replace(/ؤ/g, 'و')                       // waw hamza
        .replace(/ئ/g, 'ي')                       // yaa hamza
        .replace(/ء/g, '')                         // Remove standalone hamza
        .replace(/[\s\p{P}]+/gu, ' ')             // Collapse whitespace & punctuation
        .trim()
        .toLowerCase();
}

function stemWord(word: string): string {
    let w = word;
    if (w.startsWith('ال') && w.length > 3) w = w.slice(2);
    if (w.startsWith('وال') && w.length > 4) w = w.slice(3);
    if (w.startsWith('بال') && w.length > 4) w = w.slice(3);
    if (w.startsWith('فال') && w.length > 4) w = w.slice(3);
    if (w.startsWith('لل') && w.length > 3) w = w.slice(2);
    return w;
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'في', 'من', 'الى', 'على', 'عن', 'مع', 'هو', 'هي', 'هل', 'ما', 'ان', 'لا',
        'او', 'و', 'ثم', 'بل', 'لكن', 'اذا', 'عند', 'بعد', 'قبل', 'حتى', 'كل',
        'هذا', 'هذه', 'ذلك', 'تلك', 'يجب', 'يمكن', 'يتم', 'كان', 'كانت',
        'يكون', 'تكون', 'اي', 'احد', 'بين', 'خلال', 'اثناء', 'عبر',
        'فوق', 'تحت', 'ضد', 'لدى', 'حول', 'دون', 'منها', 'لها', 'له',
        'بها', 'فيها', 'عليها', 'منه', 'لان', 'حيث', 'كيف', 'لماذا',
        'متى', 'اين', 'قد', 'لم', 'لن', 'سوف', 'ليس', 'ليست', 'غير',
        'بدون', 'كذلك', 'ايضا', 'ولكن', 'بينما', 'التي', 'الذي',
        'يعتبر', 'تعتبر', 'يعد', 'تعد', 'عندما', 'بشكل', 'بصوره',
    ]);
    const normalized = normalizeArabic(text);
    const words = normalized.split(/\s+/).filter(w => w.length > 2);
    return words
        .map(w => stemWord(w))
        .filter(w => w.length > 1 && !stopWords.has(w));
}

function jaccardSimilarity(words1: string[], words2: string[]): number {
    if (words1.length === 0 && words2.length === 0) return 0;
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    let intersection = 0;
    for (const word of set1) {
        if (set2.has(word)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function bigramSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const n1 = normalizeArabic(str1).replace(/\s/g, '');
    const n2 = normalizeArabic(str2).replace(/\s/g, '');
    if (n1 === n2) return 1;
    if (n1.length < 2 || n2.length < 2) return 0;
    const bg1 = new Set<string>();
    const bg2 = new Set<string>();
    for (let i = 0; i < n1.length - 1; i++) bg1.add(n1.slice(i, i + 2));
    for (let i = 0; i < n2.length - 1; i++) bg2.add(n2.slice(i, i + 2));
    let intersectionSize = 0;
    for (const bg of bg1) {
        if (bg2.has(bg)) intersectionSize++;
    }
    return (2.0 * intersectionSize) / (bg1.size + bg2.size);
}

function wordOverlap(words1: string[], words2: string[]): number {
    if (words1.length === 0 || words2.length === 0) return 0;
    const set2 = new Set(words2);
    let matches = 0;
    for (const w of words1) {
        if (set2.has(w)) matches++;
    }
    const minLen = Math.min(words1.length, words2.length);
    return minLen === 0 ? 0 : matches / minLen;
}

function getSimilarityResult(
    q1Text: string, q1Answer: string,
    q2Text: string, q2Answer: string
): { isSimilar: boolean; score: number; reason: string } {
    const kw1 = extractKeywords(q1Text);
    const kw2 = extractKeywords(q2Text);
    const questionJaccard = jaccardSimilarity(kw1, kw2);
    const overlap = wordOverlap(kw1, kw2);
    const answerSim = bigramSimilarity(q1Answer, q2Answer);
    const textSim = bigramSimilarity(q1Text, q2Text);

    if (textSim >= 0.55) return { isSimilar: true, score: Math.round(textSim * 100), reason: "نص السؤال شبه متطابق" };
    if (questionJaccard >= 0.25 && answerSim >= 0.45) return { isSimilar: true, score: Math.round(((questionJaccard + answerSim) / 2) * 100), reason: "نفس الفكرة ونفس الإجابة" };
    if (overlap >= 0.45) return { isSimilar: true, score: Math.round(overlap * 100), reason: "تشابه كبير في الكلمات المفتاحية" };
    if (questionJaccard >= 0.35) return { isSimilar: true, score: Math.round(questionJaccard * 100), reason: "تشابه في المفاهيم" };
    if (answerSim >= 0.60 && questionJaccard >= 0.15) return { isSimilar: true, score: Math.round(answerSim * 100), reason: "إجابة صحيحة متطابقة" };
    if (answerSim >= 0.75) return { isSimilar: true, score: Math.round(answerSim * 100), reason: "إجابة صحيحة متشابهة جداً" };

    return { isSimilar: false, score: 0, reason: "" };
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

        // Fetch existing questions WITH options to allow conceptual duplication checks
        const existingDBQuestions = await prisma.question.findMany({
            where: { professionId, axis },
            include: { options: true }
        });
        
        const existingQA = existingDBQuestions.map(q => ({
            text: q.text.trim(),
            correctAnswer: (q.options as any[]).find((o: any) => o.isCorrect)?.text?.trim() || ""
        }));
        const existingTexts = new Set(existingQA.map(q => q.text.toLowerCase()));
        const validQuestionsToInsert: any[] = [];
        const report = {
            totalProvided: questions.length,
            imported: 0,
            skippedDuplicates: 0,
            failed: 0,
            errors: [] as { index: number, text: string, reason: string }[],
        };

        const currentBatchTexts = new Set<string>();
        const currentBatchQA: { text: string, correctAnswer: string }[] = [];

        // Validation & Duplicate Checking loop
        for (let i = 0; i < questions.length; i++) {
            const q: QuestionInput = questions[i];
            const qText = q.text?.trim() || "";

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

            if (!qText) {
                report.failed++;
                report.errors.push({ index: i, text: "N/A", reason: "نص السؤال مفقود." });
                continue;
            }

            const normalizedText = qText.toLowerCase();
            const correctOption = q.options.find(o => o.isCorrect);
            const correctAnswerText = correctOption?.text?.trim() || "";

            // Duplicate in same file check (exact + conceptual)
            if (currentBatchTexts.has(normalizedText)) {
                report.skippedDuplicates++;
                report.errors.push({ index: i, text: qText, reason: "سؤال مكرر حرفياً داخل نفس ملف الـ JSON." });
                continue;
            }
            
            let batchDuplicate = false;
            for (const existing of currentBatchQA) {
                if (getSimilarityResult(normalizedText, correctAnswerText, existing.text, existing.correctAnswer).isSimilar) {
                    batchDuplicate = true;
                    break;
                }
            }
            if (batchDuplicate) {
                report.skippedDuplicates++;
                report.errors.push({ index: i, text: qText, reason: "فكرة السؤال مكررة داخل نفس الملف." });
                continue;
            }

            currentBatchTexts.add(normalizedText);
            currentBatchQA.push({ text: normalizedText, correctAnswer: correctAnswerText });

            // Duplicate in DB check (Conceptual Similarity)
            if (mode !== "replace_axis_questions") {
                let isSimilar = false;

                if (existingTexts.has(normalizedText)) {
                    isSimilar = true;
                } else {
                    for (const existing of existingQA) {
                        const simResult = getSimilarityResult(normalizedText, correctAnswerText, existing.text, existing.correctAnswer);
                        if (simResult.isSimilar) {
                            isSimilar = true;
                            break;
                        }
                    }
                }

                if (isSimilar) {
                    if (mode === "skip_duplicates") {
                        report.skippedDuplicates++;
                        report.errors.push({ index: i, text: qText, reason: "تم رفض السؤال: فكرته متكررة مع سؤال سابق بالموقع." });
                        continue;
                    } else if (mode === "append") {
                        report.failed++;
                        report.errors.push({ index: i, text: qText, reason: "يوجد تشابه عالي مع سؤال آخر (تم حظر الاستيراد)." });
                        continue;
                    }
                }
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
