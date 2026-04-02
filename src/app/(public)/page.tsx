import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { HeroSection } from "@/components/mock/HeroSection";
import {
    ProblemsSection,
    SolutionSection,
    TimelineSection,
    TrustSection,
    FAQSection,
    CTASection,
    Footer
} from "@/components/mock/LandingComponents";
import { ProfessionSearchSection } from "@/components/mock/ProfessionSearchSection";
import { AchievementsSection } from "@/components/mock/AchievementsSection";
import { ContactSection } from "@/components/mock/ContactSection";

export const metadata: Metadata = {
    title: "بوابة الاعتماد المهني | اختبار تجريبي مجاني للعمالة اليمنية",
    description: "اختبر مستواك قبل اختبار الاعتماد المهني السعودي. اختبارات تجريبية مجانية لمهن: عامل تحميل وتنزيل، سائق شاحنة، خياط، عامل مزرعة والمزيد. نجهزك للنجاح من أول محاولة.",
    keywords: "اعتماد مهني, اختبار تجريبي, عمالة يمنية, السعودية, اختبار مهني, عامل تحميل, سائق شاحنة, خياط, بوابة الاعتماد المهني",
    alternates: {
        canonical: "/",
    },
};

// Server Component — fetches professions at build/request time for SEO
export default async function EnhancedLandingPage() {
    let professions: { id: string; name: string; slug: string }[] = [];
    
    try {
        professions = await prisma.profession.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
            orderBy: { name: "asc" },
        });
    } catch (error) {
        console.warn("Failed to fetch professions for landing page:", error);
    }

    return (
        <main className="min-h-screen bg-[#fafafa] font-sans selection:bg-[#16539a] selection:text-white pb-0 overflow-x-hidden">
            
            {/* HERO SECTION — Client component for interactivity */}
            <HeroSection professions={professions} />

            {/* PAGE SECTIONS — Static, SEO-friendly content */}
            <div className="relative z-20 bg-white">
                <ProblemsSection />
                <div id="about" className="pt-4"></div>
                <SolutionSection />
                <TimelineSection />
                
                <ProfessionSearchSection />
                
                <TrustSection />
                <AchievementsSection />
                
                <div id="faq" className="pt-10"></div>
                <FAQSection />
                <CTASection />
                
                <ContactSection />
                
                <Footer />
            </div>
        </main>
    );
}
