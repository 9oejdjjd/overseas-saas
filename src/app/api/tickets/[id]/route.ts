
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { autoSendMessage } from "@/lib/autoSendMessage";
import { authOptions } from "@/lib/auth";

// Safely resolve userId: verify it exists in the User table before using
async function resolveUserId(session: any): Promise<string | undefined> {
    const rawId = session?.user?.id;
    if (!rawId) return undefined;
    try {
        const user = await prisma.user.findUnique({ where: { id: rawId }, select: { id: true } });
        return user?.id || undefined;
    } catch {
        return undefined;
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const validUserId = await resolveUserId(session);
        const { id } = await params;
        const body = await req.json();

        // HANDLE USAGE UPDATE (Manifest Page)
        if (body.updateUsage && body.status) {
            const newStatus = body.status;

            // Transaction for Usage Update
            const result = await prisma.$transaction(async (tx: any) => {
                const currentTicket = await tx.ticket.findUnique({
                    where: { id },
                    include: { applicant: true }
                });

                if (!currentTicket) throw new Error("Ticket not found");

                // Update Ticket Status
                const updatedTicket = await tx.ticket.update({
                    where: { id },
                    data: { status: newStatus }
                });

                // If NO_SHOW, apply fine and create compensation voucher
                if (newStatus === 'NO_SHOW' && currentTicket.applicantId) {
                    // 1. Find a No Show Policy
                    const noShowPolicy = await tx.cancellationPolicy.findFirst({
                        where: {
                            category: 'NO_SHOW',
                            isActive: true
                        },
                        orderBy: { feeAmount: 'desc' }
                    });

                    // Fallback to name search if no category match
                    const finalPolicy = noShowPolicy || await tx.cancellationPolicy.findFirst({
                        where: {
                            OR: [
                                { name: { contains: 'فوات', mode: 'insensitive' } },
                                { name: { contains: 'عدم حضور', mode: 'insensitive' } }
                            ],
                            isActive: true
                        },
                        orderBy: { feeAmount: 'desc' }
                    });

                    const fineAmount = Number(finalPolicy?.feeAmount || 0);

                    const route = await tx.transportRouteDefault.findFirst({
                        where: {
                            fromDestination: { name: currentTicket.departureLocation },
                            toDestination: { name: currentTicket.arrivalLocation }
                        }
                    });
                    const ticketPrice = Number(route?.price || 0);

                    // 1. Revert Full Ticket Price
                    if (ticketPrice > 0) {
                        await tx.applicant.update({
                            where: { id: currentTicket.applicantId },
                            data: {
                                totalAmount: { decrement: ticketPrice },
                                remainingBalance: { decrement: ticketPrice }
                            }
                        });

                        await tx.transaction.create({
                            data: {
                                applicantId: currentTicket.applicantId,
                                amount: ticketPrice,
                                type: "WITHDRAWAL",
                                category: "TICKET_REFUND",
                                notes: `استرجاع قيمة تذكرة (عدم حضور) رقم #${currentTicket.ticketNumber}`,
                            }
                        });
                    }

                    // 2. Log Fine Charge
                    if (fineAmount > 0) {
                        await tx.applicant.update({
                            where: { id: currentTicket.applicantId },
                            data: {
                                totalAmount: { increment: fineAmount },
                                remainingBalance: { increment: fineAmount }
                            }
                        });

                        await tx.transaction.create({
                            data: {
                                applicantId: currentTicket.applicantId,
                                amount: fineAmount,
                                type: "CHARGE",
                                category: "TRANSPORT_FINE",
                                notes: `غرامة عدم حضور لرحلة النقل - تذكرة #${currentTicket.ticketNumber}`,
                            }
                        });
                    }

                    // Log Activity
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_NO_SHOW",
                            details: `Marked as No Show. Fine: ${fineAmount} YER. Refunded: ${ticketPrice} YER.`,
                            applicantId: currentTicket.applicantId,
                            ...(validUserId ? { userId: validUserId } : {}),
                        }
                    });

                    // Auto-send NO_SHOW notification
                    autoSendMessage(currentTicket.applicantId, "ON_TICKET_NO_SHOW", { ticketId: id })
                        .catch(e => console.error("[AutoSend] ON_TICKET_NO_SHOW error:", e));
                } else if (newStatus === 'USED' && currentTicket.applicantId) {
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_USED",
                            details: "Trip Completed (Marked via Manifest)",
                            applicantId: currentTicket.applicantId,
                            ...(validUserId ? { userId: validUserId } : {}),
                        }
                    });

                    // Auto-send attendance/good luck notification
                    autoSendMessage(currentTicket.applicantId, "ON_TICKET_ATTENDED", { ticketId: id })
                        .catch(e => console.error("[AutoSend] ON_TICKET_ATTENDED error:", e));
                }

                return updatedTicket;
            });

            return NextResponse.json(result);
        }

        // Normal Update Logic (Modification or Cancellation)
        const {
            departureDate,
            departureLocation,
            arrivalLocation,
            busNumber,
            seatNumber,
            status,
            fineAmount,
            priceDiff,
            tripType
        } = body;

        // Wrap in Transaction
        const result = await prisma.$transaction(async (tx: any) => {
            const originalTicket = await tx.ticket.findUnique({
                where: { id },
                include: { applicant: true }
            });

            if (!originalTicket) throw new Error("Ticket not found");

            // Update Ticket
            const updatedTicket = await tx.ticket.update({
                where: { id },
                data: {
                    ...(departureDate && { departureDate: new Date(departureDate) }),
                    ...(departureLocation && { departureLocation }),
                    ...(arrivalLocation && { arrivalLocation }),
                    ...(busNumber && { busNumber }),
                    ...(seatNumber && { seatNumber }),
                    ...(status && { status }),
                },
                include: { applicant: true }
            });

            // Update Applicant Trip Type
            if (tripType && updatedTicket.applicantId) {
                await tx.applicant.update({
                    where: { id: updatedTicket.applicantId },
                    data: { transportType: tripType }
                });
            }

            // AUTOMATED COMPENSATION LOGIC FOR CANCELLED
            if (status === "CANCELLED" && updatedTicket.applicantId) {
                // Get ticket price from routes
                const route = await tx.transportRouteDefault.findFirst({
                    where: {
                        fromDestination: { name: updatedTicket.departureLocation },
                        toDestination: { name: updatedTicket.arrivalLocation }
                    }
                });

                const applicant = await tx.applicant.findUnique({ where: { id: updatedTicket.applicantId } });
                const currentTripType = applicant?.transportType || "ONE_WAY";

                const ticketPrice = currentTripType === "ROUND_TRIP"
                    ? Number(route?.priceRoundTrip || 0)
                    : Number(route?.price || 0);

                const fine = Number(fineAmount) || 0;

                // 1. Revert Full Ticket Price
                if (ticketPrice > 0) {
                    await tx.applicant.update({
                        where: { id: updatedTicket.applicantId },
                        data: {
                            totalAmount: { decrement: ticketPrice },
                            remainingBalance: { decrement: ticketPrice }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            applicantId: updatedTicket.applicantId,
                            amount: ticketPrice,
                            type: "WITHDRAWAL",
                            category: "TICKET_REFUND",
                            notes: `استرجاع قيمة تذكرة (إلغاء رحلة) رقم #${updatedTicket.ticketNumber}`,
                        }
                    });
                }

                // 2. Log Fine Charge
                if (fine > 0) {
                    await tx.applicant.update({
                        where: { id: updatedTicket.applicantId },
                        data: {
                            totalAmount: { increment: fine },
                            remainingBalance: { increment: fine }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            applicantId: updatedTicket.applicantId,
                            amount: fine,
                            type: "CHARGE",
                            category: "TRANSPORT_FINE",
                            notes: `غرامة إلغاء رحلة نقل - تذكرة #${updatedTicket.ticketNumber}`,
                        }
                    });
                }

                await tx.activityLog.create({
                    data: {
                        action: "TICKET_CANCELLED",
                        details: `Cancelled with fine: ${fine}. Refunded to Balance: ${ticketPrice}`,
                        applicantId: updatedTicket.applicantId,
                        ...(validUserId ? { userId: validUserId } : {}),
                    }
                });

                // Auto-send cancellation notification
                autoSendMessage(updatedTicket.applicantId, "ON_TICKET_CANCEL", { ticketId: id })
                    .catch(e => console.error("[AutoSend] ON_TICKET_CANCEL error:", e));
            } else if (status !== "CANCELLED") {
                // Modification Logic (Price Diff + Fine)
                const totalCost = (Number(fineAmount) || 0) + (Number(priceDiff) || 0);

                if (totalCost !== 0 && updatedTicket.applicantId) {
                    await tx.applicant.update({
                        where: { id: updatedTicket.applicantId },
                        data: {
                            totalAmount: { increment: totalCost },
                            remainingBalance: { increment: totalCost }
                        }
                    });

                    await tx.transaction.create({
                        data: {
                            applicantId: updatedTicket.applicantId,
                            amount: totalCost,
                            type: "CHARGE",
                            category: "TICKET_UPDATE_FEE",
                            notes: `رسوم تعديل أو غرامة تذكرة #${updatedTicket.ticketNumber}`,
                        }
                    });
                }

                if (validUserId) {
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_UPDATED",
                            details: `Updated Ticket. Cost Adjustment: ${totalCost}`,
                            applicantId: updatedTicket.applicantId,
                            userId: validUserId,
                        }
                    });
                }

                // Auto-send ticket modification notification
                if (updatedTicket.applicantId) {
                    autoSendMessage(updatedTicket.applicantId, "ON_TICKET_UPDATE", { ticketId: id })
                        .catch(e => console.error("[AutoSend] ON_TICKET_UPDATE error:", e));
                }
            }

            return updatedTicket;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Update error", error);
        return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        const ticket = await prisma.ticket.delete({
            where: { id },
        });

        if (ticket.applicantId) {
            const delValidUserId = await resolveUserId(session);
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_DELETED",
                    details: `Deleted Ticket ${ticket.ticketNumber}`,
                    applicantId: ticket.applicantId,
                    ...(delValidUserId ? { userId: delValidUserId } : {}),
                },
            });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
}
