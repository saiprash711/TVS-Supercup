/**
 * GET /api/health
 *
 * Health check endpoint.
 *
 * Security Controls:
 * - Public access: Returns only status ('ok' or 'error')
 * - Admin access: Returns full diagnostics (file paths, DB details)
 * - Prevents information disclosure to unauthenticated users
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';
import { isAdmin, isEmployee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const campaign = await getCurrentSuperCupCampaign();
    const dealerCount = await prisma.dealer.count();
    const admin = await isAdmin();
    const employee = await isEmployee();
    const isPrivileged = admin || employee;

    // Public health check: minimal information only
    if (!isPrivileged) {
      return NextResponse.json({
        status: 'ok',
        database: { connected: true },
        campaignActive: Boolean(campaign),
      });
    }

    // Admin health check: full diagnostics
    const tmpPath = path.join(os.tmpdir() || '/tmp', 'supercup-serverless.db');
    const tmpExists = fs.existsSync(tmpPath);
    const tmpSize = tmpExists ? fs.statSync(tmpPath).size : 0;

    const cwdDb = path.join(process.cwd(), 'prisma/dev.db');
    const cwdExists = fs.existsSync(cwdDb);
    const cwdSize = cwdExists ? fs.statSync(cwdDb).size : 0;

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        activeCampaign: campaign?.name || null,
        campaignType: campaign?.type || null,
        dealerCount,
        tmpDb: { exists: tmpExists, size: tmpSize, path: tmpPath },
        cwdDb: { exists: cwdExists, size: cwdSize, path: cwdDb },
        databaseUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]',
      },
      environment: {
        isVercel: Boolean(process.env.VERCEL),
        nodeEnv: process.env.NODE_ENV,
        cwd: process.cwd(),
      },
    });
  } catch (error: any) {
    const admin = await isAdmin().catch(() => false);
    const employee = await isEmployee().catch(() => false);
    const isPrivileged = admin || employee;

    if (!isPrivileged) {
      return NextResponse.json({ status: 'error' }, { status: 500 });
    }

    const tmpPath = path.join(os.tmpdir() || '/tmp', 'supercup-serverless.db');
    const tmpExists = fs.existsSync(tmpPath);
    const tmpSize = tmpExists ? fs.statSync(tmpPath).size : 0;

    const cwdDb = path.join(process.cwd(), 'prisma/dev.db');
    const cwdExists = fs.existsSync(cwdDb);
    const cwdSize = cwdExists ? fs.statSync(cwdDb).size : 0;

    return NextResponse.json(
      {
        status: 'error',
        error: error?.message || 'Database connection error',
        details: {
          tmpDb: { exists: tmpExists, size: tmpSize, path: tmpPath },
          cwdDb: { exists: cwdExists, size: cwdSize, path: cwdDb },
          databaseUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[MISSING]',
          cwd: process.cwd(),
        },
      },
      { status: 500 }
    );
  }
}

