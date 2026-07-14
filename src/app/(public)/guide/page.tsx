import { Metadata } from "next";
import prisma from "@/lib/prisma";
import GuideClient from "./GuideClient";

export const metadata: Metadata = {
    title: "دليل المهن الحرفية والاعتماد المهني | بوابة الاعتماد المهني",
    description: "تصفح الدليل الكامل وتصنيفات المهن المتاحة للفحص والاعتماد المهني السعودي. اعثر على مهنتك واطلع على ميزات ومدة الاختبار لكل تخصص.",
    keywords: "دليل المهن, دليل الفحص المهني, تخصصات الاعتماد المهني, اختبارات تجريبية, بوابة الاعتماد المهني",
    alternates: {
        canonical: "/guide",
    },
};

export default async function GuidePage() {
    let professions: any[] = [];
    
    try {
        professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true, questionCount: true, examDuration: true },
            orderBy: { name: "asc" }
        });
    } catch (error) {
        console.warn("Failed to fetch professions for guide directory:", error);
    }

    return <GuideClient initialProfessions={professions} />;
}
