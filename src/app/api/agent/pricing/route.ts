import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.agentId || session.user.role !== "TRAVEL_AGENT") {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
        }
        const agentId = session.user.agentId;

        // Fetch agent and its custom packages configs
        const agent = await prisma.travelAgent.findUnique({
            where: { id: agentId },
            include: {
                packageConfigs: {
                    where: { isEnabled: true } // only load enabled custom configs
                }
            }
        });

        if (!agent) {
            return NextResponse.json({ error: "الوكيل غير موجود" }, { status: 404 });
        }

        // Get global configs
        const serviceConfig = await prisma.serviceConfig.findUnique({
            where: { id: "global" }
        });

        // 1. Calculate Custom Single Exam Price (Hierarchy: Agent Custom -> Agent Base -> Public -> Fallback 50)
        let singleExamPrice = 50;
        if (agent.customSingleExamPrice) {
            singleExamPrice = Number(agent.customSingleExamPrice);
        } else if (serviceConfig && Number(serviceConfig.agentMockExamSinglePrice) > 0) {
            singleExamPrice = Number(serviceConfig.agentMockExamSinglePrice);
        } else if (serviceConfig && Number(serviceConfig.mockExamSinglePrice) > 0) {
            singleExamPrice = Number(serviceConfig.mockExamSinglePrice);
        }

        // 2. Fetch all paid active packages
        const allPackages = await prisma.mockExamPackage.findMany({
            where: { isFree: false, isActive: true },
            orderBy: { sortOrder: "asc" }
        });

        // 3. Load all package configs for this agent (including disabled ones to filter out)
        const allAgentConfigs = await prisma.agentPackageConfig.findMany({
            where: { agentId }
        });

        // Filter and map packages
        const filteredPackages = allPackages
            .filter(pkg => {
                const config = allAgentConfigs.find(c => c.packageId === pkg.id);
                // If has config and isEnabled is false, exclude it
                if (config && !config.isEnabled) return false;
                return true; // enabled by default
            })
            .map(pkg => {
                const config = allAgentConfigs.find(c => c.packageId === pkg.id);
                // Pricing hierarchy for packages: Agent Custom -> Agent Base -> Public
                let finalPrice = Number(pkg.examPrice);
                if (config && Number(config.customPrice) > 0) {
                    finalPrice = Number(config.customPrice);
                } else if (Number(pkg.agentPrice) > 0) {
                    finalPrice = Number(pkg.agentPrice);
                }

                return {
                    id: pkg.id,
                    name: pkg.name,
                    nameEn: pkg.nameEn,
                    description: pkg.description,
                    examCredits: pkg.examCredits,
                    price: finalPrice, // The final price charged to this agent
                    originalPrice: Number(pkg.examPrice),
                    includesRegistration: pkg.includesRegistration,
                    includesTransport: pkg.includesTransport,
                    transportType: pkg.transportType,
                    features: pkg.features
                };
            });

        return NextResponse.json({
            singleExamPrice,
            packages: filteredPackages
        });
    } catch (error: any) {
        console.error("Error in GET agent pricing portal:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
