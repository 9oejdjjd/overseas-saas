import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/simple-toast";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة الاعتماد المهني",
  description: "نظام إدارة تسجيل الامتحانات المهنية",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "الاعتماد المهني",
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
      <body className={`${cairo.className} ${cairo.variable} antialiased bg-gray-50 text-gray-900`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
