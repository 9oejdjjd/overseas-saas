import { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
    title: "باقات واشتراكات بوابة الاعتماد المهني | خطط الاستعداد والنجاح",
    description: "اختر الباقة الأنسب لك واستعد لاجتياز اختبار الاعتماد المهني السعودي. نوفر باقات مرنة للأفراد واشتراكات مخصصة لقطاع الأعمال ومكاتب السفريات مع ميزات حصرية.",
    keywords: "باقات الاعتماد المهني, رسوم الاعتماد المهني, اشتراك فحص العمالة, سعر اختبار الاعتماد المهني, بوابة الاعتماد المهني, الفحص المهني السعودي",
    alternates: {
        canonical: "/pricing",
    },
};

export default function PricingPage() {
    return <PricingClient />;
}
