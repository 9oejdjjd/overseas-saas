import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating existing questions with EASY or MEDIUM difficulty to HARD...');
  const result = await prisma.$executeRaw`UPDATE "Question" SET "difficulty" = 'HARD'::"QuestionDifficulty" WHERE "difficulty" IN ('EASY'::"QuestionDifficulty", 'MEDIUM'::"QuestionDifficulty")`;
  console.log('Update result:', result);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
