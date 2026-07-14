import { NextResponse } from "next/server";

export async function POST() {
    try {
        // Since the server is now running locally via WAHA (not Evolution on Render),
        // there is no need to send wake-up pings. The local server does not sleep.
        return NextResponse.json({ success: true, message: "Wake-up ping acknowledged (Local server does not sleep)" });
    } catch (error) {
        console.error("[Wake-Whatsapp] API Error:", error);
        return NextResponse.json({ error: "Failed to trigger wake-up" }, { status: 500 });
    }
}
