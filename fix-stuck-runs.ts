import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    const result = await prisma.pipelineRun.updateMany({
        where: {
            status: 'running'
        },
        data: {
            status: 'error'
        }
    })
    console.log(`Updated ${result.count} stuck pipeline runs to error status.`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
