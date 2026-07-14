import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseSms } from "@/lib/payments/smsParser";
import { matchSmsAndActivate } from "@/lib/payments/matchingEngine";

export async function POST(request: Request) {
    try {
        // 1. Authenticate the webhook request
        const apiKey = request.headers.get("x-textbee-key") || new URL(request.url).searchParams.get("apiKey");
        const configuredKey = process.env.TEXTBEE_API_KEY;

        if (!configuredKey) {
            console.error("TEXTBEE_API_KEY is not configured in environment variables.");
            return NextResponse.json({ error: "Webhook not configured on server" }, { status: 500 });
        }

        if (apiKey !== configuredKey) {
            console.warn("Unauthorized webhook attempt blocked.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        const smsId = body.id || body.messageId || null;
        const sender = body.sender || body.from || null;
        const messageBody = body.body || body.message || body.text || null;
        const deviceId = body.deviceId || null;
        const receivedAt = body.date || body.timestamp ? new Date(body.date || body.timestamp) : new Date();

        if (!sender || !messageBody) {
            return NextResponse.json({ error: "Missing required SMS payload fields" }, { status: 400 });
        }

        // 2. Prevent Duplicate SMS processing
        if (smsId) {
            const existingSms = await prisma.smsTransaction.findUnique({
                where: { textbeeMessageId: smsId }
            });
            if (existingSms) {
                return NextResponse.json({ success: true, message: "SMS already processed" });
            }
        }

        // 3. Save raw SMS to SmsTransaction table
        const smsRecord = await prisma.smsTransaction.create({
            data: {
                textbeeMessageId: smsId,
                sender: sender.trim(),
                body: messageBody.trim(),
                deviceFingerprint: deviceId,
                rawPayload: body,
                receivedAt: receivedAt
            }
        });

        console.log(`Successfully logged incoming SMS from [${sender}] in database:`, smsRecord.id);

        // 4. Run SMS parsing engine
        const parsed = parseSms(messageBody, sender);
        
        // 5. Update SMS record with parsed details
        const updatedSms = await prisma.smsTransaction.update({
            where: { id: smsRecord.id },
            data: {
                amount: parsed.amount,
                transactionNumber: parsed.transactionNumber,
                walletName: parsed.walletName
            }
        });

        // 6. Trigger Matching & Auto-Activation Engine
        let isMatched = false;
        if (parsed.transactionNumber && parsed.amount) {
            isMatched = await matchSmsAndActivate(updatedSms.id);
        }

        return NextResponse.json({
            success: true,
            smsTransactionId: updatedSms.id,
            isMatched,
            amountExtracted: parsed.amount,
            transactionNumberExtracted: parsed.transactionNumber,
            walletName: parsed.walletName,
            message: isMatched 
                ? "تم استقبال الرسالة ومطابقتها وتفعيل الحساب تلقائياً بنجاح!" 
                : "تم استقبال الرسالة وجاري انتظار إدخال العميل لرقم المرجع للمطابقة."
        });

    } catch (error) {
        console.error("TextBee Webhook Error:", error);
        return NextResponse.json({ error: "فشل معالجة ويبهوك الرسائل" }, { status: 500 });
    }
}
