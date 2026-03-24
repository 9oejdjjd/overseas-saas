import { NextResponse } from "next/server";
import { forceUpdateTemplates } from "@/lib/defaultTemplates";

/**
 * POST /api/settings/templates/sync
 * Syncs the default templates to the database.
 * WARNING: This will DELETE all existing templates and re-create them from defaults.
 */
export async function POST() {
    try {
        await forceUpdateTemplates();
        return NextResponse.json({ success: true, message: "Templates synced successfully" });
    } catch (error) {
        console.error("Template sync error:", error);
        return NextResponse.json({ error: "Failed to sync templates" }, { status: 500 });
    }
}
