import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import prisma from "@/lib/prisma";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const purchaseId = formData.get("purchaseId") as string;
        const file = formData.get("file") as File;

        if (!purchaseId) {
            return NextResponse.json({ error: "معرف الطلب مطلوب" }, { status: 400 });
        }

        if (!file) {
            return NextResponse.json({ error: "يرجى إرفاق صورة إشعار التحويل" }, { status: 400 });
        }

        // Validate that the purchase exists and is currently pending or under review
        const purchase = await prisma.mockExamPurchase.findUnique({
            where: { id: purchaseId }
        });

        if (!purchase) {
            return NextResponse.json({ error: "طلب الدفع غير موجود" }, { status: 404 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert buffer to base64 for Cloudinary uploader
        const base64Data = buffer.toString("base64");
        const fileUri = `data:${file.type};base64,${base64Data}`;

        // Upload to Cloudinary under 'payment-proofs' folder
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                fileUri,
                { folder: "payment-proofs" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        const proofAttachmentUrl = (result as any).secure_url;

        const paymentMethod = formData.get("paymentMethod") as string;

        // Update purchase status in database
        const updatedPurchase = await prisma.mockExamPurchase.update({
            where: { id: purchaseId },
            data: {
                proofAttachment: proofAttachmentUrl,
                status: "UNDER_REVIEW",
                paymentMethod: paymentMethod || undefined
            }
        });

        return NextResponse.json({
            success: true,
            url: proofAttachmentUrl,
            status: updatedPurchase.status,
            message: "تم رفع إثبات الدفع بنجاح. طلبك قيد المراجعة حالياً."
        });

    } catch (error: any) {
        console.error("Proof Upload Error:", error);
        return NextResponse.json({ error: "فشل في رفع إشعار التحويل. يرجى مراجعة حجم الصورة وصيغتها." }, { status: 500 });
    }
}
