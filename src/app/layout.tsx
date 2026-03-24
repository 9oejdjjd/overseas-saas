import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/simple-toast";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بوابة الاعتماد المهني | اختبار تجريبي مجاني للعمالة اليمنية",
  description: "اختبر مستواك قبل اختبار الاعتماد المهني السعودي. اختبارات تجريبية مجانية لمهن: عامل تحميل وتنزيل، سائق شاحنة، خياط، عامل مزرعة والمزيد. نجهزك للنجاح من أول محاولة.",
  keywords: "اعتماد مهني, اختبار تجريبي, عمالة يمنية, السعودية, اختبار مهني, عامل تحميل, سائق شاحنة, خياط, بوابة الاعتماد المهني",
  manifest: "/manifest.json",
  openGraph: {
    title: "بوابة الاعتماد المهني | اختبر مستواك مجاناً",
    description: "منصة تجهزك لاختبار الاعتماد المهني السعودي بأسلوب سهل وبسيط. اختبارات تجريبية مجانية لجميع المهن الحرفية.",
    type: "website",
    locale: "ar_YE",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "بوابة الاعتماد المهني",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${ibmPlexArabic.className} ${ibmPlexArabic.variable} antialiased bg-gray-50 text-gray-900`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

