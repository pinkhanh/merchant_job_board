import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/getSession';
import {
  assignUserToMerchant,
  UserNotFoundError,
  UserAlreadyAssignedError,
} from '@/lib/services/adminMerchantService';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let username: string;
  try {
    const body = await req.json();
    username = body.username;
    if (!username) throw new Error();
  } catch {
    return NextResponse.json({ error: 'username required' }, { status: 400 });
  }

  try {
    const user = await assignUserToMerchant(id, username);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản với tên đăng nhập này' },
        { status: 404 }
      );
    }
    if (err instanceof UserAlreadyAssignedError) {
      return NextResponse.json(
        { error: 'Tài khoản này đang thuộc một merchant khác' },
        { status: 409 }
      );
    }
    throw err;
  }
}
