import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const originalPackage = await prisma.mockExamPackage.findUnique({
            where: { id }
        });

        if (!originalPackage) {
            return NextResponse.json({ error: "Package not found" }, { status: 404 });
        }

        const duplicatePackage = await prisma.mockExamPackage.create({
            data: {
                name: `${originalPackage.name} (نسخة)`,
                nameEn: originalPackage.nameEn ? `${originalPackage.nameEn} (Copy)` : null,
                description: originalPackage.description,
                badge: originalPackage.badge,
                color: originalPackage.color,
                icon: originalPackage.icon,
                examCredits: originalPackage.examCredits,
                includesRegistration: originalPackage.includesRegistration,
                includesTransport: originalPackage.includesTransport,
                transportType: originalPackage.transportType,
                features: originalPackage.features ? JSON.parse(JSON.stringify(originalPackage.features)) : [],
                price: originalPackage.price,
                priceSAR: originalPackage.priceSAR,
                examPrice: originalPackage.examPrice,
                agentPrice: originalPackage.agentPrice,
                actualCost: originalPackage.actualCost,
                validityDays: originalPackage.validityDays,
                isFree: originalPackage.isFree,
                showResultScore: originalPackage.showResultScore,
                showResultQuestions: originalPackage.showResultQuestions,
                showResultCorrectAnswers: originalPackage.showResultCorrectAnswers,
                firstAttemptFullFeatures: originalPackage.firstAttemptFullFeatures,
                allowedQuestionTypes: originalPackage.allowedQuestionTypes,
                attemptsConfig: originalPackage.attemptsConfig ? JSON.parse(JSON.stringify(originalPackage.attemptsConfig)) : [],
                examQuestionsCount: originalPackage.examQuestionsCount,
                isActive: false, // Create duplicates as inactive by default
                isFeatured: false,
                sortOrder: originalPackage.sortOrder + 1,
            }
        });

        return NextResponse.json(duplicatePackage);
    } catch (error) {
        console.error("Error duplicating mock package:", error);
        return NextResponse.json({ error: "Failed to duplicate package" }, { status: 500 });
    }
}
