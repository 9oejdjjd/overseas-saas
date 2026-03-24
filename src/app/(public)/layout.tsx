import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ar" dir="rtl" className="scroll-smooth">
            <body className="min-h-screen font-sans selection:bg-[#16539a] selection:text-white bg-[#fafafa]">
                <PublicNavbar />
                {children}
            </body>
        </html>
    );
}
