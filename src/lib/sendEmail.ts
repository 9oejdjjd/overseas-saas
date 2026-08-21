import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

// Common headers to improve deliverability and avoid spam filters
const getCommonHeaders = (replyTo: string) => ({
    'X-Priority': '3',
    'X-Mailer': 'Professional Accreditation Portal',
    'Precedence': 'bulk',
    'Reply-To': replyTo,
});

const LOGO_URL = "https://res.cloudinary.com/db4ulwtpa/image/upload/brand_logo.png";

/**
 * Sends mail by trying available SMTP configurations in DB (with load balance), 
 * and falls back to environment variables SMTP configuration.
 */
async function sendMailWithFailover(mailOptionsWithoutFrom: {
    to: string;
    subject: string;
    text: string;
    html: string;
}) {
    let configs: any[] = [];
    try {
        configs = await prisma.smtpConfig.findMany({
            where: { isActive: true }
        });
    } catch (e) {
        console.warn("[Email] Failed to fetch SMTP configurations from DB, using fallback:", e);
    }

    const attempts: Array<{
        host: string;
        user: string;
        from: string;
        replyTo: string;
        send: (options: any) => Promise<any>;
    }> = [];

    // 1. Add DB SMTP Configs
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
                    auth: { user: config.user, pass: config.pass }
                });
                return transporter.sendMail(options);
            }
        });
    }

    // 2. Add ENV fallback SMTP Config
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        attempts.push({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            user: process.env.SMTP_USER,
            from: `"بوابة الاعتماد المهني" <${process.env.SMTP_USER}>`,
            replyTo: process.env.SMTP_USER,
            send: async (options: any) => {
                const port = Number(process.env.SMTP_PORT) || 465;
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: port,
                    secure: port === 465,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                });
                return transporter.sendMail(options);
            }
        });
    }

    if (attempts.length === 0) {
        throw new Error("No configured SMTP accounts found (neither DB nor environment variables).");
    }

    // Rotational load balancing: shuffle DB configs, keep ENV fallback at the end
    const dbAttempts = attempts.slice(0, configs.length);
    const envAttempts = attempts.slice(configs.length);
    const shuffledDb = dbAttempts.sort(() => Math.random() - 0.5);
    const finalAttempts = [...shuffledDb, ...envAttempts];

    let lastError: any = null;
    for (const attempt of finalAttempts) {
        try {
            console.log(`[Email] Attempting send via ${attempt.user} (${attempt.host})`);
            const finalOptions = {
                ...mailOptionsWithoutFrom,
                from: attempt.from,
                headers: getCommonHeaders(attempt.replyTo)
            };
            const info = await attempt.send(finalOptions);
            console.log(`[Email] Success via ${attempt.user}. MsgId: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (err) {
            console.error(`[Email] Failed via ${attempt.user}:`, err);
            lastError = err;
        }
    }

    throw lastError || new Error("Failed to send email using all available configurations.");
}

/**
 * Sends a premium, responsive OTP verification email
 */
export async function sendOTPByEmail(to: string, name: string, otp: string, professionName?: string) {
    try {
        const mailOptions = {
            to,
            subject: 'رمز التحقق الخاص بك — الاختبار التجريبي',
            text: `مرحباً ${name}،\n\nرمز التحقق الخاص بك هو: ${otp}\n\nهذا الرمز صالح لمدة 5 دقائق فقط.\nلا تشارك هذا الرمز مع أي شخص.\n\nبوابة الاعتماد المهني\nhttps://overseas-travels.com`,
            html: `
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
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a;">مرحباً بك، ${name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8;">
                أنت على وشك البدء في الاختبار التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">${professionName || 'التخصص المختار'}</span>. يرجى استخدام رمز التحقق أدناه لتأكيد هويتك وإكمال عملية الدخول:
            </p>
            <div class="otp-container">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #16539a; font-weight: 700;">رمز التحقق (OTP)</p>
                <div class="otp-code">${otp}</div>
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
            `,
        };

        await sendMailWithFailover(mailOptions);
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending OTP to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}

/**
 * Sends a premium, responsive Exam Result email using brand identity (no table, text based layout)
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
        
        const mailOptions = {
            to,
            subject: `نتيجة اختبارك التجريبي لمهنة ${professionName} — بوابة الاعتماد المهني`,
            text: `مرحباً ${name}،\n\nنتيجة اختبارك التجريبي لمهنة ${professionName}:\nالنتيجة: ${isPassed ? 'ناجح' : 'راسب'}${score !== undefined ? `\nالدرجة: ${score}%` : ''}${passingScore !== undefined ? `\nدرجة الاجتياز: ${passingScore}%` : ''}\n\nلعرض التقرير التفصيلي: ${resultUrl}\n\nبوابة الاعتماد المهني\nhttps://overseas-travels.com`,
            html: `
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
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: right;">مرحباً بك، ${name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8; text-align: right;">
                لقد تم الانتهاء من تصحيح إجاباتك للاختبار التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">${professionName}</span> بنجاح. وفيما يلي نتيجة تقييمك:
            </p>
            
            <div class="result-highlight ${isPassed ? 'success-bg' : 'fail-bg'}">
                <span style="font-weight: 750;">اسم المتدرب:</span> ${name} <br/>
                <span style="font-weight: 750;">المهنة المستهدفة:</span> ${professionName} <br/>
                <span style="font-weight: 750;">النتيجة النهائية:</span> ${resultText}
                ${score !== undefined ? `<br/><span style="font-weight: 750;">الدرجة المحرزة:</span> ${score}%` : ''}
                ${passingScore !== undefined ? `<br/><span style="font-weight: 750;">درجة الاجتياز المطلوبة:</span> ${passingScore}%` : ''}
            </div>

            <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6; text-align: center;">
                لمراجعـة الأسـئلة والاطلاع على الأخطـاء وتصحيحهـا، يرجى النقر على زر التقرير:
            </p>
            
            <a class="btn-report" href="${resultUrl}" target="_blank">عرض تقرير النتيجة التفصيلي</a>
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
            `,
        };

        await sendMailWithFailover(mailOptions);
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
        const mailOptions = {
            to,
            subject: `رابط اختبارك التجريبي لمهنة ${professionName} — بوابة الاعتماد المهني`,
            text: `مرحباً ${name}،\n\nرابط اختبارك التجريبي لمهنة ${professionName}:\n${examLink}\n\nيرجى التأكد من توفر اتصال ثابت بالإنترنت قبل بدء الاختبار.\n\nبوابة الاعتماد المهني\nhttps://overseas-travels.com`,
            html: `
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
            <h2 style="margin: 0 0 15px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: right;">مرحباً بك، ${name}</h2>
            <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.8; text-align: right;">
                يسعدنا إرسال رابط اختبارك التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">${professionName}</span>. يرجى الضغط على الزر أدناه لبدء جلسة الاختبار الخاصة بك مباشرة:
            </p>
            <a class="btn-start" href="${examLink}" target="_blank">ابدأ الاختبار التجريبي الآن</a>
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
            `,
        };

        await sendMailWithFailover(mailOptions);
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending exam link to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}
