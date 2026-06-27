import { prisma } from '@/lib/db/prisma';

export async function createExportLog({
  userId,
  applicantCount,
  fileName,
  filters,
}: {
  userId: string;
  applicantCount: number;
  fileName: string;
  filters: Record<string, string | undefined>;
}) {
  return prisma.csvExportLog.create({
    data: {
      exportedBy: userId,
      applicantCount,
      fileName,
      filters,
    },
  });
}

export async function listExportLogs({
  userId,
  limit = 20,
}: {
  userId: string;
  limit?: number;
}) {
  return prisma.csvExportLog.findMany({
    where: { exportedBy: userId },
    orderBy: { exportedAt: 'desc' },
    take: limit,
  });
}
