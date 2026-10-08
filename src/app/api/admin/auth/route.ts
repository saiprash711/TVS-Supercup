/**
 * POST /api/admin/auth
 * 
 * Admin login endpoint.
 * Protected against dealer session access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginAdmin, isAdmin, logoutAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const success = await loginAdmin(password);
    if (!success) {
      return NextResponse.json({ error: 'Invalid administrator password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}

export async function GET() {
  const admin = await isAdmin();
  return NextResponse.json({ authenticated: admin });
}

export async function DELETE() {
  await logoutAdmin();
  return NextResponse.json({ success: true });
}
