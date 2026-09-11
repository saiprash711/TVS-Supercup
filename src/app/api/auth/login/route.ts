/**
 * POST /api/auth/login
 * GET  /api/auth/logout
 * GET  /api/auth/me
 * 
 * Authentication endpoints for dealer login/logout.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginDealer, getCurrentDealer, logoutDealer } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, dealerId, identifier, username, mobile, password } = body;

    const authIdentifier = identifier || dealerId || username || mobile || token;

    if (!authIdentifier) {
      return NextResponse.json(
        { error: 'TVS Dealer ID or Registered Mobile number is required' },
        { status: 400 }
      );
    }

    const result = await loginDealer(authIdentifier, password);
    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      dealer: {
        displayName: result.session.displayName,
        maskedName: result.session.maskedName,
        city: result.session.city,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const dealer = await getCurrentDealer();
  if (!dealer) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    dealer: {
      displayName: dealer.displayName,
      maskedName: dealer.maskedName,
      city: dealer.city,
    },
  });
}

export async function DELETE() {
  await logoutDealer();
  return NextResponse.json({ success: true });
}
