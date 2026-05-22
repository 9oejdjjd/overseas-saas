import prisma from "./src/lib/prisma";

// We copy the exact same logic from sendMockResultNotification
async function sendMockResultNotification(session: any, profession: any, passed: boolean) {
    try {
        console.log("Starting sendMockResultNotification...");
        const { autoSendMessage, autoSendDirectMessage } = await import("./src/lib/autoSendMessage");

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resultPageUrl = `${baseUrl}/session/${session.token}/result`;

        console.log(`Checking session details: token=${session.token}, applicantId=${session.applicantId}, visitorPhone=${session.visitorPhone}`);

        if (session.applicantId) {
            const trigger = passed ? "ON_MOCK_PASS" : "ON_MOCK_FAIL";
            console.log(`Attempting autoSendMessage with applicantId=${session.applicantId}, trigger=${trigger}`);
            const result = await autoSendMessage(session.applicantId, trigger, {
                customVars: { 
                    profession: profession.name,
                    resultPageUrl: resultPageUrl
                }
            });
            console.log("autoSendMessage result:", result);
        } else if (session.visitorPhone) {
            const trigger = passed ? "ON_MOCK_PASS_VISITOR" : "ON_MOCK_FAIL_VISITOR";
            console.log(`Attempting autoSendDirectMessage with phone=${session.visitorPhone}, trigger=${trigger}`);
            const result = await autoSendDirectMessage(session.visitorPhone, trigger, {
                name: session.visitorName || "عزيزي/عزيزتي",
                profession: profession.name,
                resultPageUrl: resultPageUrl
            });
            console.log("autoSendDirectMessage result:", result);
        } else {
            console.log("Neither applicantId nor visitorPhone exists on the session.");
        }
    } catch (e) {
        console.error("[AutoSend] Mock result notification error:", e);
    }
}

async function main() {
    // Let's find the last submitted session
    const session = await prisma.examSession.findFirst({
        where: { status: "SUBMITTED" },
        include: { profession: true },
        orderBy: { updatedAt: "desc" }
    });

    if (!session) {
        console.log("No submitted session found to test!");
        return;
    }

    console.log("Found session:", session.token);
    await sendMockResultNotification(session, session.profession, session.isPassed || false);
}

main().catch(err => {
    console.error("Main Error:", err);
});
