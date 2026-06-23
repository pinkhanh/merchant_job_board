import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session';

export class InvalidCredentialsError extends Error {}
export class InactiveAccountError extends Error {}

export async function login(
  username: string,
  password: string
): Promise<{ token: string; role: 'merchant' | 'admin' }> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new InvalidCredentialsError();
  if (!user.isActive) throw new InactiveAccountError();

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new InvalidCredentialsError();

  const token = await createSessionToken({
    userId: user.id,
    role: user.role as 'merchant' | 'admin',
    merchantId: user.merchantId,
  });

  return { token, role: user.role as 'merchant' | 'admin' };
}
