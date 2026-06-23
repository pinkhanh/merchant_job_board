import { SignJWT, jwtVerify } from 'jose';

export type SessionPayload = {
  userId: string;
  role: 'merchant' | 'admin';
  merchantId: string | null;
};

function secretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
