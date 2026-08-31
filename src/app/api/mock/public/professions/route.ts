import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        // Query the active free package to check if it specifies a custom question count
        const freePackage = await prisma.mockExamPackage.findFirst({
            where: { isFree: true, isActive: true },
            select: { examQuestionsCount: true }
        });
        const freePkgCount = freePackage?.examQuestionsCount && freePackage.examQuestionsCount > 0 
            ? freePackage.examQuestionsCount 
            : null;

        const professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                examDuration: true,
                questionCount: true,
                passingScore: true,
                _count: {
                    select: {
                        questions: {
                            where: { isActive: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const availableProfessions = professions
            .filter(p => {
                const requiredCount = freePkgCount !== null ? freePkgCount : p.questionCount;
                return p._count.questions >= requiredCount;
            })
            .map(({ _count, questionCount, ...rest }) => ({
                ...rest,
                questionCount: freePkgCount !== null ? freePkgCount : questionCount
            }));

        return NextResponse.json(availableProfessions);
    } catch (error) {
        console.error("Public GET Professions Error:", error);
        return NextResponse.json({ error: "Failed to fetch professions" }, { status: 500 });
    }
}
