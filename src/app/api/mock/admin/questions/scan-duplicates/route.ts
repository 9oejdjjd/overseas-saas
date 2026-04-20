import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// --- Enhanced Similarity Functions ---

function normalizeArabic(text: string): string {
    return text
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel/diacritics
        .replace(/[أإآ]/g, 'ا')               // Normalize alef variants
        .replace(/ة/g, 'ه')                   // Normalize taa marbuta
        .replace(/ى/g, 'ي')                   // Normalize alef maqsura
        .replace(/ؤ/g, 'و')                   // Normalize waw hamza
        .replace(/ئ/g, 'ي')                   // Normalize yaa hamza
        .replace(/[\s\p{P}]+/gu, ' ')         // Collapse whitespace & punctuation
        .trim()
        .toLowerCase();
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'في', 'من', 'إلى', 'الى', 'على', 'عن', 'مع', 'هو', 'هي', 'هل', 'ما', 'أن', 'ان', 'لا',
        'أو', 'او', 'و', 'ثم', 'بل', 'لكن', 'إذا', 'اذا', 'عند', 'بعد', 'قبل', 'حتى', 'كل',
        'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'اللذين', 'التاليه', 'التالي',
        'يجب', 'يمكن', 'يتم', 'كان', 'كانت', 'يكون', 'تكون', 'أي', 'اي', 'أحد', 'احد', 'بين',
        'خلال', 'أثناء', 'اثناء', 'عبر', 'فوق', 'تحت', 'ضد', 'لدى', 'حول', 'دون',
        'الأكثر', 'الاكثر', 'الأقل', 'الاقل', 'الأفضل', 'الافضل',
        'الصحيح', 'الصحيحه', 'الخاطئه', 'الخاطيه',
        'السؤال', 'الإجابه', 'الاجابه', 'الخيار', 'العامل', 'المهني', 'العمل',
        'عند', 'منها', 'لها', 'له', 'بها', 'فيها', 'عليها', 'منه', 'لان', 'لأن',
        'حيث', 'كيف', 'لماذا', 'متى', 'اين', 'أين', 'الذين', 'التى',
        'تعتبر', 'يعتبر', 'يعد', 'تعد', 'احد', 'إحدى', 'احدى',
        'قد', 'لم', 'لن', 'سوف', 'ليس', 'ليست', 'غير', 'بدون',
        'اذ', 'إذ', 'كذلك', 'ايضا', 'أيضا', 'ولكن', 'بينما',
    ]);
    const normalized = normalizeArabic(text);
    const words = normalized.split(/\s+/).filter(w => w.length > 2);
    return words.filter(w => !stopWords.has(w));
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

function getBigrams(str: string): Set<string> {
    const bigrams = new Set<string>();
    const normalized = normalizeArabic(str);
    for (let i = 0; i < normalized.length - 1; i++) {
        bigrams.add(normalized.slice(i, i + 2));
    }
    return bigrams;
}

function bigramSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    const n1 = normalizeArabic(str1);
    const n2 = normalizeArabic(str2);
    if (n1 === n2) return 1;
    if (n1.length < 2 || n2.length < 2) return 0;
    const bg1 = getBigrams(n1);
    const bg2 = getBigrams(n2);
    let intersectionSize = 0;
    for (const bg of bg1) {
        if (bg2.has(bg)) intersectionSize++;
    }
    return (2.0 * intersectionSize) / (bg1.size + bg2.size);
}

