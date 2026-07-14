import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["ADMIN", "REGISTRATION_STAFF", "ACCOUNTANT"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "يرجى إرفاق صورة شعار المحفظة" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert buffer to base64 for Cloudinary uploader
        const base64Data = buffer.toString("base64");
        const fileUri = `data:${file.type};base64,${base64Data}`;

        // Upload to Cloudinary under 'wallet-logos' folder
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                fileUri,
                { folder: "wallet-logos" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        const logoUrl = (result as any).secure_url;

        return NextResponse.json({
            success: true,
            url: logoUrl,
            message: "تم رفع شعار المحفظة بنجاح"
        });

    } catch (error: any) {
        console.error("Wallet Logo Upload Error:", error);
        return NextResponse.json({ error: "فشل في رفع شعار المحفظة. يرجى مراجعة حجم الصورة وصيغتها." }, { status: 500 });
    }
}
