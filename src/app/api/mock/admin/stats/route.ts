import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !hasPermission(session.user.role, "MANAGE_SYSTEM")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Overall session counts
        const totalSessions = await prisma.examSession.count({ where: { status: "SUBMITTED" } });
        const passedSessions = await prisma.examSession.count({ where: { status: "SUBMITTED", isPassed: true } });
        const failedSessions = await prisma.examSession.count({ where: { status: "SUBMITTED", isPassed: false } });
        const activeSessions = await prisma.examSession.count({ where: { status: { in: ["NEW", "STARTED", "RESUMED"] } } });
        const bannedCount = await prisma.examSession.count({ where: { isBanned: true } });

        // Average score across all submitted sessions
        const avgScoreResult = await prisma.examSession.aggregate({
            where: { status: "SUBMITTED", score: { not: null } },
            _avg: { score: true }
        });

        // Per-profession statistics
        const professions = await prisma.profession.findMany({
            include: {
                examSessions: {
                    where: { status: "SUBMITTED" },
                    select: { isPassed: true, score: true }
                },
                questions: {
                    where: { isActive: true },
                    select: { id: true }
                }
            }
        });

        const professionStats = professions.map(prof => {
            const submitted = prof.examSessions;
            const total = submitted.length;
            const passed = submitted.filter(s => s.isPassed).length;
            const avgScore = total > 0
                ? submitted.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / total
                : 0;
            return {
                id: prof.id,
                name: prof.name,
                total,
                passed,
                failed: total - passed,
                passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
                avgScore: Math.round(avgScore),
                questionCount: prof.questions.length
            };
        }).sort((a, b) => b.total - a.total);

        // Dynamic axis-based performance (supports ALL axes automatically)
        const axisStats: Record<string, { total: number; correct: number }> = {};

        const sessionQuestions = await prisma.examSessionQuestion.findMany({
            where: { session: { status: "SUBMITTED" } },
            include: {
                question: { select: { text: true, axis: true, profession: { select: { name: true } } } }
            }
        });

        const questionStats: Record<string, { text: string; profession: string; total: number; correct: number }> = {};
        
        for (const sq of sessionQuestions) {
            if (!sq.questionId || !sq.question) continue;

            // Dynamic axis tracking — creates entries for any axis encountered
            const axis = sq.question.axis;
            if (!axisStats[axis]) {
                axisStats[axis] = { total: 0, correct: 0 };
            }
            axisStats[axis].total++;
            if (sq.isCorrect) axisStats[axis].correct++;

            // Individual question tracking
            if (!questionStats[sq.questionId]) {
                questionStats[sq.questionId] = {
                    text: sq.question.text,
                    profession: sq.question.profession.name,
                    total: 0,
                    correct: 0
                };
            }
            questionStats[sq.questionId].total++;
            if (sq.isCorrect) questionStats[sq.questionId].correct++;
        }

        // Build axis breakdown with percentages
        const axisBreakdown: Record<string, number> = {};
        for (const [axis, stats] of Object.entries(axisStats)) {
            axisBreakdown[axis] = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        }

        const hardestQuestions = Object.entries(questionStats)
            .filter(([, v]) => v.total >= 3)
            .map(([id, v]) => ({
                id,
                text: v.text.substring(0, 100) + (v.text.length > 100 ? "..." : ""),
                profession: v.profession,
                total: v.total,
                correct: v.correct,
                correctRate: Math.round((v.correct / v.total) * 100)
            }))
            .sort((a, b) => a.correctRate - b.correctRate)
            .slice(0, 10);

        // Pass rate
        const passRate = totalSessions > 0 ? Math.round((passedSessions / totalSessions) * 100) : 0;

        return NextResponse.json({
            overview: {
                totalSessions,
                passedSessions,
                failedSessions,
                activeSessions,
                bannedCount,
                avgScore: Math.round(Number(avgScoreResult._avg.score) || 0),
                passRate
            },
            professionStats,
            axisBreakdown,
            hardestQuestions
        });

    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}

