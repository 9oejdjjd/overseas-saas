import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

/**
 * Standard RFC-compliant headers for Transactional Emails (OTP, Exam Results, Links).
 * Crucially removes 'Precedence: bulk' and spam-inducing headers to ensure inbox delivery.
 */
export const getTransactionalHeaders = (replyTo: string) => ({
    'Auto-Submitted': 'auto-generated',         // RFC 3834: Signals to mail filters that this is an automated system notice
    'X-Auto-Response-Suppress': 'All',          // Suppresses auto-responders & out-of-office loops
    'Importance': 'high',
    'Priority': 'urgent',
    'X-Priority': '1',                          // Highest priority for OTP / Transactional
    'Reply-To': replyTo,
});

const LOGO_URL = "https://res.cloudinary.com/db4ulwtpa/image/upload/brand_logo.png";

/**
 * Converts HTML email content to clean, human-readable plain text without messy CSS or broken tags.
 */
function htmlToPlainText(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n\s+\n/g, '\n\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function getEmailTemplate(trigger: string, defaults: { subject: string; body: string }) {
    try {
        const template = await prisma.messagingTemplate.findFirst({
            where: { trigger, type: "EMAIL", active: true }
        });
        if (template) {
            return {
                subject: template.subject || defaults.subject,
                body: template.body
            };
        }
    } catch (e) {
        console.warn(`[Email Template] Failed to fetch template for ${trigger}:`, e);
    }
    return defaults;
}

/**
 * Sends mail by trying available SMTP configurations in DB (with load balance).
 * Strictly requires database SMTP configurations.
 */
export async function sendMailWithFailover(mailOptionsWithoutFrom: {
    to: string;
    subject: string;
    text: string;
    html: string;
}, trigger?: string) {
    let configs: any[] = [];
    try {
        configs = await prisma.smtpConfig.findMany({
            where: { isActive: true }
        });
    } catch (e) {
        console.error("[Email] Failed to fetch SMTP configurations from DB:", e);
        throw new Error("فشل الاتصال بقاعدة البيانات لجلب إعدادات خوادم البريد الإلكتروني.");
    }

    if (configs.length === 0) {
        console.error("[Email] No active SMTP configurations found in database.");
        
        // Log the failure
        try {
            await prisma.emailLog.create({
                data: {
                    recipient: mailOptionsWithoutFrom.to,
                    subject: mailOptionsWithoutFrom.subject,
                    body: mailOptionsWithoutFrom.html,
                    status: "FAILED",
                    trigger: trigger || null,
                    error: "لا توجد خوادم بريد SMTP نشطة في النظام. يرجى إضافة وتفعيل خادم من لوحة التحكم ← إعدادات البريد."
                }
            });
        } catch (logErr) {
            console.error("[Email Log] Failed to save failure log:", logErr);
        }

        throw new Error("لا توجد خوادم بريد SMTP نشطة في النظام. يرجى إضافة وتفعيل خادم بريد من لوحة التحكم (إعدادات ← خوادم البريد الإلكتروني).");
    }

    const attempts: Array<{
        host: string;
        user: string;
        from: string;
        replyTo: string;
        send: (options: any) => Promise<any>;
    }> = [];

    // Build send attempts from DB SMTP Configs only with robust pooling and timeout options
    for (const config of configs) {
        attempts.push({
            host: config.host,
            user: config.user,
            from: `"${config.senderName}" <${config.user}>`,
            replyTo: config.user,
            send: async (options: any) => {
                const transporter = nodemailer.createTransport({
                    host: config.host,
                    port: config.port,
                    secure: config.secure,
                    auth: { user: config.user, pass: config.pass },
                    pool: true,                      // Connection pooling for fast delivery
                    maxConnections: 3,
                    maxMessages: 50,
                    connectionTimeout: 10000,        // 10s connection timeout
                    greetingTimeout: 10000,          // 10s greeting timeout
                    socketTimeout: 15000,            // 15s socket timeout
                });
                return transporter.sendMail(options);
            }
        });
    }

    // Rotational load balancing: shuffle DB configs for even distribution
    const shuffledAttempts = attempts.sort(() => Math.random() - 0.5);

    let lastError: any = null;
    for (const attempt of shuffledAttempts) {
        try {
            console.log(`[Email] Attempting send via ${attempt.user} (${attempt.host})`);
            const finalOptions = {
                ...mailOptionsWithoutFrom,
                from: attempt.from,
                headers: getTransactionalHeaders(attempt.replyTo)
            };
            const info = await attempt.send(finalOptions);
            console.log(`[Email] Success via ${attempt.user}. MsgId: ${info.messageId}`);
            
            // Log successful email in DB
            try {
                await prisma.emailLog.create({
                    data: {
                        recipient: mailOptionsWithoutFrom.to,
                        subject: mailOptionsWithoutFrom.subject,
                        body: mailOptionsWithoutFrom.html,
                        status: "SENT",
                        trigger: trigger || null,
                        senderEmail: attempt.user
                    }
                });
            } catch (logErr) {
                console.error("[Email Log] Failed to save success log:", logErr);
            }

            return { success: true, messageId: info.messageId };
        } catch (err: any) {
            console.error(`[Email] Failed via ${attempt.user}:`, err);
            lastError = err;
        }
    }

    // Log failed email in DB if all attempts fail
    try {
        await prisma.emailLog.create({
            data: {
                recipient: mailOptionsWithoutFrom.to,
                subject: mailOptionsWithoutFrom.subject,
                body: mailOptionsWithoutFrom.html,
                status: "FAILED",
                trigger: trigger || null,
                error: lastError?.message || "فشلت جميع محاولات الإرسال عبر خوادم البريد النشطة في النظام"
            }
        });
    } catch (logErr) {
        console.error("[Email Log] Failed to save failure log:", logErr);
    }

    throw lastError || new Error("فشل إرسال البريد الإلكتروني عبر جميع خوادم SMTP النشطة.");
}

