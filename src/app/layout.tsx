import type { Metadata } from "next";
import { Almarai, Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/simple-toast";
import { GlobalSchema } from "@/components/seo/GlobalSchema";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

import { getBaseUrl } from "@/lib/baseUrl";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "بوابة الاعتماد المهني | اختبار تجريبي مجاني للعمالة اليمنية",
  description: "اختبر مستواك قبل اختبار الاعتماد المهني السعودي. اختبارات تجريبية مجانية لمهن: عامل تحميل وتنزيل، سائق شاحنة، خياط، عامل مزرعة والمزيد. نجهزك للنجاح من أول محاولة.",
  keywords: "اعتماد مهني, اختبار تجريبي, عمالة يمنية, السعودية, اختبار مهني, عامل تحميل, سائق شاحنة, خياط, بوابة الاعتماد المهني",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icons/icon-192x192.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "بوابة الاعتماد المهني | اختبر مستواك مجاناً",
    description: "منصة تجهزك لاختبار الاعتماد المهني السعودي بأسلوب سهل وبسيط. اختبارات تجريبية مجانية لجميع المهن الحرفية.",
    type: "website",
    locale: "ar_YE",
    images: [
      {
        url: "/logo1.png",
        width: 1200,
        height: 630,
        alt: "بوابة الاعتماد المهني",
      },
    ],
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
      <body className={`${almarai.className} ${almarai.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        <GlobalSchema />
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