function getSimilarityResult(
    q1Text: string, q1Answer: string,
    q2Text: string, q2Answer: string
): { isSimilar: boolean; score: number; reason: string } {
    const kw1 = extractKeywords(q1Text);
    const kw2 = extractKeywords(q2Text);
    const questionJaccard = jaccardSimilarity(kw1, kw2);
    const answerSim = bigramSimilarity(q1Answer, q2Answer);
    const textSim = bigramSimilarity(q1Text, q2Text);

    // Rule 1: Near-identical text
    if (textSim >= 0.75) {
        return { isSimilar: true, score: Math.round(textSim * 100), reason: "نص السؤال شبه متطابق" };
    }

    // Rule 2: Same concept + same answer (relaxed thresholds)
    if (questionJaccard >= 0.35 && answerSim >= 0.50) {
        const avg = Math.round(((questionJaccard + answerSim) / 2) * 100);
        return { isSimilar: true, score: avg, reason: "نفس الفكرة ونفس الإجابة" };
    }

    // Rule 3: Very similar keywords
    if (questionJaccard >= 0.50) {
        return { isSimilar: true, score: Math.round(questionJaccard * 100), reason: "تشابه كبير في المفاهيم" };
    }

    // Rule 4: Text similarity moderate
    if (textSim >= 0.60) {
        return { isSimilar: true, score: Math.round(textSim * 100), reason: "تشابه نصي مرتفع" };
    }

    // Rule 5: Identical correct answers with some question overlap
    if (answerSim >= 0.75 && questionJaccard >= 0.25) {
        return { isSimilar: true, score: Math.round(answerSim * 100), reason: "إجابة صحيحة متطابقة مع تشابه بالسؤال" };
    }

    return { isSimilar: false, score: 0, reason: "" };
}

// POST: Scan for duplicates
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { professionId, axis } = await request.json();
        if (!professionId) {
            return NextResponse.json({ error: "professionId is required" }, { status: 400 });
        }

        // If axis is "ALL", scan all questions for the profession across all axes
        const whereClause: any = { professionId };
        if (axis && axis !== "ALL") {
            whereClause.axis = axis;
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            include: { options: true },
            orderBy: { createdAt: 'asc' }
        });

        if (questions.length < 2) {
            return NextResponse.json({ duplicateGroups: [], totalScanned: questions.length, totalDuplicates: 0 });
        }

        // Build QA pairs
        const qaPairs = questions.map(q => ({
            id: q.id,
            text: q.text.trim(),
            axis: q.axis,
            correctAnswer: (q.options as any[]).find((o: any) => o.isCorrect)?.text?.trim() || "",
        }));

        // Find duplicate groups
        const processed = new Set<string>();
        const duplicateGroups: {
            keepId: string;
            keepText: string;
            keepAxis: string;
            duplicates: { id: string; text: string; axis: string; score: number; reason: string }[];
        }[] = [];

        for (let i = 0; i < qaPairs.length; i++) {
            if (processed.has(qaPairs[i].id)) continue;

            const group: { id: string; text: string; axis: string; score: number; reason: string }[] = [];

            for (let j = i + 1; j < qaPairs.length; j++) {
                if (processed.has(qaPairs[j].id)) continue;

                const result = getSimilarityResult(
                    qaPairs[i].text, qaPairs[i].correctAnswer,
                    qaPairs[j].text, qaPairs[j].correctAnswer
                );

                if (result.isSimilar) {
                    group.push({
                        id: qaPairs[j].id,
                        text: qaPairs[j].text,
                        axis: qaPairs[j].axis,
                        score: result.score,
                        reason: result.reason
                    });
                    processed.add(qaPairs[j].id);
                }
            }

            if (group.length > 0) {
                processed.add(qaPairs[i].id);
                duplicateGroups.push({
                    keepId: qaPairs[i].id,
                    keepText: qaPairs[i].text,
                    keepAxis: qaPairs[i].axis,
                    duplicates: group
                });
            }
        }

        return NextResponse.json({
            totalScanned: questions.length,
            duplicateGroups,
            totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0)
        });
    } catch (error) {
        console.error("Scan Duplicates Error:", error);
        return NextResponse.json({ error: "Failed to scan duplicates" }, { status: 500 });
    }
}

// DELETE: Remove specific duplicate question IDs
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { questionIds } = await request.json();
        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return NextResponse.json({ error: "questionIds array is required" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.examSessionQuestion.deleteMany({
                where: { questionId: { in: questionIds } }
            });
            await tx.questionOption.deleteMany({
                where: { questionId: { in: questionIds } }
            });
            await tx.question.deleteMany({
                where: { id: { in: questionIds } }
            });
        });

        return NextResponse.json({ deleted: questionIds.length });
    } catch (error) {
        console.error("Delete Duplicates Error:", error);
        return NextResponse.json({ error: "Failed to delete duplicates" }, { status: 500 });
    }
}
