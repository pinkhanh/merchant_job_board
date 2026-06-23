import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 no longer reads the connection string from `schema.prisma`'s
// datasource block at runtime, so the pooled DATABASE_URL (pgbouncer,
// port 6543) is wired up explicitly via the pg driver adapter here.
// DIRECT_URL (port 5432) is used separately by Prisma Migrate via
// prisma.config.ts, since PgBouncer's transaction pooling mode doesn't
// support the prepared statements Migrate needs.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
