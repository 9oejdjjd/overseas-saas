import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Normalize phone numbers by stripping all non-digit chars except leading +
function normalizePhone(phone: string): string {
    if (!phone) return "";
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
    return cleaned;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, visitorName, otp } = body;
        const visitorPhone = normalizePhone(body.visitorPhone || "");

        if (!visitorPhone) {
            return NextResponse.json({ error: "رقم الواتساب مطلوب" }, { status: 400 });
        }

        const phoneWithoutPlus = visitorPhone.replace(/^\+/, "");

        if (action === "REQUEST") {
            // 1. Check if the phone belongs to a Registered Applicant
            const applicant = await prisma.applicant.findFirst({
                where: {
                    OR: [
                        { phone: visitorPhone },
                        { phone: phoneWithoutPlus },
                        { whatsappNumber: visitorPhone },
                        { whatsappNumber: phoneWithoutPlus }
                    ]
                }
            });

            if (applicant) {
                // Registered users are automatically trusted
                return NextResponse.json({ isVerified: true });
            }

            // 2. Check if the Mock Visitor is already verified
            const otpRecord = await prisma.mockVisitorOtp.findUnique({ where: { phone: visitorPhone } });
            
            if (otpRecord?.verified) {
                return NextResponse.json({ isVerified: true });
            }

            // 3. Not verified -> Generate 6-digit OTP and send
            const { autoSendDirectMessage } = await import("@/lib/autoSendMessage");
            const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
            
            await prisma.mockVisitorOtp.upsert({
                where: { phone: visitorPhone },
                update: { code, expiresAt: new Date(Date.now() + 5 * 60000), verified: false },
                create: { phone: visitorPhone, code, expiresAt: new Date(Date.now() + 5 * 60000), verified: false }
            });
            
            await autoSendDirectMessage(visitorPhone, "MOCK_EXAM_OTP", { name: visitorName || "عزيزي المستخدم", otp: code });
            
            return NextResponse.json({ requiresOtp: true });
            
        } else if (action === "VERIFY") {
            if (!otp) {
                return NextResponse.json({ error: "رمز التحقق مطلوب" }, { status: 400 });
            }

            const otpRecord = await prisma.mockVisitorOtp.findUnique({ where: { phone: visitorPhone } });
            
            if (!otpRecord || otpRecord.code !== otp) {
                return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 });
            }
            if (otpRecord.expiresAt < new Date()) {
                return NextResponse.json({ error: "انتهت صلاحية الرمز، يرجى طلب رمز جديد" }, { status: 400 });
            }
            
            // Mark as verified
            await prisma.mockVisitorOtp.update({ where: { phone: visitorPhone }, data: { verified: true } });
            
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("OTP API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
    }
}
