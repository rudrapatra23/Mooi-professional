// scripts/test-db.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient({ log: ['query','error'] });

async function main(){
  try {
    const r = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log("DB TEST OK:", r);
  } catch (e) {
    console.error("DB TEST ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
