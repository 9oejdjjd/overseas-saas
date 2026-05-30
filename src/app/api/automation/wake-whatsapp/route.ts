import { NextResponse } from "next/server";
import { wakeUpEvolutionServer } from "@/lib/evolution";

export async function POST() {
    try {
        // Fire-and-forget: we don't await so the client request is completed instantly,
        // but Render will receive the wakeup ping!
        wakeUpEvolutionServer().catch((err) => {
            console.error("[Wake-Whatsapp] Silent wakeup background error:", err);
        });
        
        return NextResponse.json({ success: true, message: "Wake-up ping sent successfully" });
    } catch (error) {
        console.error("[Wake-Whatsapp] API Error:", error);
        return NextResponse.json({ error: "Failed to trigger wake-up" }, { status: 500 });
    }
}
