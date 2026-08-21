import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import nodemailer from 'nodemailer';

// PUT update SMTP config
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { host, port, user, pass, senderName, secure, isActive, testConnection } = body;

        // Find existing config
        const existing = await prisma.smtpConfig.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: "الإعداد غير موجود" }, { status: 444 });
        }

        // Determine actual password to save/test
        const actualPassword = pass === "••••••••" ? existing.pass : pass;

        // Test connection if requested
        if (testConnection) {
            try {
                const transporter = nodemailer.createTransport({
                    host,
                    port: Number(port),
                    secure: !!secure,
                    auth: { user, pass: actualPassword },
                    connectionTimeout: 5000
                });

                await transporter.verify();
                
                // Send test email
                await transporter.sendMail({
                    from: `"${senderName || 'بوابة الاعتماد المهني'}" <${user}>`,
                    to: user,
                    subject: "تحديث الإعدادات وبريد تجريبي — بوابة الاعتماد المهني",
                    text: "تم اختبار وتحديث خادم البريد الإلكتروني SMTP الخاص بك بنجاح!",
                    html: `
                        <div style="direction: rtl; text-align: right; font-family: sans-serif; padding: 20px;">
                            <h2 style="color: #16539a;">تم التحديث بنجاح!</h2>
                            <p>تم التحقق بنجاح وتحديث خادم البريد لـ <b>${user}</b> والربط يعمل بشكل سليم.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <small style="color: #888;">بوابة الاعتماد المهني</small>
                        </div>
                    `
                });
            } catch (smtpErr: any) {
                console.error("SMTP Update Test Connection Failed:", smtpErr);
                return NextResponse.json({ 
                    error: `فشل الاتصال بخادم البريد: ${smtpErr.message || 'خطأ غير معروف'}` 
                }, { status: 400 });
            }
        }

        const updated = await prisma.smtpConfig.update({
            where: { id },
            data: {
                host,
                port: Number(port),
                user,
                pass: actualPassword,
                senderName,
                secure: !!secure,
                isActive: isActive !== false
            }
        });

        return NextResponse.json({
            ...updated,
            pass: "••••••••"
        });
    } catch (error: any) {
        console.error("PUT SMTP Config Error:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "هذا الحساب (User) مضاف مسبقاً لحساب آخر" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update SMTP config" }, { status: 500 });
    }
}

// DELETE SMTP config
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { id } = await params;

        await prisma.smtpConfig.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE SMTP Config Error:", error);
        return NextResponse.json({ error: "Failed to delete SMTP config" }, { status: 500 });
    }
}