/**
 * Sends a premium, responsive OTP verification email
 */
export async function sendOTPByEmail(to: string, name: string, otp: string, professionName?: string) {
    try {
        const targetProfession = professionName || "التخصص المختار";
        const defaultSubject = `رمز التحقق الخاص بك: ${otp} — بوابة الاعتماد المهني`;
        const defaultHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رمز التحقق</title>
    <style>
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            direction: rtl;
            text-align: right;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border-top: 5px solid #16539a;
            overflow: hidden;
        }
        .header {
            padding: 30px;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
        }
        .body {
            padding: 40px 35px;
        }
        .otp-container {
            background-color: #f8fafc;
            border: 1.5px dashed #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            margin: 30px 0;
            text-align: center;
        }
        .otp-code {
            font-size: 36px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #0f172a;
            font-family: 'Courier New', Courier, monospace;
            display: inline-block;
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="height: auto; border: 0;" />
        </div>
        <div class="body">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a;">مرحباً بك، {name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8;">
                أنت على وشك البدء في الاختبار التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">{profession}</span>. يرجى استخدام رمز التحقق أدناه لتأكيد هويتك وإكمال عملية الدخول:
            </p>
            <div class="otp-container">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #16539a; font-weight: 700;">رمز التحقق (OTP)</p>
                <div class="otp-code">{otp}</div>
            </div>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                هذا الرمز صالح لمدة <span style="color: #ef4444; font-weight: 700;">5 دقائق</span> فقط. للحفاظ على أمان حسابك، لا تشارك هذا الرمز مع أي شخص.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0; line-height: 1.6;">
                إذا لم تكن أنت من طلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.<br/>
                <a href="https://overseas-travels.com" style="color: #16539a; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                © ${new Date().getFullYear()} جميع الحقوق محفوظة.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const template = await getEmailTemplate("ON_OTP", {
            subject: defaultSubject,
            body: defaultHtml
        });

        let subject = template.subject;
        let html = template.body;

        const replaceAll = (str: string) => {
            return str
                .split("{name}").join(name || "")
                .split("{otp}").join(otp || "")
                .split("{profession}").join(targetProfession)
                .split("{professionName}").join(targetProfession);
        };

        subject = replaceAll(subject);
        html = replaceAll(html);

        // High quality, human-readable plain text fallback for anti-spam filters
        const cleanPlainText = [
            `مرحباً بك، ${name || "عزيزي المتدرب"}`,
            ``,
            `أنت على وشك البدء في الاختبار التجريبي لمهنة ${targetProfession}.`,
            `رمز التحقق الخاص بك (OTP) هو: ${otp}`,
            ``,
            `هذا الرمز صالح لمدة 5 دقائق فقط. للحفاظ على أمان حسابك، لا تشارك هذا الرمز مع أي شخص.`,
            ``,
            `إذا لم تكن أنت من طلب هذا الرمز، يمكنك تجاهل هذه الرسالة بأمان.`,
            ``,
            `بوابة الاعتماد المهني`,
            `https://overseas-travels.com`
        ].join('\n');

        const mailOptions = {
            to,
            subject,
            text: cleanPlainText,
            html
        };

        await sendMailWithFailover(mailOptions, "ON_OTP");
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending OTP to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Sends a premium, responsive Exam Result email using brand identity
 */
