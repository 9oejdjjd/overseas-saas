import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getBaseUrl } from "@/lib/baseUrl";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }
        const agentId = session.user.agentId;

        const data = await req.json();
        const { clientId, professionId, quantity = 1, packageId, newClientData } = data;

        if ((!clientId && !newClientData) || !professionId) {
            return NextResponse.json({ error: "البيانات المطلوبة مفقودة" }, { status: 400 });
        }

        let client: any = null;
        if (clientId) {
            client = await prisma.agentClient.findFirst({
                where: { id: clientId, agentId }
            });
            if (!client) {
                return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
            }
        }

        const profession = await prisma.profession.findUnique({
            where: { id: professionId }
        });
        if (!profession) {
            return NextResponse.json({ error: "التخصص غير موجود" }, { status: 404 });
        }

        let qNum = 1;
        let finalPriceToDeduct = 0;
        let packageName = "";

        // Get agent details first to check custom pricing
        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId }
        });
        if (!agent) {
            return NextResponse.json({ error: "الوكالة غير موجودة" }, { status: 404 });
        }

        if (packageId) {
            const pkg = await prisma.mockExamPackage.findUnique({
                where: { id: packageId }
            });
            if (!pkg) {
                return NextResponse.json({ error: "الباقة المطلوبة غير موجودة" }, { status: 404 });
            }
            
            // Check agent custom configuration for this package
            const agentPkgConfig = await prisma.agentPackageConfig.findUnique({
                where: {
                    agentId_packageId: {
                        agentId,
                        packageId
                    }
                }
            });

            if (agentPkgConfig && !agentPkgConfig.isEnabled) {
                return NextResponse.json({ error: "هذه الباقة غير متاحة لوكالتك" }, { status: 403 });
            }

            qNum = pkg.examCredits;
            packageName = pkg.name;

            // Determine price
            if (agentPkgConfig && Number(agentPkgConfig.customPrice) > 0) {
                finalPriceToDeduct = Number(agentPkgConfig.customPrice);
            } else if (Number(pkg.agentPrice) > 0) {
                finalPriceToDeduct = Number(pkg.agentPrice);
            } else {
                finalPriceToDeduct = Number(pkg.price);
            }
        } else {
            qNum = Math.max(1, parseInt(quantity) || 1);
            const config = await prisma.serviceConfig.findFirst();
            
            let singlePrice = 50;
            if (agent.customSingleExamPrice) {
                singlePrice = Number(agent.customSingleExamPrice);
            } else if (config && Number(config.agentMockExamSinglePrice) > 0) {
                singlePrice = Number(config.agentMockExamSinglePrice);
            } else if (config && Number(config.mockExamSinglePrice) > 0) {
                singlePrice = Number(config.mockExamSinglePrice);
            }

            finalPriceToDeduct = singlePrice * qNum;
        }

        const result = await prisma.$transaction(async (tx) => {
            let activeClient = client;

            if (!activeClient && newClientData) {
                // Check if a client with this phone number already exists for this agent to avoid duplicates
                const existing = await tx.agentClient.findFirst({
                    where: { phone: newClientData.phone, agentId }
                });
                if (existing) {
                    activeClient = existing;
                } else {
                    activeClient = await tx.agentClient.create({
                        data: {
                            agentId,
                            fullName: newClientData.fullName,
                            phone: newClientData.phone,
                            whatsappNumber: newClientData.whatsappNumber,
                            email: newClientData.email,
                            profession: profession.name
                        }
                    });
                }
            }

            if (!activeClient) {
                throw new Error("العميل غير موجود");
            }

            // Update client's profession if it's currently null or empty
            if (!activeClient.profession) {
                activeClient = await tx.agentClient.update({
                    where: { id: activeClient.id },
                    data: { profession: profession.name }
                });
            }

            const freshAgent = await tx.travelAgent.findUnique({ where: { id: agentId } });
            if (!freshAgent) {
                throw new Error("الوكالة غير موجودة");
            }

            const currentBalance = Number(freshAgent.walletBalance);
            const limit = freshAgent.allowDebt ? Number(freshAgent.debtLimit) : 0;
            if (currentBalance + limit < finalPriceToDeduct) {
                throw new Error("رصيد المحفظة غير كافٍ");
            }

            const newBalance = currentBalance - finalPriceToDeduct;
            const newTotalSpent = Number(freshAgent.totalSpent) + finalPriceToDeduct;

            const unitPrice = finalPriceToDeduct / qNum;

            const orders = [];
            const baseUrl = getBaseUrl(req);

            for (let i = 0; i < qNum; i++) {
                const token = crypto.randomBytes(32).toString('hex');
                
                // 1. Create order
                const order = await tx.agentExamOrder.create({
                    data: {
                        agentId,
                        clientId: activeClient.id,
                        professionId,
                        examPrice: unitPrice,
                        status: 'SENT',
                    }
                });

                // 2. Create exam session
                const examSession = await tx.examSession.create({
                    data: {
                        type: 'PUBLIC',
                        status: 'NEW',
                        token,
                        professionId,
                        visitorName: activeClient.fullName,
                        visitorPhone: activeClient.phone,
                        visitorEmail: activeClient.email,
                        agentOrderId: order.id,
                    }
                });

                const examLink = `${baseUrl}/session/${token}`;

                // 3. Update order with session
                const updatedOrder = await tx.agentExamOrder.update({
                    where: { id: order.id },
                    data: {
                        sessionId: examSession.id,
                        examLink,
                        sentAt: new Date(),
                    }
                });
                orders.push(updatedOrder);
            }

            // 4. Update travel agent wallet balance
            await tx.travelAgent.update({
                where: { id: agentId },
                data: {
                    walletBalance: newBalance,
                    totalSpent: newTotalSpent,
                }
            });

            // 5. Create wallet transaction record
            const description = packageId 
                ? `شراء باقة [${packageName}] بقيمة صافية ${finalPriceToDeduct.toLocaleString()} ريال للعميل ${activeClient.fullName}`
                : `شراء عدد ${qNum} اختبار(ات) مفرّدة بقيمة إجمالية صافية ${finalPriceToDeduct.toLocaleString()} ريال للعميل ${activeClient.fullName}`;

            await tx.agentWalletTransaction.create({
                data: {
                    agentId,
                    amount: finalPriceToDeduct,
                    type: 'EXAM_PURCHASE',
                    balanceBefore: currentBalance,
                    balanceAfter: newBalance,
                    description,
                    orderId: orders[0]?.id || null,
                    approvedById: session.user.id,
                }
            });

            return { orders, finalPriceToDeduct, activeClient };
        });

        return NextResponse.json({
            data: {
                orders: result.orders,
                totalPrice: result.finalPriceToDeduct,
                examLink: result.orders[0]?.examLink || "",
                examLinks: result.orders.map(o => o.examLink)
            },
            message: "تم إرسال الاختبارات بنجاح وخصم المبلغ من المحفظة"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "رصيد المحفظة غير كافٍ" ? 402 : 500 });
    }
}
