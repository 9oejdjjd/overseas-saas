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

        // Axis-based performance
        const axisStats: Record<string, { total: number; correct: number }> = {
            "HEALTH_SAFETY": { total: 0, correct: 0 },
            "PROFESSION_KNOWLEDGE": { total: 0, correct: 0 },
            "GENERAL_SKILLS": { total: 0, correct: 0 },
        };

        const sessionQuestions = await prisma.examSessionQuestion.findMany({
            where: { session: { status: "SUBMITTED" } },
            include: {
                question: { select: { text: true, axis: true, profession: { select: { name: true } } } }
            }
        });

        const questionStats: Record<string, { text: string; profession: string; total: number; correct: number }> = {};
        for (const sq of sessionQuestions) {
            if (!sq.questionId || !sq.question) continue;

            // Axis tracking
            const axis = sq.question.axis;
            if (axisStats[axis]) {
                axisStats[axis].total++;
                if (sq.isCorrect) axisStats[axis].correct++;
            }

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

        const axisBreakdown = {
            HEALTH_SAFETY: axisStats.HEALTH_SAFETY.total > 0 ? Math.round((axisStats.HEALTH_SAFETY.correct / axisStats.HEALTH_SAFETY.total) * 100) : 0,
            PROFESSION_KNOWLEDGE: axisStats.PROFESSION_KNOWLEDGE.total > 0 ? Math.round((axisStats.PROFESSION_KNOWLEDGE.correct / axisStats.PROFESSION_KNOWLEDGE.total) * 100) : 0,
            GENERAL_SKILLS: axisStats.GENERAL_SKILLS.total > 0 ? Math.round((axisStats.GENERAL_SKILLS.correct / axisStats.GENERAL_SKILLS.total) * 100) : 0,
        };
        for (const sq of sessionQuestions) {
            if (!sq.questionId) continue;
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

        return NextResponse.json({
            overview: {
                totalSessions,
                passedSessions,
                failedSessions,
                avgScore: Math.round(Number(avgScoreResult._avg.score) || 0)
            },
            professionStats,
            hardestQuestions
        });

    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
