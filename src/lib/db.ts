import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL
const sslMode = process.env.DB_SSL_MODE
if (dbUrl && sslMode) {
  try {
    const u = new URL(dbUrl)
    u.searchParams.set('sslmode', sslMode)
    process.env.DATABASE_URL = u.toString()
  } catch {}
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

async function ensurePaymentStatusColumn() {
  try {
    const rows: any[] = await prisma.$queryRaw`SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'isPaid'`
    if (!rows || rows.length === 0) {
      await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;')
    }
  } catch {}
}

if (process.env.NODE_ENV === 'production') {
  ensurePaymentStatusColumn()
}
