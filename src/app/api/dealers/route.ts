/**
 * GET /api/dealers
 * 
 * Returns a list of dealers for the login selection.
 * Only returns essential info needed for the login dropdown.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        externalDealerId: true,
        displayName: true,
        maskedName: true,
        city: true,
      },
      orderBy: { displayName: 'asc' },
    });

    return NextResponse.json({
      dealers: dealers.map(d => ({
        id: d.id,
        externalId: d.externalDealerId,
        displayName: d.displayName,
        maskedName: d.maskedName,
        city: d.city,
      })),
    });
  } catch (error) {
    console.error('Dealers list error:', error);
    return NextResponse.json({ error: 'Failed to load dealers' }, { status: 500 });
  }
}
