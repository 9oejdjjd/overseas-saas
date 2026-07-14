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
        
        // Allow ADMIN and REGISTRATION_STAFF to upload media for the CMS
        const allowedRoles = ["ADMIN", "REGISTRATION_STAFF"];
        if (!session || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert buffer to base64 for Cloudinary uploader
        const base64Data = buffer.toString("base64");
        const fileUri = `data:${file.type};base64,${base64Data}`;

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload(
                fileUri,
                { folder: "blog-images" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
        });

        return NextResponse.json({ 
            success: true, 
            url: (result as any).secure_url 
        });

    } catch (error: any) {
        console.error("Cloudinary Blog Upload Error:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}
