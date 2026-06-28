import { prisma } from '@/lib/db/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: { merchantId: { not: null } },
    select: { id: true, merchantId: true },
  });
  for (const user of users) {
    if (!user.merchantId) continue;
    await prisma.userMerchant.upsert({
      where: { userId_merchantId: { userId: user.id, merchantId: user.merchantId } },
      update: {},
      create: { userId: user.id, merchantId: user.merchantId },
    });
  }
  console.log(`Backfilled ${users.length} user-merchant assignments`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
