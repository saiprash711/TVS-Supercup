/**
 * GET /api/dealers
 * 
 * Returns a list of dealers.
 * 
 * Security Controls:
 * - Authentication required: Admin sees full details, dealers see masked names only
 * - Unauthenticated requests are rejected (prevents customer data exposure)
 * - Phone numbers and passwords are NEVER returned
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin, getCurrentDealer } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await isAdmin();
    const currentDealer = await getCurrentDealer();

    // Unauthenticated users cannot access the dealer directory
    if (!admin && !currentDealer) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const dealers = await prisma.dealer.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        externalDealerId: true,
        displayName: true,
        maskedName: true,
        city: true,
        // NEVER select: phone, password
      },
      orderBy: { displayName: 'asc' },
    });

    // Admin gets full details; dealers only see masked names (prevents competitor intelligence)
    if (admin) {
      return NextResponse.json({
        dealers: dealers.map(d => ({
          id: d.id,
          externalId: d.externalDealerId,
          displayName: d.displayName,
          maskedName: d.maskedName,
          city: d.city,
        })),
      });
    }

    // Authenticated dealer: only return masked names and IDs needed for the UI
    return NextResponse.json({
      dealers: dealers.map(d => ({
        id: d.id,
        externalId: d.externalDealerId,
        displayName: d.maskedName, // Masked! Not the real name
        maskedName: d.maskedName,
        city: d.city,
      })),
    });
  } catch (error) {
    console.error('Dealers list error:', error);
    return NextResponse.json({ error: 'Failed to load dealers' }, { status: 500 });
  }
}

