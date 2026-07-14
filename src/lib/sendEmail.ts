import nodemailer from 'nodemailer';

// Nodemailer transport setup using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Common headers to improve deliverability and avoid spam filters
const getCommonHeaders = () => ({
    'X-Priority': '3',
    'X-Mailer': 'Professional Accreditation Portal',
    'Precedence': 'bulk',
    'Reply-To': process.env.SMTP_USER || '',
});

const LOGO_URL = "https://res.cloudinary.com/db4ulwtpa/image/upload/brand_logo.png";

/**
 * Sends a premium, responsive OTP verification email
 */
export async function sendOTPByEmail(to: string, name: string, otp: string, professionName?: string) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("SMTP credentials are not configured in environment variables.");
        return { success: false, error: "SMTP credentials not configured" };
    }

    try {
        const mailOptions = {
            from: `"بوابة الاعتماد المهني" <${process.env.SMTP_USER}>`,
            to,
            subject: 'رمز التحقق الخاص بك — الاختبار التجريبي',
            headers: getCommonHeaders(),
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
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 15px !important;
            }
            .content-card {
                padding: 20px !important;
                border-radius: 12px !important;
            }
            .otp-box {
                padding: 15px !important;
                font-size: 28px !important;
                letter-spacing: 5px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: right;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; width: 100%; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="container" role="presentation" width="560" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 560px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 10px;">
                            <table class="content-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 40px 30px; border-top: 4px solid #16539a;">
                                
                                <!-- Brand Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="display: block; width: 140px; height: auto; border: 0;" />
                                    </td>
                                </tr>

                                <!-- Welcome Header -->
                                <tr>
                                    <td style="padding-bottom: 15px; text-align: center;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.5;">مرحباً بك، ${name}</h2>
                                    </td>
                                </tr>

                                <!-- Description -->
                                <tr>
                                    <td style="padding-bottom: 25px; text-align: center;">
                                        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.8; font-weight: 500;">
                                            أنت على وشك البدء في الاختبار التجريبي لمهنة <span style="color: #16539a; font-weight: 700;">${professionName || 'التخصص المختار'}</span>. يرجى استخدام رمز التحقق أدناه لتأكيد هويتك وإكمال عملية الدخول:
                                        </p>
                                    </td>
                                </tr>

                                <!-- OTP Code Box -->
                                <tr>
                                    <td align="center" style="padding-bottom: 25px;">
                                        <div class="otp-box" style="
                                            background-color: #f8fafc;
                                            border: 1px dashed #cbd5e1;
                                            border-radius: 12px;
                                            padding: 20px 30px;
                                            display: inline-block;
                                            text-align: center;
                                        ">
                                            <p style="margin: 0 0 6px 0; font-size: 12px; color: #16539a; font-weight: 700; letter-spacing: 0.5px;">رمز التحقق (OTP)</p>
                                            <span style="
                                                font-size: 32px;
                                                font-weight: 800;
                                                letter-spacing: 6px;
                                                color: #1e293b;
                                                font-family: 'Courier New', Courier, monospace;
                                                display: inline-block;
                                                user-select: all;
                                            ">${otp}</span>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Security / Validity Note -->
                                <tr>
                                    <td style="padding-bottom: 25px; text-align: center;">
                                        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                                            ⏱️ هذا الرمز صالح لمدة <span style="color: #ef4444; font-weight: 700;">5 دقائق</span> فقط. للحفاظ على أمان حسابك، لا تشارك هذا الرمز مع أي شخص.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 10px 0 20px 0;">
                                        <div style="height: 1px; background-color: #f1f5f9; width: 100%;"></div>
                                    </td>
                                </tr>

                                <!-- Footer Contact -->
                                <tr>
                                    <td align="center" style="text-align: center;">
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                                            إذا لم تكن أنت من طلب هذا الرمز، يمكنك تجاهل هذا البريد بأمان.<br/>
                                            <a href="https://overseas-travels.com" style="color: #16539a; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                                            © ${new Date().getFullYear()} جميع الحقوق محفوظة.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] OTP sent to ${to}: ${info.messageId}`);
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("SMTP credentials are not configured in environment variables.");
        return { success: false, error: "SMTP credentials not configured" };
    }

    try {
        const brandBlue = '#16539a';
        const brandGreen = '#5c9e45';
        const resultText = isPassed ? "اجتياز (ناجح)" : "عدم اجتياز (راسب)";
        const resultColor = isPassed ? brandGreen : '#e11d48';

        const mailOptions = {
            from: `"بوابة الاعتماد المهني" <${process.env.SMTP_USER}>`,
            to,
            subject: `نتيجة اختبارك التجريبي لمهنة ${professionName} — بوابة الاعتماد المهني`,
            headers: getCommonHeaders(),
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
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 15px !important;
            }
            .content-card {
                padding: 25px 15px !important;
                border-radius: 12px !important;
            }
            .details-table th, .details-table td {
                padding: 12px !important;
                font-size: 13px !important;
            }
            .cta-button {
                padding: 12px 20px !important;
                font-size: 13px !important;
                width: 80% !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: right;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; width: 100%; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="container" role="presentation" width="580" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 10px;">
                            <table class="content-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 40px 30px; border-top: 4px solid ${brandBlue};">
                                
                                <!-- Brand Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="display: block; width: 140px; height: auto; border: 0;" />
                                    </td>
                                </tr>

                                <!-- Welcome Header -->
                                <tr>
                                    <td style="padding-bottom: 15px; text-align: center;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.5;">مرحباً بك، ${name}</h2>
                                    </td>
                                </tr>

                                <!-- Description -->
                                <tr>
                                    <td style="padding-bottom: 25px; text-align: center;">
                                        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.8; font-weight: 500;">
                                            لقد تم الانتهاء من تصحيح إجاباتك للاختبار التجريبي لمهنة <span style="color: ${brandBlue}; font-weight: 700;">${professionName}</span> بنجاح. وفيما يلي تفاصيل التقييم:
                                        </p>
                                    </td>
                                </tr>

                                <!-- Unified Exam Details Summary Card (Matches Portal Visual Identity) -->
                                <tr>
                                    <td style="padding-bottom: 30px;">
                                        <table class="details-table" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="
                                            background-color: #ffffff;
                                            border: 1px solid #e2e8f0;
                                            border-radius: 12px;
                                            border-collapse: separate;
                                            overflow: hidden;
                                        ">
                                            <tr>
                                                <td colspan="2" style="background-color: ${brandBlue}; padding: 12px 20px; text-align: center;">
                                                    <span style="color: #ffffff; font-size: 14px; font-weight: bold;">بطاقة تقرير الاختبار</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #475569; font-weight: 700; border-bottom: 1px solid #edf2f7; width: 40%;">المهنة المستهدفة</td>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #1e293b; font-weight: bold; border-bottom: 1px solid #edf2f7;">${professionName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #475569; font-weight: 700; border-bottom: 1px solid #edf2f7;">النتيجة النهائية</td>
                                                <td style="padding: 16px 20px; font-size: 14px; color: ${resultColor}; font-weight: 800; border-bottom: 1px solid #edf2f7;">
                                                    ${resultText}
                                                </td>
                                            </tr>
                                            ${score !== undefined ? `
                                            <tr>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #475569; font-weight: 700; border-bottom: 1px solid #edf2f7;">الدرجة المحرزة</td>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #1e293b; font-weight: bold; border-bottom: 1px solid #edf2f7; font-family: sans-serif;">${score}%</td>
                                            </tr>
                                            ` : ''}
                                            ${passingScore !== undefined ? `
                                            <tr>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #475569; font-weight: 700;">درجة الاجتياز المطلوبة</td>
                                                <td style="padding: 16px 20px; font-size: 14px; color: #1e293b; font-weight: bold; font-family: sans-serif;">${passingScore}%</td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>

                                <!-- Call To Action Button Section -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; font-weight: 500; text-align: center;">
                                            لمراجعة الأسئلة بالتفصيل والاطلاع على الأخطاء وتصحيحها، انقر على زر التقرير:
                                        </p>
                                        <a class="cta-button" href="${resultUrl}" target="_blank" style="
                                            background-color: ${brandBlue};
                                            color: #ffffff;
                                            padding: 14px 28px;
                                            font-size: 14px;
                                            font-weight: bold;
                                            text-decoration: none;
                                            border-radius: 8px;
                                            display: inline-block;
                                            box-shadow: 0 4px 12px rgba(22, 83, 154, 0.15);
                                            text-align: center;
                                        ">عرض تقرير النتيجة التفصيلي</a>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 10px 0 20px 0;">
                                        <div style="height: 1px; background-color: #f1f5f9; width: 100%;"></div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="text-align: center;">
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                                            هذا البريد مرسل تلقائياً من نظام بوابة الاعتماد المهني.<br/>
                                            <a href="https://overseas-travels.com" style="color: ${brandBlue}; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                                            © ${new Date().getFullYear()} جميع الحقوق محفوظة.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Exam result sent to ${to}: ${info.messageId}`);
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
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error("SMTP credentials are not configured in environment variables.");
        return { success: false, error: "SMTP credentials not configured" };
    }

    try {
        const brandBlue = '#16539a';

        const mailOptions = {
            from: `"بوابة الاعتماد المهني" <${process.env.SMTP_USER}>`,
            to,
            subject: `رابط اختبارك التجريبي لمهنة ${professionName} — بوابة الاعتماد المهني`,
            headers: getCommonHeaders(),
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
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                padding: 15px !important;
            }
            .content-card {
                padding: 25px 15px !important;
                border-radius: 12px !important;
            }
            .cta-button {
                padding: 12px 20px !important;
                font-size: 13px !important;
                width: 80% !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; direction: rtl; text-align: right;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; width: 100%; table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table class="container" role="presentation" width="580" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 580px; margin: 0 auto;">
                    <tr>
                        <td style="padding: 10px;">
                            <table class="content-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 40px 30px; border-top: 4px solid ${brandBlue};">
                                
                                <!-- Brand Logo -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <img src="${LOGO_URL}" alt="بوابة الاعتماد المهني" width="140" style="display: block; width: 140px; height: auto; border: 0;" />
                                    </td>
                                </tr>

                                <!-- Welcome Header -->
                                <tr>
                                    <td style="padding-bottom: 15px; text-align: center;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1e293b; line-height: 1.5;">مرحباً بك، ${name}</h2>
                                    </td>
                                </tr>

                                <!-- Description -->
                                <tr>
                                    <td style="padding-bottom: 25px; text-align: center;">
                                        <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.8; font-weight: 500;">
                                            يسعدنا إرسال رابط اختبارك التجريبي لمهنة <span style="color: ${brandBlue}; font-weight: 700;">${professionName}</span>. يرجى الضغط على الزر أدناه لبدء جلسة الاختبار الخاصة بك مباشرة:
                                        </p>
                                    </td>
                                </tr>

                                <!-- Call To Action Button Section -->
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <a class="cta-button" href="${examLink}" target="_blank" style="
                                            background-color: ${brandBlue};
                                            color: #ffffff;
                                            padding: 14px 28px;
                                            font-size: 14px;
                                            font-weight: bold;
                                            text-decoration: none;
                                            border-radius: 8px;
                                            display: inline-block;
                                            box-shadow: 0 4px 12px rgba(22, 83, 154, 0.15);
                                            text-align: center;
                                        ">ابدأ الاختبار التجريبي الآن</a>
                                    </td>
                                </tr>

                                <!-- Security / Validity Note -->
                                <tr>
                                    <td style="padding-bottom: 25px; text-align: center;">
                                        <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                                            ⏱️ يرجى التأكد من توفر اتصال ثابت بالإنترنت قبل بدء الاختبار. بمجرد الدخول لا يمكن إيقاف مؤقت الاختبار.
                                        </p>
                                    </td>
                                </tr>

                                <!-- Divider -->
                                <tr>
                                    <td style="padding: 10px 0 20px 0;">
                                        <div style="height: 1px; background-color: #f1f5f9; width: 100%;"></div>
                                    </td>
                                </tr>

                                <!-- Footer -->
                                <tr>
                                    <td align="center" style="text-align: center;">
                                        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                                            هذا البريد مرسل تلقائياً من نظام بوابة الاعتماد المهني.<br/>
                                            <a href="https://overseas-travels.com" style="color: ${brandBlue}; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">بوابة الاعتماد المهني</a><br/>
                                            © ${new Date().getFullYear()} جميع الحقوق محفوظة.
                                        </p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Exam link sent to ${to}: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error(`[Email] Error sending exam link to ${to}:`, error);
        return { success: false, error: String(error) };
    }
}
