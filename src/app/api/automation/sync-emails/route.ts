import { NextResponse } from "next/server";
import { syncEmailsFromServer } from "@/lib/email-service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            // You might want to allow a specific API Key for Cron Jobs later
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const result = await syncEmailsFromServer();

        return NextResponse.json(result);
    } catch (error) {
        console.error("Email Sync Error:", error);
        return NextResponse.json(
            { error: "Failed to sync emails" },
            { status: 500 }
        );
    }
}
