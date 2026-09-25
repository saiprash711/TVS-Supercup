import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tmpPath = path.join(os.tmpdir() || '/tmp', 'supercup-serverless.db');
  const tmpExists = fs.existsSync(tmpPath);
  const tmpSize = tmpExists ? fs.statSync(tmpPath).size : 0;

  const cwdDb = path.join(process.cwd(), 'prisma/dev.db');
  const cwdExists = fs.existsSync(cwdDb);
  const cwdSize = cwdExists ? fs.statSync(cwdDb).size : 0;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { type: 'SUPER_CUP', status: 'ACTIVE' },
    });
    const dealerCount = await prisma.dealer.count();

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
