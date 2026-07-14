import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone-utils";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, visitorName, otp, deliveryMethod = "WHATSAPP", email, professionName } = body;
        const visitorPhone = normalizePhone(body.visitorPhone || "");

        if (!visitorPhone) {
            return NextResponse.json({ error: "رقم الواتساب مطلوب" }, { status: 400 });
        }

        const phoneWithoutPlus = visitorPhone.replace(/^\+/, "");

        if (action === "REQUEST") {
            console.log("[OTP] REQUEST received:", { visitorPhone, email, visitorName, deliveryMethod });
            
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
            console.log("[OTP] Applicant found:", !!applicant);

            // 2. Check previous OTP requests
            const otpRecord = await prisma.mockVisitorOtp.findFirst({
                where: {
                    OR: [
                        { phone: visitorPhone },
                        { phone: phoneWithoutPlus },
                        { phone: `+${phoneWithoutPlus}` }
                    ]
                }
            });
            console.log("[OTP] Existing OTP record:", otpRecord ? { phone: otpRecord.phone, expiresAt: otpRecord.expiresAt, verified: otpRecord.verified } : null);
            
            // 3. Rate Limiting Checks
            if (otpRecord) {
                // Progressive cooldown logic based on daily attempts
                const now = new Date();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastAttemptDate = new Date(otpRecord.lastAttemptAt);
                lastAttemptDate.setHours(0, 0, 0, 0);
                
                const isSameDay = today.getTime() === lastAttemptDate.getTime();
                const dailyCount = isSameDay ? otpRecord.dailyAttempts : 0;

                if (isSameDay) {
                    let cooldownSeconds = 0;
                    if (dailyCount === 1) cooldownSeconds = 30;
                    else if (dailyCount === 2) cooldownSeconds = 60;
                    else if (dailyCount >= 3) cooldownSeconds = 600;

                    const nextAllowedTime = new Date(otpRecord.lastAttemptAt.getTime() + cooldownSeconds * 1000);
                    
                    if (now < nextAllowedTime) {
                        const remainingSeconds = Math.ceil((nextAllowedTime.getTime() - now.getTime()) / 1000);
                        console.log("[OTP] BLOCKED by cooldown. Remaining:", remainingSeconds, "seconds");
                        return NextResponse.json({ 
                            error: `يرجى الانتظار ${Math.ceil(remainingSeconds / 60)} دقيقة قبل طلب رمز جديد`,
                            cooldown: remainingSeconds
                        }, { status: 429 });
                    }
                }
                
                if (dailyCount >= 5) {
                    console.log("[OTP] BLOCKED by daily limit:", dailyCount);
                    return NextResponse.json({ 
                        error: "لقد تجاوزت الحد المسموح لطلب رمز التحقق اليوم (5 محاولات). يرجى المحاولة غداً." 
                    }, { status: 429 });
                }
            }

            // 4. Generate 6-digit OTP and send
            const { autoSendDirectMessage } = await import("@/lib/autoSendMessage");
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const now = new Date();
            const currentDailyAttempts = otpRecord ? 
                (new Date(otpRecord.lastAttemptAt).toDateString() === now.toDateString() ? otpRecord.dailyAttempts : 0) : 0;
            
            console.log("[OTP] Generated code:", code, "for phone:", visitorPhone);
            
            // Set OTP validity to 15 minutes (so it doesn't expire while they are waiting for the cooldown)
            const expiryTime = new Date(Date.now() + 15 * 60000);

            await prisma.mockVisitorOtp.upsert({
                where: { phone: visitorPhone },
                update: { 
                    code, 
                    expiresAt: expiryTime, 
                    verified: false,
                    dailyAttempts: currentDailyAttempts + 1,
                    lastAttemptAt: now
                },
                create: { 
                    phone: visitorPhone, 
                    code, 
                    expiresAt: expiryTime, 
                    verified: false,
                    dailyAttempts: 1,
                    lastAttemptAt: now
                }
            });
            console.log("[OTP] Saved to DB");
            
            // 5. Send OTP to both Email and WhatsApp concurrently
            console.log("[OTP] Sending to Email:", email, "and WhatsApp:", visitorPhone);
            
            const emailPromise = email ? (async () => {
                try {
                    const { sendOTPByEmail } = await import("@/lib/sendEmail");
                    const result = await sendOTPByEmail(email, visitorName || "عزيزي المستخدم", code, professionName);
                    console.log("[OTP] Email result:", result);
                    return result;
                } catch (e) {
                    console.error("[OTP] Email error:", e);
                    return { success: false, error: String(e) };
                }
            })() : Promise.resolve({ success: false });

            const waPromise = autoSendDirectMessage(visitorPhone, "MOCK_EXAM_OTP", { name: visitorName || "عزيزي المستخدم", otp: code })
                .catch((e) => { console.error("[OTP] WhatsApp error:", e); return false; });

            const [emailResult] = await Promise.allSettled([emailPromise, waPromise]);
            console.log("[OTP] Email settled:", emailResult);
            
            // If email was provided but failed
            if (email && emailResult.status === "fulfilled" && !emailResult.value.success) {
                 console.error("[OTP] Email sending failed, returning error");
                 return NextResponse.json({ error: "فشل في إرسال البريد الإلكتروني، يرجى التأكد من الإيميل والمحاولة لاحقاً" }, { status: 500 });
            }
            
            console.log("[OTP] SUCCESS - OTP sent");
            return NextResponse.json({ requiresOtp: true });
            
        } else if (action === "VERIFY") {
            if (!otp) {
                return NextResponse.json({ error: "رمز التحقق مطلوب" }, { status: 400 });
            }

            const otpRecord = await prisma.mockVisitorOtp.findFirst({
                where: {
                    OR: [
                        { phone: visitorPhone },
                        { phone: phoneWithoutPlus },
                        { phone: `+${phoneWithoutPlus}` }
                    ]
                }
            });
            
            if (!otpRecord || otpRecord.code !== otp) {
                return NextResponse.json({ error: "رمز التحقق غير صحيح" }, { status: 400 });
            }
            if (otpRecord.expiresAt < new Date()) {
                return NextResponse.json({ error: "انتهت صلاحية الرمز، يرجى طلب رمز جديد" }, { status: 400 });
            }
            
            // Mark as verified using the matched record's actual phone key
            await prisma.mockVisitorOtp.update({ where: { phone: otpRecord.phone }, data: { verified: true } });
            
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("OTP API Error:", error);
        return NextResponse.json({ error: "حدث خطأ أثناء معالجة الطلب" }, { status: 500 });
    }
}