export async function sendMockResultByEmail(
    to: string, 
    name: string, 
    professionName: string, 
    isPassed: boolean, 
    resultUrl: string,
    score?: number,
    passingScore?: number
) {
    try {
        const resultText = isPassed ? "ناجح (اجتياز)" : "لم تجتز (راسب)";
        const defaultSubject = `نتيجة اختبارك التجريبي لمهنة ${professionName}: ${resultText} — بوابة الاعتماد المهني`;
        const defaultHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نتيجة الاختبار التجريبي</title>
    <style>
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            direction: rtl;
            text-align: right;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border-top: 5px solid #16539a;
            overflow: hidden;
        }
        .header {
            padding: 30px;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
        }
        .body {
            padding: 40px 35px;
            text-align: center;
        }
        .result-highlight {
            font-size: 16px;
            font-weight: 700;
            padding: 16px 20px;
            border-radius: 12px;
            display: inline-block;
            margin: 24px auto;
            text-align: right;
            width: 90%;
            box-sizing: border-box;
        }
        .success-bg {
            background-color: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .fail-bg {
            background-color: #fff1f2;
            color: #9f1239;
            border: 1px solid #fecdd3;
        }
        .btn-report {
            background-color: #16539a;
            color: #ffffff !important;
            padding: 14px 30px;
            font-size: 15px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(22, 83, 154, 0.2);
            margin: 20px 0;
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="height: auto; border: 0;" />
        </div>
        <div class="body">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: right;">مرحباً بك، {name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8; text-align: right;">
                لقد تم الانتهاء من تصحيح إجاباتك للاختبار التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">{profession}</span> بنجاح. وفيما يلي نتيجة تقييمك:
            </p>
            
            <div class="result-highlight ${isPassed ? 'success-bg' : 'fail-bg'}">
                <span style="font-weight: 750;">اسم المتدرب:</span> {name} <br/>
                <span style="font-weight: 750;">المهنة المستهدفة:</span> {profession} <br/>
                <span style="font-weight: 750;">النتيجة النهائية:</span> {resultText}
                {scoreDetails}
            </div>

            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                لمراجعـة الأسـئلة والاطلاع على الأخطـاء وتصحيحهـا، يرجى النقر على زر التقرير:
            </p>
            
            <a class="btn-report" href="{resultUrl}" target="_blank">عرض تقرير النتيجة التفصيلي</a>
        </div>
        <div class="footer">
            <p style="margin: 0; line-height: 1.6;">
                هذا البريد مرسل تلقائياً من نظام بوابة الاعتماد المهني.<br/>
                <a href="https://overseas-travels.com" style="color: #16539a; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                © ${new Date().getFullYear()} جميع الحقوق محفوظة.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const template = await getEmailTemplate("ON_MOCK_RESULT", {
            subject: defaultSubject,
            body: defaultHtml
        });

        let subject = template.subject;
        let html = template.body;

        const replaceAll = (str: string) => {
            let scoreStr = '';
            if (score !== undefined) scoreStr += `<br/><span style="font-weight: 750;">الدرجة المحرزة:</span> ${score}%`;
            if (passingScore !== undefined) scoreStr += `<br/><span style="font-weight: 750;">درجة الاجتياز المطلوبة:</span> ${passingScore}%`;

            return str
                .split("{name}").join(name || "")
                .split("{profession}").join(professionName || "")
                .split("{professionName}").join(professionName || "")
                .split("{resultText}").join(resultText)
                .split("{resultUrl}").join(resultUrl || "")
                .split("{scoreDetails}").join(scoreStr);
        };

        subject = replaceAll(subject);
        html = replaceAll(html);

        const cleanPlainText = [
            `مرحباً بك، ${name || "عزيزي المتدرب"}`,
            ``,
            `لقد تم الانتهاء من تصحيح إجاباتك للاختبار التجريبي لمهنة ${professionName}.`,
            `النتيجة النهائية: ${resultText}`,
            score !== undefined ? `الدرجة المحرزة: ${score}%` : null,
            passingScore !== undefined ? `درجة الاجتياز المطلوبة: ${passingScore}%` : null,
            ``,
            `لعرض تقرير النتيجة التفصيلي ومراجعة الإجابات الصحيحة والخاطئة:`,
            resultUrl,
            ``,
            `بوابة الاعتماد المهني`,
            `https://overseas-travels.com`
        ].filter(Boolean).join('\n');

        const mailOptions = {
            to,
            subject,
            text: cleanPlainText,
            html
        };

        await sendMailWithFailover(mailOptions, "ON_MOCK_RESULT");
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending exam result to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Sends a premium, responsive mock exam link email
 */
export async function sendMockExamLinkByEmail(to: string, name: string, professionName: string, examLink: string) {
    try {
        const defaultSubject = `رابط اختبارك التجريبي لمهنة ${professionName} — بوابة الاعتماد المهني`;
        const defaultHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>رابط الاختبار التجريبي</title>
    <style>
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            direction: rtl;
            text-align: right;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            border-top: 5px solid #16539a;
            overflow: hidden;
        }
        .header {
            padding: 30px;
            text-align: center;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
        }
        .body {
            padding: 40px 35px;
            text-align: center;
        }
        .btn-start {
            background-color: #16539a;
            color: #ffffff !important;
            padding: 14px 30px;
            font-size: 15px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 10px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(22, 83, 154, 0.2);
            margin: 25px 0;
        }
        .footer {
            padding: 30px;
            text-align: center;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="height: auto; border: 0;" />
        </div>
        <div class="body">
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: right;">مرحباً بك، {name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8; text-align: right;">
                يسعدنا إرسال رابط اختبارك التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">{profession}</span>. يرجى الضغط على الزر أدناه لبدء جلسة الاختبار الخاصة بك مباشرة:
            </p>
            <a class="btn-start" href="{examLink}" target="_blank">ابدأ الاختبار التجريبي الآن</a>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                يرجى التأكد من توفر اتصال ثابت بالإنترنت قبل بدء الاختبار. بمجرد الدخول لا يمكن إيقاف مؤقت الاختبار.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0; line-height: 1.6;">
                هذا البريد مرسل تلقائياً من نظام بوابة الاعتماد المهني.<br/>
                <a href="https://overseas-travels.com" style="color: #16539a; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                © ${new Date().getFullYear()} جميع الحقوق محفوظة.
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const template = await getEmailTemplate("ON_MOCK_EXAM_LINK", {
            subject: defaultSubject,
            body: defaultHtml
        });

        let subject = template.subject;
        let html = template.body;

        const replaceAll = (str: string) => {
            return str
                .split("{name}").join(name || "")
                .split("{profession}").join(professionName || "")
                .split("{professionName}").join(professionName || "")
                .split("{examLink}").join(examLink || "")
                .split("{mockLink}").join(examLink || "");
        };

        subject = replaceAll(subject);
        html = replaceAll(html);

        const cleanPlainText = [
            `مرحباً بك، ${name || "عزيزي المتدرب"}`,
            ``,
            `يسعدنا إرسال رابط اختبارك التجريبي لمهنة ${professionName}.`,
            `رابط الدخول للاختبار:`,
            examLink,
            ``,
            `يرجى التأكد من توفر اتصال ثابت بالإنترنت قبل بدء الاختبار. بمجرد الدخول لا يمكن إيقاف مؤقت الاختبار.`,
            ``,
            `بوابة الاعتماد المهني`,
            `https://overseas-travels.com`
        ].join('\n');

        const mailOptions = {
            to,
            subject,
            text: cleanPlainText,
            html
        };

        await sendMailWithFailover(mailOptions, "ON_MOCK_EXAM_LINK");
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending exam link to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}
