"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { autoSendMessage } from "@/lib/autoSendMessage";

import { ApplicantStatus } from "@prisma/client";

export async function updateApplicantStatus(id: string, status: string) {
    try {
        await prisma.applicant.update({
            where: { id },
            data: { status: status as ApplicantStatus }
        });

        // Log the change
        await prisma.activityLog.create({
            data: {
                action: "STATUS_UPDATE",
                details: `تم تغيير حالة المتقدم إلى ${status}`,
                applicantId: id,
            }
        });

        // Auto-send WhatsApp message based on new status
        if (status === "PASSED") {
            // Send congratulations + feedback request chain
            autoSendMessage(id, "ON_PASS", { followUpTriggers: ["ON_FEEDBACK"] })
                .catch(e => console.error("[AutoSend] ON_PASS chain error:", e));
        } else if (status === "FAILED") {
            autoSendMessage(id, "ON_FAIL")
                .catch(e => console.error("[AutoSend] ON_FAIL error:", e));
        } else if (status === "ABSENT") {
            autoSendMessage(id, "ON_EXAM_ABSENT")
                .catch(e => console.error("[AutoSend] ON_EXAM_ABSENT error:", e));
        }

        revalidatePath("/dashboard/applicants");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
