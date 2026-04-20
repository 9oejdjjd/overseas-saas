import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

// --- Similarity Functions (same as import route) ---
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

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    if (set1.size === 0 && set2.size === 0) return 0;
    let intersection = 0;
    for (const word of set1) {
        if (set2.has(word)) intersection++;
    }
    const union = set1.size + set2.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

function getSimilarityScore(
    q1Text: string, q1Answer: string,
    q2Text: string, q2Answer: string
): { isSimilar: boolean, score: number, reason: string } {
    const kw1 = extractKeywords(q1Text);
    const kw2 = extractKeywords(q2Text);
    const questionJaccard = jaccardSimilarity(kw1, kw2);
    const answerSim = bigramSimilarity(q1Answer, q2Answer);
    const textSim = bigramSimilarity(q1Text, q2Text);

    if (textSim >= 0.85) {
        return { isSimilar: true, score: Math.round(textSim * 100), reason: "نص السؤال شبه متطابق" };
    }
    if (questionJaccard >= 0.50 && answerSim >= 0.60) {
        const avg = Math.round(((questionJaccard + answerSim) / 2) * 100);
        return { isSimilar: true, score: avg, reason: "نفس الفكرة ونفس الإجابة" };
    }
    if (questionJaccard >= 0.65) {
        return { isSimilar: true, score: Math.round(questionJaccard * 100), reason: "تشابه كبير في المفاهيم" };
    }
    if (textSim >= 0.70) {
        return { isSimilar: true, score: Math.round(textSim * 100), reason: "تشابه نصي مرتفع" };
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
        if (!professionId || !axis) {
            return NextResponse.json({ error: "professionId and axis are required" }, { status: 400 });
        }

        const questions = await prisma.question.findMany({
            where: { professionId, axis },
            include: { options: true },
            orderBy: { createdAt: 'asc' }
        });

        if (questions.length < 2) {
            return NextResponse.json({ duplicateGroups: [], totalScanned: questions.length });
        }

        // Build QA pairs
        const qaPairs = questions.map(q => ({
            id: q.id,
            text: q.text.trim(),
            correctAnswer: (q.options as any[]).find((o: any) => o.isCorrect)?.text?.trim() || "",
            createdAt: q.createdAt
        }));

        // Find duplicate groups
        const processed = new Set<string>();
        const duplicateGroups: {
            keepId: string;
            keepText: string;
            duplicates: { id: string; text: string; score: number; reason: string }[];
        }[] = [];

        for (let i = 0; i < qaPairs.length; i++) {
            if (processed.has(qaPairs[i].id)) continue;

            const group: { id: string; text: string; score: number; reason: string }[] = [];

            for (let j = i + 1; j < qaPairs.length; j++) {
                if (processed.has(qaPairs[j].id)) continue;

                const result = getSimilarityScore(
                    qaPairs[i].text.toLowerCase(), qaPairs[i].correctAnswer.toLowerCase(),
                    qaPairs[j].text.toLowerCase(), qaPairs[j].correctAnswer.toLowerCase()
                );

                if (result.isSimilar) {
                    group.push({
                        id: qaPairs[j].id,
                        text: qaPairs[j].text,
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
            // Delete session links first
            await tx.examSessionQuestion.deleteMany({
                where: { questionId: { in: questionIds } }
            });
            // Delete options
            await tx.questionOption.deleteMany({
                where: { questionId: { in: questionIds } }
            });
            // Delete questions
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
