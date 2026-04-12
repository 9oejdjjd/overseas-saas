import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;
        const type = formData.get("type") as string; // PASSPORT or NATIONAL_ID

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const openAiKey = process.env.OPENAI_API_KEY;
        if (!openAiKey) {
            return NextResponse.json({ error: "Missing OPENAI_API_KEY in environment" }, { status: 500 });
        }

        const buffer = await file.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

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

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openAiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${file.type};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`OpenAI API error: ${errorData.error?.message || res.statusText}`);
        }

        const data = await res.json();
        let text = data.choices?.[0]?.message?.content || "";

        // Clean JSON markdown
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const parsedData = JSON.parse(text);
            return NextResponse.json(parsedData);
        } catch (e) {
            console.error("JSON Parse Error", text);
            return NextResponse.json({ error: "Failed to parse OCR response", raw: text }, { status: 500 });
        }

    } catch (error: any) {
        console.error("OCR Error:", error);
        return NextResponse.json({ error: error.message || "OCR processing failed" }, { status: 500 });
    }
}
