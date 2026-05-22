import prisma from "./src/lib/prisma";

async function main() {
    const applicant = await prisma.applicant.findUnique({
        where: { id: "0f0ef95b-7e9b-4bcd-afd1-c51f1ce34cb5" }
    });
    console.log("Applicant:", applicant);
}

main().catch(err => {
    console.error("Error:", err);
});
