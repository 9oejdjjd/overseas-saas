import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await request.json();
        const { id } = await params;
        
        const updatedPackage = await prisma.mockExamPackage.update({
            where: { id },
            data: {
                name: body.name,
                nameEn: body.nameEn,
                description: body.description,
                badge: body.badge,
                color: body.color,
                icon: body.icon,
                examCredits: body.examCredits !== undefined ? Number(body.examCredits) : undefined,
                includesRegistration: body.includesRegistration !== undefined ? Boolean(body.includesRegistration) : undefined,
                includesTransport: body.includesTransport !== undefined ? Boolean(body.includesTransport) : undefined,
                transportType: body.transportType,
                features: body.features,
                examPrice: body.examPrice !== undefined ? Number(body.examPrice) : undefined,
                registrationDiscount: body.registrationDiscount !== undefined ? Number(body.registrationDiscount) : undefined,
                transportDiscount: body.transportDiscount !== undefined ? Number(body.transportDiscount) : undefined,
                price: body.price !== undefined ? Number(body.price) : undefined,
                priceSAR: body.priceSAR !== undefined ? Number(body.priceSAR) : undefined,
                agentPrice: body.agentPrice !== undefined ? Number(body.agentPrice) : undefined,
                actualCost: body.actualCost !== undefined ? Number(body.actualCost) : undefined,
                validityDays: body.validityDays !== undefined ? (body.validityDays ? Number(body.validityDays) : null) : undefined,
                isFree: body.isFree !== undefined ? Boolean(body.isFree) : undefined,
                showResultScore: body.showResultScore !== undefined ? Boolean(body.showResultScore) : undefined,
                showResultQuestions: body.showResultQuestions !== undefined ? Boolean(body.showResultQuestions) : undefined,
                showResultCorrectAnswers: body.showResultCorrectAnswers !== undefined ? Boolean(body.showResultCorrectAnswers) : undefined,
                firstAttemptFullFeatures: body.firstAttemptFullFeatures !== undefined ? Boolean(body.firstAttemptFullFeatures) : undefined,
                allowedQuestionTypes: body.allowedQuestionTypes !== undefined ? String(body.allowedQuestionTypes) : undefined,
                attemptsConfig: body.attemptsConfig !== undefined ? body.attemptsConfig : undefined,
                examQuestionsCount: body.examQuestionsCount !== undefined ? (body.examQuestionsCount ? Number(body.examQuestionsCount) : null) : undefined,
                isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
                isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : undefined,
                sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
            }
        });

        return NextResponse.json(updatedPackage);
    } catch (error) {
        console.error("Error updating mock package:", error);
        return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.mockExamPackage.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting mock package:", error);
        return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
    }
}
