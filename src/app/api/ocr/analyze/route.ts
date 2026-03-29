import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;
        const type = formData.get("type") as string; // PASSPORT or NATIONAL_ID

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        let prompt = "";
        if (type === "PASSPORT") {
            prompt = `
      Analyze this passport image and extract the following fields in JSON format:
      - firstName (English only, exclude headers)
      - lastName (English only, exclude headers)
      - firstNameAr (Arabic if available)
      - lastNameAr (Arabic if available)
      - passportNumber (alphanumeric)
      - dob (Date of Birth in YYYY-MM-DD format)
      - passportExpiry (Expiration Date in YYYY-MM-DD format)
      - gender (M or F)
      - profession (if available)

      Return ONLY valid JSON. Date format must be YYYY-MM-DD.
      `;
        } else if (type === "NATIONAL_ID") {
            prompt = `
      Analyze this National ID card (Yemeni or other) and extract:
      - nationalId (The long numeric ID number)
      - firstName (Arabic)
      - lastName (Arabic)
      - dob (YD format converted to YYYY-MM-DD)

      Return ONLY valid JSON.
      `;
        } else {
            return NextResponse.json({ error: "Invalid type" }, { status: 400 });
        }

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: file.type,
                },
            },
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean JSON markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const data = JSON.parse(text);
            return NextResponse.json(data);
        } catch (e) {
            console.error("JSON Parse Error", text);
            return NextResponse.json({ error: "Failed to parse OCR response", raw: text }, { status: 500 });
        }

    } catch (error) {
        console.error("OCR Error:", error);
        return NextResponse.json({ error: "OCR processing failed" }, { status: 500 });
    }
}
