import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        location: true,
        transportFrom: true,
      }
    });

    if (!applicant) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    // Fetch Policy Config
    const config = await prisma.serviceConfig.findFirst();
    const maxFreeChanges = config?.maxFreeChanges ?? 1;
    const examChangeFee = Number(config?.examChangeFee ?? 16000);

    // Count previous reschedules
    const rescheduleCount = await prisma.activityLog.count({
      where: {
        applicantId: id,
        action: "EXAM_RESCHEDULED"
      }
    });

    const extendedApplicant = {
      ...applicant,
      reschedulePolicy: {
        maxFreeChanges,
        rescheduleCount,
        changeFee: examChangeFee
      }
    };

    return NextResponse.json(extendedApplicant);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applicant" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    let dataToUpdate: any = {};
    let newStatus = body.status;

    // Handle Platform Credentials Update
    if (body.updateStatus && body.platformEmail) {
      // User requested plain text storage for admin retrieval
      const storedPassword = body.platformPassword;
      dataToUpdate = {
        platformEmail: body.platformEmail,
        platformPassword: storedPassword,
      };
      newStatus = "ACCOUNT_CREATED";
    }

    // Handle Exam Scheduling / Rescheduling with Fee Logic
    if (body.scheduleExam && body.examDate) {
      // Fetch config for fee calculations
      const config = await prisma.serviceConfig.findFirst();

      // Check if this is a reschedule (applicant already had an exam date)
      const existingApplicant = await prisma.applicant.findUnique({
        where: { id },
        select: { examDate: true, status: true }
      });

      const isReschedule = !!existingApplicant?.examDate;
      const isRetake = body.isRetake || ["FAILED", "ABSENT", "CANCELLED"].includes(existingApplicant?.status || "");

      if (isRetake) {
        // RETAKE LOGIC: Always apply fee (provided by frontend or default)
        let retakeFee = body.feeAmount !== undefined ? Number(body.feeAmount) : Number(config?.examChangeFee ?? 16000);

        // VOUCHER LOGIC
        if (body.voucherId) {
          const voucher = await prisma.voucher.findUnique({ where: { id: body.voucherId } });
          if (voucher && !voucher.isUsed && voucher.type === "EXAM_RETAKE") {
            // Mark voucher as used
            await prisma.voucher.update({
              where: { id: body.voucherId },
              data: { isUsed: true, usedAt: new Date() }
            });
            // Force fee to 0
            retakeFee = 0;
          }
        }

        const currentApplicant = await prisma.applicant.findUnique({
          where: { id },
          select: { remainingBalance: true, totalAmount: true }
        });

        if (currentApplicant) {
          dataToUpdate.remainingBalance = Number(currentApplicant.remainingBalance) + retakeFee;
          dataToUpdate.totalAmount = Number(currentApplicant.totalAmount) + retakeFee;
        }
      }
      else if (isReschedule) {
        // ... Existing Normal Reschedule Logic (Free vs Paid Change) ...
        // Count previous reschedules from activity log
        const previousReschedules = await prisma.activityLog.count({
          where: {
            applicantId: id,
            action: "EXAM_RESCHEDULED"
          }
        });

        // Use config already fetched at the start of this block
        const maxFreeChanges = config?.maxFreeChanges ?? 1;
        const examChangeFee = Number(config?.examChangeFee ?? 16000);

        // If exceeded free changes, apply fee
        if (previousReschedules >= maxFreeChanges) {
          const currentApplicant = await prisma.applicant.findUnique({
            where: { id },
            select: { remainingBalance: true, totalAmount: true }
          });
          if (currentApplicant) {
            dataToUpdate.remainingBalance = Number(currentApplicant.remainingBalance) + examChangeFee;
            dataToUpdate.totalAmount = Number(currentApplicant.totalAmount) + examChangeFee;
          }
        }
      }

      dataToUpdate = {
        ...dataToUpdate,
        examDate: new Date(body.examDate), // Convert to Date
        examTime: body.examTime,
        ...(body.examLocation && { examLocation: body.examLocation }),
      };

      // If retaking, status goes back to SCHEDULED
      newStatus = "EXAM_SCHEDULED";
    }

    // Handle Direct Status Change
    if (body.status && !body.updateStatus && !body.scheduleExam) {
      newStatus = body.status;
    }

    // Handle Notes Update
    if (body.notes !== undefined) {
      dataToUpdate.notes = body.notes;
    }

    // Handle Travel Date Update
    if (body.travelDate) {
      dataToUpdate.travelDate = new Date(body.travelDate);
    }

    // Handle Generic Data Update - Explicit Field Mapping for Safety
    if (
      body.firstName !== undefined || body.lastName !== undefined || body.passportNumber !== undefined ||
      body.notes !== undefined || body.travelDate !== undefined || body.totalAmount !== undefined ||
      body.remainingBalance !== undefined || body.discount !== undefined || body.amountPaid !== undefined ||
      body.examLocation !== undefined || body.hasTransportation !== undefined || body.transportType !== undefined ||
      body.passportExpiry !== undefined || body.dob !== undefined || body.nationalId !== undefined
    ) {
      // Whitelist fields to update
      const allowedFields = [
        'firstName', 'lastName', 'passportNumber', 'nationalId', 'profession', 'notes',
        'locationId', 'transportFromId', 'transportType', 'hasTransportation',
        'totalAmount', 'discount', 'amountPaid', 'remainingBalance',
        'examLocation' // Note: examDate/Time handled above
      ];

      allowedFields.forEach(field => {
        if (body[field] !== undefined) dataToUpdate[field] = body[field];
      });

      if (body.passportExpiry) dataToUpdate.passportExpiry = new Date(body.passportExpiry);
      if (body.dob) dataToUpdate.dob = new Date(body.dob);
      if (body.travelDate) dataToUpdate.travelDate = new Date(body.travelDate);
    }

    // Update the applicant
    // Note: We remove the transaction wrapper to avoid "Unable to start transaction" timeouts if DB is slow/locked.
    // The operations are simple enough to be sequential or just the update.
    // If we need strict consistency for logs, we can risk it, but for now stability is priority.

    // 1. Update Applicant
    const applicant = await prisma.applicant.update({
      where: { id },
      data: {
        ...dataToUpdate,
        ...(newStatus ? { status: newStatus } : {}),
      },
    });

    // 2. Create Log (Fire and Forget or await)
    if (newStatus) {
      const isExamReschedule = newStatus === "EXAM_SCHEDULED" && body.scheduleExam;
      await prisma.activityLog.create({
        data: {
          action: isExamReschedule ? "EXAM_RESCHEDULED" : `STATUS_CHANGED_TO_${newStatus}`,
          details: isExamReschedule
            ? `Exam rescheduled to ${body.examDate}`
            : `Status updated to ${newStatus}`,
          applicantId: id,
        },
      });
    }

    return NextResponse.json(applicant);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update applicant" },
      { status: 500 }
    );
  }
}
