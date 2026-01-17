import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - List all message logs with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // SENT, PENDING
        const trigger = searchParams.get("trigger");
        const applicantId = searchParams.get("applicantId");
        const limit = parseInt(searchParams.get("limit") || "100");

        const where: any = {};
        if (status) where.status = status;
        if (trigger) where.trigger = trigger;
        if (applicantId) where.applicantId = applicantId;

        const messages = await prisma.messageLog.findMany({
            where,
            include: {
                applicant: {
                    select: {
                        id: true,
                        fullName: true,
                        phone: true,
                        whatsappNumber: true,
                        applicantCode: true,
                        status: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        // Get statistics
        const stats = await prisma.messageLog.groupBy({
            by: ["status"],
            _count: { id: true }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sentToday = await prisma.messageLog.count({
            where: {
                status: "SENT",
                sentAt: { gte: today }
            }
        });

        return NextResponse.json({
            messages,
            stats: {
                total: stats.reduce((acc, s) => acc + s._count.id, 0),
                sent: stats.find(s => s.status === "SENT")?._count.id || 0,
                pending: stats.find(s => s.status === "PENDING")?._count.id || 0,
                sentToday,
            }
        });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }
}

// POST - Log a new message
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { applicantId, templateId, trigger, channel, message, attachments, status } = body;

        if (!applicantId || !trigger || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const messageLog = await prisma.messageLog.create({
            data: {
                applicantId,
                templateId,
                trigger,
                channel: channel || "WHATSAPP",
                message,
                attachments: attachments ? JSON.stringify(attachments) : null,
                status: status || "SENT",
                sentAt: status === "SENT" ? new Date() : null,
            }
        });

        return NextResponse.json(messageLog);
    } catch (error) {
        console.error("Error creating message log:", error);
        return NextResponse.json({ error: "Failed to create message log" }, { status: 500 });
    }
}
