import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const url = new URL(request.url);
        const professionId = url.searchParams.get("professionId");
        const isActive = url.searchParams.get("isActive");
        const axis = url.searchParams.get("axis");
        const type = url.searchParams.get("type");
        const cognitiveLevel = url.searchParams.get("cognitiveLevel");
        const difficulty = url.searchParams.get("difficulty");
        const sortOrder = url.searchParams.get("sortOrder") || "desc"; // desc = newest first, asc = oldest first

        const where: any = {};
        if (professionId && professionId !== "ALL") where.professionId = professionId;
        if (isActive !== null) where.isActive = isActive === "true";
        if (axis && axis !== "ALL") where.axis = axis;
        if (type && type !== "ALL") {
            if (type === "IMAGE") {
                where.imageUrl = { not: null, notIn: ["", "null"] };
            } else {
                where.type = type;
                where.OR = [
                    { imageUrl: null },
                    { imageUrl: "" },
                    { imageUrl: "null" }
                ];
            }
        }
        if (cognitiveLevel && cognitiveLevel !== "ALL") where.cognitiveLevel = cognitiveLevel;
        if (difficulty && difficulty !== "ALL") where.difficulty = difficulty;

        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const skip = (page - 1) * limit;
        
        // if limit === -1, fetch all
        const fetchAll = limit === -1;

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                include: {
                    options: true,
                    profession: { select: { name: true, slug: true } }
                },
                orderBy: { createdAt: sortOrder === "asc" ? "asc" : "desc" },
                ...(fetchAll ? {} : { skip, take: limit })
            }),
            prisma.question.count({ where })
        ]);

        return NextResponse.json({
            data: questions,
            pagination: {
                total,
                page: fetchAll ? 1 : page,
                limit: fetchAll ? total : limit,
                totalPages: fetchAll ? 1 : Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("GET Questions Error:", error);
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { professionId, text, explanation, difficulty, isActive, options, axis, cognitiveLevel } = body;

        if (!professionId || !text || !options || !Array.isArray(options) || options.length !== 4) {
            return NextResponse.json({ error: "Invalid data. Must provide text and exactly 4 options." }, { status: 400 });
        }

        const correctCount = options.filter(opt => opt.isCorrect).length;
        if (correctCount !== 1) {
            return NextResponse.json({ error: "Exactly one option must be correct." }, { status: 400 });
        }

        const question = await prisma.question.create({
            data: {
                professionId,
                text,
                explanation,
                axis: axis || "PROFESSION_KNOWLEDGE",
                difficulty: difficulty || "HARD",
                cognitiveLevel: cognitiveLevel || "K2",
                isActive: isActive ?? true,
                options: {
                    create: options.map(opt => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect || false
                    }))
                }
            },
            include: { options: true }
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("POST Question Error:", error);
        return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
    }
}

// DELETE all or selected questions
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Try parsing JSON body to see if it contains questionIds
        const body = await request.json().catch(() => null);

        if (body && Array.isArray(body.questionIds)) {
            const { questionIds } = body;
            
            // Delete only selected questions in a safe transaction
            const [deletedSessionQuestions, deletedOptions, deletedQuestions] = await prisma.$transaction([
                prisma.examSessionQuestion.deleteMany({
                    where: { questionId: { in: questionIds } }
                }),
                prisma.questionOption.deleteMany({
                    where: { questionId: { in: questionIds } }
                }),
                prisma.question.deleteMany({
                    where: { id: { in: questionIds } }
                })
            ]);

            return NextResponse.json({
                success: true,
                count: questionIds.length,
                deleted: {
                    questions: deletedQuestions.count,
                    options: deletedOptions.count,
                    sessionQuestions: deletedSessionQuestions.count
                }
            });
        }

        // Fallback to DELETE all questions (bulk purge for regeneration)
        // Delete in correct order due to foreign key constraints
        // 1. Delete all exam session question links
        const deletedSessionQuestions = await prisma.examSessionQuestion.deleteMany({});
        // 2. Delete all question options
        const deletedOptions = await prisma.questionOption.deleteMany({});
        // 3. Delete all questions
        const deletedQuestions = await prisma.question.deleteMany({});
        // 4. Delete all AI generation job records
        const deletedJobs = await prisma.aIGenerationJob.deleteMany({});

        return NextResponse.json({
            success: true,
            deleted: {
                questions: deletedQuestions.count,
                options: deletedOptions.count,
                sessionQuestions: deletedSessionQuestions.count,
                aiJobs: deletedJobs.count
            }
        });
    } catch (error) {
        console.error("DELETE Questions Error:", error);
        return NextResponse.json({ error: "Failed to delete questions" }, { status: 500 });
    }
}
