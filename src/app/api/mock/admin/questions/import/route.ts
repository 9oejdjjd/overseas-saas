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

        // Fetch existing questions for duplicate checking
        const existingDBQuestions = await prisma.question.findMany({
            where: { professionId, axis }
        });
        const existingTexts = new Set(existingDBQuestions.map(q => q.text.trim().toLowerCase()));

        const validQuestionsToInsert: any[] = [];
        const report = {
            totalProvided: questions.length,
            imported: 0,
            skippedDuplicates: 0,
            failed: 0,
            errors: [] as { index: number, text: string, reason: string }[],
        };

        const currentBatchTexts = new Set<string>();

        // Validation & Duplicate Checking loop
        for (let i = 0; i < questions.length; i++) {
            const q: QuestionInput = questions[i];
            const qText = q.text?.trim() || "";

            if (!qText) {
                report.failed++;
                report.errors.push({ index: i, text: "N/A", reason: "Missing question text." });
                continue;
            }

            const normalizedText = qText.toLowerCase();

            // Duplicate in same file check
            if (currentBatchTexts.has(normalizedText)) {
                report.skippedDuplicates++;
                report.errors.push({ index: i, text: qText, reason: "Duplicate inside the uploaded JSON file." });
                continue;
            }
            currentBatchTexts.add(normalizedText);

            // Duplicate in DB check
            if (mode !== "replace_axis_questions" && existingTexts.has(normalizedText)) {
                if (mode === "skip_duplicates") {
                    report.skippedDuplicates++;
                    report.errors.push({ index: i, text: qText, reason: "Already exists in database for this axis." });
                    continue;
                } else if (mode === "append") {
                    // In append mode, do we allow duplicates? User said: "لا يوجد تكرار في نفس المهنة + المحور داخل قاعدة البيانات"
                    // So we must ALWAYS skip or reject duplicates.
                    report.failed++;
                    report.errors.push({ index: i, text: qText, reason: "Duplicate found in database. Append mode rejects duplicates." });
                    continue;
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
