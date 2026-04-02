import { Metadata } from "next";

export const metadata: Metadata = {
    title: "اتصل بنا | بوابة الاعتماد المهني",
    description: "تواصل مع فريق الدعم الفني وخدمة العملاء في بوابة الاعتماد المهني. نحن هنا لمساعدتك في أي استفسار حول الاختبارات التجريبية أو الاعتماد المهني.",
    keywords: "اتصل بنا, الدعم الفني, خدمة العملاء, بوابة الاعتماد المهني, رقم التواصل",
    alternates: {
        canonical: "/contact",
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
