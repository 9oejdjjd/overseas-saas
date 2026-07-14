import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

interface Props {
    params: Promise<{ packageId: string }>
}

export async function generateMetadata({ params }: Props) {
    const { packageId } = await params;
    const pkg = await prisma.mockExamPackage.findUnique({
        where: { id: packageId },
        select: { name: true }
    });

    return {
        title: pkg ? `إتمام الاشتراك في ${pkg.name} | بوابة الاعتماد المهني` : "إتمام الاشتراك | بوابة الاعتماد المهني",
        description: "صفحة إتمام التسجيل والاشتراك وبوابة الدفع الإلكترونية الآمنة"
    };
}

export default async function CheckoutPage({ params }: Props) {
    const { packageId } = await params;

    const pkg = await prisma.mockExamPackage.findUnique({
        where: { id: packageId }
    });

    if (!pkg || !pkg.isActive) {
        return notFound();
    }

    // Convert decimals and JSON fields to plain objects for safe client serialization
    const serializedPkg = {
        id: pkg.id,
        name: pkg.name,
        nameEn: pkg.nameEn || "",
        description: pkg.description || "",
        price: Number(pkg.price || 0),
        priceSAR: Number(pkg.priceSAR || 0),
        examCredits: pkg.examCredits,
        validityDays: pkg.validityDays,
        features: Array.isArray(pkg.features) 
            ? (pkg.features as any[]).map(f => String(f)) 
            : [],
        includesRegistration: pkg.includesRegistration,
        includesTransport: pkg.includesTransport,
        examPrice: Number(pkg.examPrice || 0),
        registrationDiscount: Number(pkg.registrationDiscount || 0),
        transportDiscount: Number(pkg.transportDiscount || 0),
        transportType: pkg.transportType || null,
        actualCost: Number(pkg.actualCost || 0)
    };

    return <CheckoutClient package={serializedPkg} />;
}
