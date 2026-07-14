import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const packages = await prisma.mockExamPackage.findMany({
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json(packages);
    } catch (error) {
        console.error("Error fetching mock packages:", error);
        return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        const newPackage = await prisma.mockExamPackage.create({
            data: {
                name: body.name,
                nameEn: body.nameEn || null,
                description: body.description || null,
                badge: body.badge || null,
                color: body.color || null,
                icon: body.icon || null,
                examCredits: Number(body.examCredits),
                includesRegistration: Boolean(body.includesRegistration),
                includesTransport: Boolean(body.includesTransport),
                transportType: body.transportType || null,
                features: body.features || [],
                examPrice: Number(body.examPrice || 0),
                registrationDiscount: Number(body.registrationDiscount || 0),
                transportDiscount: Number(body.transportDiscount || 0),
                price: Number(body.price || 0),
                priceSAR: Number(body.priceSAR || 0),
                actualCost: Number(body.actualCost || 0),
                validityDays: body.validityDays ? Number(body.validityDays) : null,
                isFree: Boolean(body.isFree),
                showResultScore: body.showResultScore !== undefined ? Boolean(body.showResultScore) : true,
                showResultQuestions: body.showResultQuestions !== undefined ? Boolean(body.showResultQuestions) : true,
                showResultCorrectAnswers: body.showResultCorrectAnswers !== undefined ? Boolean(body.showResultCorrectAnswers) : true,
                firstAttemptFullFeatures: body.firstAttemptFullFeatures !== undefined ? Boolean(body.firstAttemptFullFeatures) : false,
                allowedQuestionTypes: body.allowedQuestionTypes !== undefined ? String(body.allowedQuestionTypes) : "MCQ,TRUE_FALSE,FILL_BLANK,IMAGE",
                attemptsConfig: body.attemptsConfig || [],
                isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
                isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
                sortOrder: Number(body.sortOrder || 0),
            }
        });

        return NextResponse.json(newPackage);
    } catch (error) {
        console.error("Error creating mock package:", error);
        return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
    }
}
