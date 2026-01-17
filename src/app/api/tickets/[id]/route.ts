
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;
        const body = await req.json();

        // HANDLE USAGE UPDATE (Manifest Page)
        if (body.updateUsage && body.status) {
            const newStatus = body.status;

            // Transaction for Usage Update
            const result = await prisma.$transaction(async (tx) => {
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

                    if (fineAmount > 0) {
                        await tx.applicant.update({
                            where: { id: currentTicket.applicantId },
                            data: {
                                totalAmount: { increment: fineAmount },
                                remainingBalance: { increment: fineAmount }
                            }
                        });
                    }

                    // 2. Create Compensation Voucher
                    const route = await tx.transportRoute.findFirst({
                        where: {
                            from: { name: currentTicket.departureLocation },
                            to: { name: currentTicket.arrivalLocation }
                        }
                    });
                    const ticketPrice = Number(route?.oneWayPrice || 0);
                    const refundable = ticketPrice - fineAmount;

                    if (refundable > 0) {
                        const metadata = {
                            category: "COMPENSATION",
                            amount: refundable,
                            balance: refundable,
                            realType: "COMP_NO_SHOW",
                            sourceTicketId: id, // Linking to source ticket
                            reason: "Ticket No-Show"
                        };
                        // Use the [META:...] pattern required by Voucher API
                        const notes = `تعويض التخلف عن الرحلة - تذكرة #${currentTicket.ticketNumber} [META:${JSON.stringify(metadata)}]`;

                        await tx.voucher.create({
                            data: {
                                applicantId: currentTicket.applicantId,
                                type: "EXAM_RETAKE", // Generic type usually used for compensation
                                notes: notes,
                            }
                        });
                    }

                    // Log Activity
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_NO_SHOW",
                            details: `Marked as No Show. Fine: ${fineAmount} YER. Voucher Created: ${refundable > 0 ? refundable + ' YER' : 'None'} (${finalPolicy?.name || 'Default'})`,
                            applicantId: currentTicket.applicantId,
                            userId: session?.user?.id,
                        }
                    });
                } else if (newStatus === 'USED' && currentTicket.applicantId) {
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_USED",
                            details: "Trip Completed (Marked via Manifest)",
                            applicantId: currentTicket.applicantId,
                            userId: session?.user?.id,
                        }
                    });
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
        const result = await prisma.$transaction(async (tx) => {
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
                const route = await tx.transportRoute.findFirst({
                    where: {
                        from: { name: updatedTicket.departureLocation },
                        to: { name: updatedTicket.arrivalLocation }
                    }
                });

                const applicant = await tx.applicant.findUnique({ where: { id: updatedTicket.applicantId } });
                const currentTripType = applicant?.transportType || "ONE_WAY";

                const ticketPrice = currentTripType === "ROUND_TRIP"
                    ? Number(route?.roundTripPrice || 0)
                    : Number(route?.oneWayPrice || 0);

                const fine = Number(fineAmount) || 0;

                if (fine > 0) {
                    await tx.applicant.update({
                        where: { id: updatedTicket.applicantId },
                        data: {
                            totalAmount: { increment: fine },
                            remainingBalance: { increment: fine }
                        }
                    });
                }

                const refundable = ticketPrice - fine;

                if (refundable > 0) {
                    const metadata = {
                        category: "COMPENSATION",
                        amount: refundable,
                        balance: refundable,
                        realType: "COMP_CANCEL",
                        sourceTicketId: id,
                        reason: "Ticket Cancellation"
                    };
                    const notes = `تعويض إلغاء التذكرة #${updatedTicket.ticketNumber} - الغرامة: ${fine} ر.ي [META:${JSON.stringify(metadata)}]`;

                    await tx.voucher.create({
                        data: {
                            applicantId: updatedTicket.applicantId,
                            type: "EXAM_RETAKE",
                            notes: notes,
                        }
                    });
                }

                await tx.activityLog.create({
                    data: {
                        action: "TICKET_CANCELLED",
                        details: `Cancelled with fine: ${fine}. Refund Voucher: ${refundable}`,
                        applicantId: updatedTicket.applicantId,
                        userId: session?.user?.id,
                    }
                });
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
                }

                if (session?.user?.id) {
                    await tx.activityLog.create({
                        data: {
                            action: "TICKET_UPDATED",
                            details: `Updated Ticket. Cost Adjustment: ${totalCost}`,
                            applicantId: updatedTicket.applicantId,
                            userId: session?.user?.id,
                        }
                    });
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
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        const ticket = await prisma.ticket.delete({
            where: { id },
        });

        if (session?.user?.id && ticket.applicantId) {
            await prisma.activityLog.create({
                data: {
                    action: "TICKET_DELETED",
                    details: `Deleted Ticket ${ticket.ticketNumber}`,
                    applicantId: ticket.applicantId,
                    userId: session.user.id,
                },
            });
        }

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Delete error", error);
        return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
}
