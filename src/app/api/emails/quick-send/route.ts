import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { to, subject, html } = body;

        if (!to || !subject || !html) {
            return NextResponse.json({ error: "المرسل إليه، الموضوع، والمحتوى حقول مطلوبة." }, { status: 400 });
        }

        const { sendMailWithFailover } = await import("@/lib/sendEmail");

        try {
            const result = await sendMailWithFailover({
                to,
                subject,
                text: html.replace(/<[^>]*>/g, ""), // strip html for text fallback
                html
            }, "MANUAL");

            return NextResponse.json({ success: true, messageId: result.messageId });

        } catch (sendErr: any) {
            console.error("Quick send failed:", sendErr);
            return NextResponse.json({ 
                error: sendErr.message || "فشل إرسال البريد عبر جميع الخوادم المتاحة" 
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Quick send API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
