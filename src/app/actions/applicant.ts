"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

        revalidatePath("/applicants");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status:", error);
        return { success: false, error: "Failed to update status" };
    }
}
