import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

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

// Strip "ال" prefix from Arabic words for better keyword matching
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

// Jaccard similarity on keyword arrays
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

// Bigram character similarity
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

// Word overlap ratio
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

// Combined conceptual similarity check
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

    // Rule 1: Near-identical text (lowered to 55%)
    if (textSim >= 0.55) {
        return { isSimilar: true, score: Math.round(textSim * 100), reason: "نص السؤال شبه متطابق" };
    }

    // Rule 2: Same concept + same answer (very relaxed)
    if (questionJaccard >= 0.25 && answerSim >= 0.45) {
        const avg = Math.round(((questionJaccard + answerSim) / 2) * 100);
        return { isSimilar: true, score: avg, reason: "نفس الفكرة ونفس الإجابة" };
    }

    // Rule 3: High word overlap
    if (overlap >= 0.45) {
        return { isSimilar: true, score: Math.round(overlap * 100), reason: "تشابه كبير في الكلمات المفتاحية" };
    }

    // Rule 4: Keywords overlap moderately
    if (questionJaccard >= 0.35) {
        return { isSimilar: true, score: Math.round(questionJaccard * 100), reason: "تشابه في المفاهيم" };
    }

    // Rule 5: Identical correct answers with any question overlap
    if (answerSim >= 0.60 && questionJaccard >= 0.15) {
        return { isSimilar: true, score: Math.round(answerSim * 100), reason: "إجابة صحيحة متطابقة" };
    }

    // Rule 6: Very similar answers alone
    if (answerSim >= 0.75) {
        return { isSimilar: true, score: Math.round(answerSim * 100), reason: "إجابة صحيحة متشابهة جداً" };
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

        const qaPairs = questions.map(q => ({
            id: q.id,
            text: q.text.trim(),
            axis: q.axis,
            correctAnswer: (q.options as any[]).find((o: any) => o.isCorrect)?.text?.trim() || "",
        }));

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
            await tx.examSessionQuestion.deleteMany({ where: { questionId: { in: questionIds } } });
            await tx.questionOption.deleteMany({ where: { questionId: { in: questionIds } } });
            await tx.question.deleteMany({ where: { id: { in: questionIds } } });
        });

        return NextResponse.json({ deleted: questionIds.length });
    } catch (error) {
        console.error("Delete Duplicates Error:", error);
        return NextResponse.json({ error: "Failed to delete duplicates" }, { status: 500 });
    }
}
