
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { action, preview, newDate, newDestination, newDeparture } = body; // action: "CANCELLATION" | "MODIFICATION"

        // Fetch Applicant with Ticket
        const applicant = await prisma.applicant.findUnique({
            where: { id },
            include: { ticket: true }
        });

        if (!applicant || !applicant.ticket) {
            return NextResponse.json({ error: "لا يوجد تذكرة فعالة لهذا المتقدم" }, { status: 400 });
        }

        const departureDate = new Date(applicant.ticket.departureDate);
        const now = new Date();
        const diffInMs = departureDate.getTime() - now.getTime();
        const hoursUntilDeparture = diffInMs / (1000 * 60 * 60);

        // Fetch Policies matching the category
        const policies = await prisma.cancellationPolicy.findMany({
            where: { isActive: true, category: action }
        });

        // Determine Applicable Policy Fee
        let applicablePolicy: any = null;
        let highestFee = -1;

        for (const policy of policies) {
            let isMatch = false;
            if (policy.hoursTrigger === null) isMatch = true;
            else {
                if (policy.condition === "LESS_THAN") {
                    if (hoursUntilDeparture < policy.hoursTrigger && hoursUntilDeparture > -12) isMatch = true;
                } else if (policy.condition === "GREATER_THAN") {
                    if (hoursUntilDeparture > policy.hoursTrigger) isMatch = true;
                }
            }
            if (isMatch && Number(policy.feeAmount) > highestFee) {
                highestFee = Number(policy.feeAmount);
                applicablePolicy = policy;
            }
        }

        // NO_SHOW check if flight passed
        if (hoursUntilDeparture <= 0 && !applicablePolicy && action === "CANCELLATION") {
            const noShowPolicy = await prisma.cancellationPolicy.findFirst({ where: { category: "NO_SHOW", isActive: true } });
            if (noShowPolicy) { applicablePolicy = noShowPolicy; highestFee = Number(noShowPolicy.feeAmount); }
        }

        // Dynamic Price Lookup

        // Determine departure
        const departureLoc = (action === "MODIFICATION" && newDeparture) ? newDeparture : applicant.ticket.departureLocation;

        const currentRoute = await prisma.transportRoute.findFirst({
            where: {
                from: { name: departureLoc },
                to: { name: applicant.ticket.arrivalLocation },
                isActive: true
            }
        });

        const isRoundTrip = applicant.transportType === "ROUND_TRIP";
        const oldPrice = currentRoute ? (isRoundTrip ? Number(currentRoute.roundTripPrice) : Number(currentRoute.oneWayPrice)) : 0;

        let newPrice = oldPrice; // Default if no change
        let policyFee = applicablePolicy ? Number(applicablePolicy.feeAmount) : 0;
        let priceDifference = 0;

        // Modification Logic
        if (action === "MODIFICATION" && newDestination) {
            const targetRoute = await prisma.transportRoute.findFirst({
                where: {
                    from: { name: departureLoc },
                    to: { name: newDestination },
                    isActive: true
                }
            });
            newPrice = targetRoute ? (isRoundTrip ? Number(targetRoute.roundTripPrice) : Number(targetRoute.oneWayPrice)) : 0;

            if (targetRoute) {
                // If old price was 0 (missing route), difference is full value. 
                // If old price exists, difference is delta.
                priceDifference = newPrice - oldPrice;
            }
        }

        const totalFee = policyFee + priceDifference;

        if (preview) {
            return NextResponse.json({
                fee: policyFee,
                policyFee,
                priceDifference,
                totalFee,
                policyName: applicablePolicy?.name || "لا توجد غرامة",
                hoursUntilDeparture: hoursUntilDeparture.toFixed(1)
            });
        }

        // EXECUTIVE ACTION 
        const currentTotal = Number(applicant.totalAmount);
        const newTotal = currentTotal + totalFee;

        // Use 'any' type array to allow mixed Prisma Client types in transaction
        const txOps: any[] = [
            // 1. Update Applicant Financials
            prisma.applicant.update({
                where: { id },
                data: {
                    totalAmount: newTotal,
                    remainingBalance: { increment: totalFee },
                    status: action === "CANCELLATION" ? "CANCELLED" : undefined
                }
            }),
            // 2. Log Activity
            prisma.activityLog.create({
                data: {
                    applicantId: id,
                    action: action,
                    details: `Applied fee: ${policyFee} + Diff: ${priceDifference} = ${totalFee}. Policy: ${applicablePolicy?.name}.`
                }
            })
        ];

        // 3. Update Ticket if Modification
        if (action === "MODIFICATION") {
            txOps.push(
                prisma.ticket.update({
                    where: { id: applicant.ticket.id },
                    data: {
                        departureDate: newDate ? new Date(newDate) : undefined,
                        arrivalLocation: newDestination || undefined,
                    }
                })
            );
        }

        // 4. If Cancellation
        if (action === "CANCELLATION") {
            txOps.push(
                prisma.ticket.update({
                    where: { id: applicant.ticket.id },
                    data: { status: "CANCELLED" }
                })
            );
        }

        await prisma.$transaction(txOps);

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
