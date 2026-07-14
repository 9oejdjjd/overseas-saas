import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        location: true,
        transportFrom: true,
        examCenter: true,
        ticket: {
          include: {
            trip: {
              include: {
                stops: {
                  include: {
                    destination: true,
                    routeStop: true
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              }
            },
            returnTrip: {
              include: {
                stops: {
                  include: {
                    destination: true,
                    routeStop: true
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              }
            },
          }
        }
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if it's an Applicant first
    const existingApplicant = await prisma.applicant.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingApplicant) {
      // Check if it's a Visitor Purchase
      const purchase = await prisma.mockExamPurchase.findUnique({
        where: { id }
      });

      if (purchase) {
        // Update Visitor Purchase
        const allowedVisitorFields = ['email', 'buyerName', 'phone', 'profession'];
        let visitorDataToUpdate: any = {};
        allowedVisitorFields.forEach(field => {
          if (body[field] !== undefined) visitorDataToUpdate[field] = body[field];
        });

        const updatedPurchase = await prisma.mockExamPurchase.update({
          where: { id },
          data: visitorDataToUpdate
        });

        return NextResponse.json({
          success: true,
          message: "تم تحديث بيانات الزائر بنجاح",
          visitor: updatedPurchase
        });
      }

      return NextResponse.json(
        { error: "الملف أو المعاملة غير موجودة" },
        { status: 404 }
      );
    }

    let dataToUpdate: any = {};
    let newStatus = body.status;

    // Handle Platform Credentials Update
    if (body.updateStatus && body.platformEmail) {
      // Server-side guard: prevent modifying email after first save
      const existing = await prisma.applicant.findUnique({
        where: { id },
        select: { platformEmail: true }
      });
      if (existing?.platformEmail) {
        return NextResponse.json(
          { error: "لا يمكن تعديل البريد بعد الحفظ الأول" },
          { status: 403 }
        );
      }

      // User requested plain text storage for admin retrieval
      const storedPassword = body.platformPassword;
      dataToUpdate = {
        platformEmail: body.platformEmail,
        platformPassword: storedPassword,
      };
      newStatus = "ACCOUNT_CREATED";
    }

    let globalIsRealReschedule = false;

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
      globalIsRealReschedule = isReschedule;
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

          if (retakeFee > 0) {
            await prisma.transaction.create({
              data: {
                applicantId: id,
                amount: retakeFee,
                type: "CHARGE",
                category: "EXAM_RETAKE_FEE",
                notes: body.voucherId ? "غرامة إعادة اختبار (مغطاة بقسيمة)" : "رسوم غرامة إعادة اختبار",
              }
            });
          }
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

            if (examChangeFee > 0) {
              await prisma.transaction.create({
                data: {
                  applicantId: id,
                  amount: examChangeFee,
                  type: "CHARGE",
                  category: "EXAM_CHANGE_FEE",
                  notes: "غرامة تعديل موعد الاختبار (بعد تجاوز المرات المجانية)",
                }
              });
            }
          }
        }
      }

      dataToUpdate = {
        ...dataToUpdate,
        examDate: new Date(body.examDate), // Convert to Date
        examTime: body.examTime,
        ...(body.examLocation && { examLocation: body.examLocation }),
        ...(body.examCenterId && { examCenterId: body.examCenterId }),
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
      body.passportExpiry !== undefined || body.dob !== undefined || body.nationalId !== undefined ||
      body.notificationEmail !== undefined
    ) {
      // Whitelist fields to update
      const allowedFields = [
        'fullName', 'firstName', 'lastName', 'passportNumber', 'nationalId', 'profession', 'notes',
        'locationId', 'transportFromId', 'transportType', 'hasTransportation',
        'totalAmount', 'discount', 'amountPaid', 'remainingBalance',
        'examLocation', 'examCenterId', 'phone', 'whatsappNumber', 'platformEmail', 'notificationEmail' // Note: examDate/Time handled above
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
      const isExamAction = newStatus === "EXAM_SCHEDULED" && body.scheduleExam;
      const logActionString = isExamAction 
        ? (globalIsRealReschedule ? "EXAM_RESCHEDULED" : "EXAM_SCHEDULED") 
        : `STATUS_CHANGED_TO_${newStatus}`;

      await prisma.activityLog.create({
        data: {
          action: logActionString,
          details: isExamAction
            ? `Exam scheduled/rescheduled to ${body.examDate}`
            : `Status updated to ${newStatus}`,
          applicantId: id,
        },
      });

      // --- NEW FEATURE: Generate ExamSession Token for Private Testing ---
      if (isExamAction && applicant.profession) {
        try {
          // Find if there corresponds a Profession model to this applicant's profession string
          const professionObj = await prisma.profession.findFirst({
            where: { name: applicant.profession }
          });

          if (professionObj) {
            // Check if there is already an active session for this attempt to avoid recreating
            const existingSession = await prisma.examSession.findFirst({
              where: {
                applicantId: id,
                professionId: professionObj.id,
                status: "NEW" // Only reuse if it's new
              }
            });

            if (!existingSession) {
              await prisma.examSession.create({
                data: {
                  type: "PRIVATE",
                  status: "NEW",
                  professionId: professionObj.id,
                  applicantId: id,
                  passingScore: professionObj.passingScore || 60,
                }
              });
            }
          }
        } catch (sessionErr) {
          console.error("Failed to generate Exam Session for applicant:", sessionErr);
        }
      }
    // --- NEW FEATURE: Auto-send WhatsApp messages on status changes ---
      const { autoSendMessage } = await import("@/lib/autoSendMessage");
      
      if (newStatus === "PASSED") {
        autoSendMessage(id, "ON_PASS", { followUpTriggers: ["ON_FEEDBACK"] })
          .catch(e => console.error("[AutoSend] ON_PASS chain error:", e));
      } else if (newStatus === "FAILED") {
        autoSendMessage(id, "ON_FAIL")
          .catch(e => console.error("[AutoSend] ON_FAIL error:", e));
      } else if (newStatus === "ABSENT") {
        autoSendMessage(id, "ON_EXAM_ABSENT")
          .catch(e => console.error("[AutoSend] ON_EXAM_ABSENT error:", e));
      }

      // If this is a reschedule (not first-time scheduling), send reschedule notification
      if (isExamAction && globalIsRealReschedule) {
        autoSendMessage(id, "ON_EXAM_RESCHEDULE")
          .catch(e => console.error("[AutoSend] ON_EXAM_RESCHEDULE error:", e));
      }
    }

    // 3. Removed faulty duplicate pricing 
    // The base registration price is ALREADY recorded during applicant creation (POST /api/applicants).
    // The previous code block was erroneously fetching `PricingPackage` and adding 50,000 on every schedule attempt.
    // Retake fees and reschedule fees are now cleanly handled and logged as Expense Transactions above.

    return NextResponse.json(applicant);
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update applicant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's an Applicant first
    const applicant = await prisma.applicant.findUnique({
      where: { id },
      include: {
        ticket: true,
        transactions: true,
      }
    });

    if (applicant) {
      // ── Applicant Soft Delete (Archive) ──
      
      // Fetch associated mock packages
      const mockPurchases = await prisma.mockExamPurchase.findMany({
        where: { applicantId: id },
        include: { package: true }
      });

      // Calculate consumed costs
      // 1. Registration Fee (if confirmed/scheduled)
      let consumedReg = 0;
      const isExamConfirmed = applicant.examDate !== null || 
        ["EXAM_SCHEDULED", "AWAITING_EXAM", "ATTENDED_EXAM", "PASSED", "FAILED"].includes(applicant.status);
      
      if (isExamConfirmed) {
        const regTx = applicant.transactions.find(t => t.type === "CHARGE" && t.category === "REGISTRATION_FEE");
        if (regTx) {
          consumedReg = Number(regTx.amount);
        }
      }

      // 2. Transport Fee (if ticket issued)
      let consumedTrans = 0;
      const isTransportConfirmed = applicant.ticket !== null;
      if (isTransportConfirmed) {
        const transTx = applicant.transactions.find(t => t.type === "CHARGE" && t.category === "TRANSPORT_FEE");
        if (transTx) {
          consumedTrans = Number(transTx.amount);
        }
      }

      // 3. Mock Exams (used attempts prorated)
      let consumedMock = 0;
      for (const purchase of mockPurchases) {
        if (purchase.status === "ACTIVE" || purchase.status === "PAID") {
          const totalCredits = purchase.totalCredits;
          const usedCredits = purchase.usedCredits;
          const mockCost = Number(purchase.amount);
          if (totalCredits > 0) {
            consumedMock += mockCost * (usedCredits / totalCredits);
          }
        }
      }

      const totalConsumed = consumedReg + consumedTrans + consumedMock;
      const amountPaid = Number(applicant.amountPaid);
      const totalAmount = Number(applicant.totalAmount);

      let cashRefund = 0;
      let newTotalAmount = totalAmount;
      let newAmountPaid = amountPaid;

      if (amountPaid > totalConsumed) {
        cashRefund = amountPaid - totalConsumed;
        newTotalAmount = totalConsumed;
        newAmountPaid = totalConsumed;
      } else {
        // Waive unpaid balance, no cash refund
        cashRefund = 0;
        newTotalAmount = amountPaid;
        newAmountPaid = amountPaid;
      }

      const totalRefund = Math.max(0, totalAmount - newTotalAmount);
      const debtWaiver = Math.max(0, totalRefund - cashRefund);

      // Perform updates inside transaction
      await prisma.$transaction(async (tx) => {
        // Soft delete applicant
        await tx.applicant.update({
          where: { id },
          data: {
            isArchived: true,
            status: "CANCELLED",
            totalAmount: newTotalAmount,
            amountPaid: newAmountPaid,
            remainingBalance: 0
          }
        });

        // Cancel associated mock purchases
        await tx.mockExamPurchase.updateMany({
          where: { applicantId: id, status: { in: ["ACTIVE", "PAID", "PENDING"] } },
          data: { status: "CANCELLED" }
        });

        // Create withdrawal transaction if cash refund exists
        if (cashRefund > 0) {
          await tx.transaction.create({
            data: {
              applicantId: id,
              amount: cashRefund,
              type: "WITHDRAWAL",
              notes: `تسوية حساب وأرشفة ملف المتقدم | مسترجع نقدي: ${cashRefund.toLocaleString()} ر.ي | إعفاء مستحقات: ${debtWaiver.toLocaleString()} ر.ي`,
              category: "CLIENT_REFUND",
              locationId: applicant.locationId
            }
          });
        }

        // Log Activity
        await tx.activityLog.create({
          data: {
            action: "APPLICANT_ARCHIVED",
            details: `أرشفة ملف المتقدم ${applicant.fullName} | القيمة المستهلكة: ${totalConsumed.toLocaleString()} ر.ي | مسترجع نقدي: ${cashRefund.toLocaleString()} ر.ي | إعفاء مستحقات: ${debtWaiver.toLocaleString()} ر.ي`,
            applicantId: id
          }
        });
      });

      return NextResponse.json({
        success: true,
        message: "تم أرشفة ملف المتقدم بنجاح وتسوية الحساب",
        cashRefund,
        debtWaiver
      });
    }

    // If not Applicant, check if it's a Visitor Purchase
    const purchase = await prisma.mockExamPurchase.findUnique({
      where: { id },
      include: { package: true }
    });

    if (purchase) {
      // ── Visitor Hard Delete ──
      const refundAmount = Number(purchase.amount);

      await prisma.$transaction(async (tx) => {
        // Unlink matched sms transactions
        await tx.smsTransaction.updateMany({
          where: { matchedPurchaseId: id },
          data: { matchedPurchaseId: null, isMatched: false }
        });

        // Delete associated sessions
        await tx.examSession.deleteMany({
          where: { purchaseId: id }
        });

        // Delete the purchase record itself
        await tx.mockExamPurchase.delete({
          where: { id }
        });

        // Create transaction entry for refund if paid
        if (purchase.isPaid && refundAmount > 0) {
          await tx.transaction.create({
            data: {
              amount: refundAmount,
              type: "WITHDRAWAL",
              notes: `حذف باقة زائر (${purchase.phone}) واسترجاع كامل القيمة: ${refundAmount.toLocaleString()} ر.ي`,
              category: "CLIENT_REFUND"
            }
          });
        }

        // Create global activity log
        await tx.activityLog.create({
          data: {
            action: "VISITOR_DELETED",
            details: `حذف باقة زائر (${purchase.phone}) واسترجاع كامل القيمة: ${refundAmount.toLocaleString()} ر.ي`
          }
        });
      });

      return NextResponse.json({
        success: true,
        message: "تم حذف بيانات الزائر بالكامل واسترجاع الرصيد",
        cashRefund: purchase.isPaid ? refundAmount : 0,
        debtWaiver: 0
      });
    }

    return NextResponse.json(
      { error: "الملف أو المعاملة غير موجودة" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { error: "فشل في حذف أو أرشفة الملف" },
      { status: 500 }
    );
  }
}
