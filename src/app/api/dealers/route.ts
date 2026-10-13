/**
 * GET /api/dealers
 * 
 * Returns a list of dealers.
 * 
 * Security Controls:
 * - Restricted to Administrators ONLY.
 * - Participating dealers are strictly forbidden from accessing the full dealer list,
 *   preventing competitor intelligence, enumeration, or deanonymization attacks.
 * - Phone numbers and passwords are NEVER returned under any circumstances.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await isAdmin();

    // Directory is restricted to administrators only.
    // Dealers cannot access or enumerate other dealers under any circumstances.
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required. Dealer directory is restricted.' },
        { status: 403 }
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
