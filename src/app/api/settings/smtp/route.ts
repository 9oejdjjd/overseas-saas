import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from 'nodemailer';

// GET all SMTP configs
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const configs = await prisma.smtpConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Mask passwords for security
        const safeConfigs = configs.map(c => ({
            ...c,
            pass: "••••••••"
        }));

        return NextResponse.json(safeConfigs);
    } catch (error) {
        console.error("GET SMTP Configs Error:", error);
        return NextResponse.json({ error: "Failed to fetch SMTP configs" }, { status: 500 });
    }
}

// POST new SMTP config
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { host, port, user, pass, senderName, secure, isActive, testConnection } = body;

        if (!host || !port || !user || !pass) {
            return NextResponse.json({ error: "جميع الحقول المطلوبة يجب ملؤها" }, { status: 400 });
        }

        // Test connection if requested
        if (testConnection) {
            try {
                const transporter = nodemailer.createTransport({
                    host,
                    port: Number(port),
                    secure: !!secure,
                    auth: { user, pass },
                    connectionTimeout: 5000 // 5 seconds timeout
                });

                await transporter.verify();
                
                // Send test email
                await transporter.sendMail({
                    from: `"${senderName || 'بوابة الاعتماد المهني'}" <${user}>`,
                    to: user,
                    subject: "بريد تجريبي — بوابة الاعتماد المهني",
                    text: "تم ربط خادم البريد الإلكتروني SMTP الخاص بك بنجاح!",
                    html: `
                        <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 20px;">
                            <h2 style="color: #16539a;">تهانينا!</h2>
                            <p>تم التحقق من إعدادات خادم البريد الإلكتروني SMTP الخاص بك لـ <b>${user}</b> والربط يعمل بشكل سليم.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <small style="color: #888;">بوابة الاعتماد المهني</small>
                        </div>
                    `
                });
            } catch (smtpErr: any) {
                console.error("SMTP Test Connection Failed:", smtpErr);
                return NextResponse.json({ 
                    error: `فشل الاتصال بخادم البريد: ${smtpErr.message || 'خطأ غير معروف'}` 
                }, { status: 400 });
            }
        }

        const newConfig = await prisma.smtpConfig.create({
            data: {
                host,
                port: Number(port),
                user,
                pass,
                senderName: senderName || "بوابة الاعتماد المهني",
                secure: !!secure,
                isActive: isActive !== false
            }
        });

        // Mask password in response
        return NextResponse.json({
            ...newConfig,
            pass: "••••••••"
        });
    } catch (error: any) {
        console.error("POST SMTP Config Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "هذا الحساب (User) مضاف مسبقاً" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create SMTP config" }, { status: 500 });
    }
}
