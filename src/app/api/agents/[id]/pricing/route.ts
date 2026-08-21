import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { hasAccess } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.access")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id: agentId } = await params;

        // Check if agent exists
        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId },
            select: {
                id: true,
                companyName: true,
                customSingleExamPrice: true,
            }
        });

        if (!agent) {
            return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404 });
        }

        // Get global configs
        const serviceConfig = await prisma.serviceConfig.findUnique({
            where: { id: "global" }
        });
        const baseAgentSinglePrice = Number(serviceConfig?.agentMockExamSinglePrice ?? 0);
        const basePublicSinglePrice = Number(serviceConfig?.mockExamSinglePrice ?? 0);

        // Get all paid packages
        const packages = await prisma.mockExamPackage.findMany({
            where: { isFree: false, isActive: true },
            orderBy: { sortOrder: "asc" }
        });

        // Get agent custom package configs
        const agentPackageConfigs = await prisma.agentPackageConfig.findMany({
            where: { agentId }
        });

        // Map packages with agent custom configs
        const configuredPackages = packages.map(pkg => {
            const config = agentPackageConfigs.find(c => c.packageId === pkg.id);
            return {
                packageId: pkg.id,
                name: pkg.name,
                nameEn: pkg.nameEn,
                examCredits: pkg.examCredits,
                publicPrice: Number(pkg.examPrice),
                baseAgentPrice: Number(pkg.agentPrice),
                isEnabled: config ? config.isEnabled : true,
                customPrice: config ? Number(config.customPrice) : Number(pkg.agentPrice),
                hasCustomConfig: !!config
            };
        });

        return NextResponse.json({
            agent,
            pricing: {
                singleExam: {
                    basePublicPrice: basePublicSinglePrice,
                    baseAgentPrice: baseAgentSinglePrice,
                    customPrice: agent.customSingleExamPrice ? Number(agent.customSingleExamPrice) : null,
                },
                packages: configuredPackages
            }
        });
    } catch (error: any) {
        console.error("Error in GET agent pricing:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || !hasAccess(session.user, "agents.manage")) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }

        const { id: agentId } = await params;
        const body = await req.json();
        const { customSingleExamPrice, packages } = body; // packages = Array of { packageId, isEnabled, customPrice }

        // Validate agent exists
        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId }
        });
        if (!agent) {
            return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404 });
        }

        // Validate customSingleExamPrice is >= baseAgentSinglePrice
        if (customSingleExamPrice !== null && customSingleExamPrice !== undefined) {
            const serviceConfig = await prisma.serviceConfig.findUnique({
                where: { id: "global" }
            });
            const baseAgentSinglePrice = Number(serviceConfig?.agentMockExamSinglePrice ?? 0);
            if (Number(customSingleExamPrice) < baseAgentSinglePrice) {
                return NextResponse.json({
                    error: `يجب أن يكون سعر الاختبار المفرد للوكيل أكبر من أو يساوي السعر الأساسي للوكلاء وهو (${baseAgentSinglePrice.toLocaleString()} ر.ي)`
                }, { status: 400 });
            }
        }

        // Run updates in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update single exam price
            const updatedAgent = await tx.travelAgent.update({
                where: { id: agentId },
                data: {
                    customSingleExamPrice: customSingleExamPrice !== undefined ? (customSingleExamPrice === "" || customSingleExamPrice === null ? null : Number(customSingleExamPrice)) : undefined
                }
            });

            // 2. Update package configs
            if (Array.isArray(packages)) {
                for (const pkgConfig of packages) {
                    const { packageId, isEnabled, customPrice } = pkgConfig;

                    // Get base package to validate baseAgentPrice
                    const pkg = await tx.mockExamPackage.findUnique({
                        where: { id: packageId }
                    });

                    if (!pkg) continue;

                    const baseAgentPrice = Number(pkg.agentPrice);
                    const finalCustomPrice = customPrice !== undefined && customPrice !== null && customPrice !== "" 
                        ? Number(customPrice) 
                        : baseAgentPrice;

                    if (finalCustomPrice < baseAgentPrice) {
                        throw new Error(`سعر الباقة [${pkg.name}] للوكيل لا يمكن أن يكون أقل من سعرها الأساسي للوكلاء وهو (${baseAgentPrice.toLocaleString()} ر.ي)`);
                    }

                    // Upsert custom config
                    await tx.agentPackageConfig.upsert({
                        where: {
                            agentId_packageId: {
                                agentId,
                                packageId
                            }
                        },
                        update: {
                            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
                            customPrice: finalCustomPrice
                        },
                        create: {
                            agentId,
                            packageId,
                            isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
                            customPrice: finalCustomPrice
                        }
                    });
                }
            }

            return updatedAgent;
        });

        return NextResponse.json({
            message: "تم تحديث إعدادات التسعير بنجاح",
            data: result
        });
    } catch (error: any) {
        console.error("Error in PUT agent pricing:", error);
        return NextResponse.json({ error: error.message }, { status: error.message.includes("لا يمكن أن يكون أقل") ? 400 : 500 });
    }
}
