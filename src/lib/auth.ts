/**
 * Authentication Abstraction Layer
 * 
 * Provides session-based authentication for the Super Cup application.
 * Integrates live authentication with the TVS Certified auction platform
 * with fallback to mock accounts for local development.
 * 
 * Architecture:
 *   Dealer → Live TVS Certified authenticate API → Verified identity → Super Cup app
 */

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';
import { getTVSProvider } from './services/tvs-integration';
import { maskDealerName } from './services/masking';

const SESSION_COOKIE = 'supercup_session';
const ADMIN_COOKIE = 'supercup_admin';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function getAdminSecret(): string | null {
  const password = process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, '').trim();
  if (!password) return null;
  return process.env.SESSION_SECRET?.trim() || password;
}

function signAdminSession(issuedAt: number, secret: string): string {
  const payload = String(issuedAt);
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyAdminSession(value: string, secret: string): boolean {
  const [issuedAtRaw, suppliedSignature, ...extra] = value.split('.');
  if (!issuedAtRaw || !suppliedSignature || extra.length > 0) return false;

  const issuedAt = Number(issuedAtRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(issuedAt) || issuedAt > now || now - issuedAt > ADMIN_SESSION_MAX_AGE_SECONDS) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(issuedAtRaw)
    .digest('base64url');
  return safeEqual(suppliedSignature, expectedSignature);
}

export interface SessionUser {
  dealerId: number;           // Internal DB ID
  externalDealerId: string;   // TVS Dealer ID
  displayName: string;
  maskedName: string;
  city: string;
  token?: string;             // Live TVS JWT token
}

/**
 * Authenticate a dealer using TVS credentials (Dealer ID or Mobile + Password) or SSO token.
 */
export async function loginDealer(
  identifierOrToken: string,
  password?: string
): Promise<{ success: boolean; session?: SessionUser; error?: string }> {
  const trimmed = (identifierOrToken || '').trim();
  if (!trimmed) {
    return { success: false, error: 'Dealer ID, Username, or Registered Mobile is required' };
  }

  const provider = getTVSProvider();
  let dealer = null;
  let liveToken: string | undefined;

  // 1. If password is provided, first attempt live TVS Certified authentication
  if (password) {
    const authResult = await provider.authenticateWithCredentials(trimmed, password);

    if (authResult.authenticated && authResult.dealerId) {
      liveToken = authResult.token;

      // Find or auto-provision the dealer in the local database
      dealer = await prisma.dealer.findFirst({
        where: {
          OR: [
            { externalDealerId: authResult.dealerId },
            ...(authResult.userId ? [{ externalDealerId: `USR-${authResult.userId}` }, { externalDealerId: authResult.userId }] : []),
            ...(/^\d{10}$/.test(trimmed) ? [{ phone: trimmed }] : []),
          ],
        },
      });

      if (!dealer) {
        const displayName = authResult.dealerName || authResult.dealerId;
        const maskedName = maskDealerName(displayName);

        dealer = await prisma.dealer.create({
          data: {
            externalDealerId: authResult.dealerId,
            displayName,
            maskedName,
            city: authResult.city || 'Tamil Nadu',
            status: 'ACTIVE',
          },
        });

        const activeCamp = await getCurrentSuperCupCampaign();
        if (activeCamp) {
          await prisma.dealerScore.upsert({
            where: { dealerId_campaignId: { dealerId: dealer.id, campaignId: activeCamp.id } },
            update: {},
            create: { dealerId: dealer.id, campaignId: activeCamp.id, totalPoints: 0, rank: 0 },
          }).catch(() => {});
        }
      }

      if (!dealer) {
        return {
          success: false,
          error: 'Dealer account authenticated with TVS Certified but could not be mapped.',
        };
      }
    } else {
      return {
        success: false,
        error: authResult.error || 'Invalid TVS Certified credentials. Please check your username and password.',
      };
    }
  } else {
    // SSO token verification
    const authResult = await provider.verifyAuthentication(trimmed);
    if (authResult.authenticated && authResult.dealerId) {
      liveToken = authResult.token;
      dealer = await prisma.dealer.findFirst({
        where: {
          OR: [
            { externalDealerId: authResult.dealerId },
            ...(authResult.userId ? [{ externalDealerId: `USR-${authResult.userId}` }, { externalDealerId: authResult.userId }] : []),
          ],
        },
      });
    }

    if (!dealer) {
      return {
        success: false,
        error: authResult.error || 'Invalid or expired TVS Certified session token.',
      };
    }
  }

  if (!dealer || dealer.status !== 'ACTIVE') {
    return { success: false, error: 'Dealer account is inactive or not found.' };
  }

  const session: SessionUser = {
    dealerId: dealer.id,
    externalDealerId: dealer.externalDealerId,
    displayName: dealer.displayName,
    maskedName: dealer.maskedName,
    city: dealer.city,
    token: liveToken,
  };

  // Store session in cookie (safely handles both Next.js HTTP requests and test execution)
  try {
    const cookieStore = await cookies();
    // A browser session can hold exactly one role. Dealer login revokes admin access.
    cookieStore.delete(ADMIN_COOKIE);
    cookieStore.set(SESSION_COOKIE, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
  } catch {
    // Running outside HTTP request context (e.g. CLI or integration test)
  }

  return { success: true, session };
}

/**
 * Get the currently authenticated dealer from the session cookie.
 */
export async function getCurrentDealer(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie?.value) return null;
    return JSON.parse(sessionCookie.value) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Log out the current dealer.
 */
export async function logoutDealer(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Admin authentication (simple password-based).
 */
export async function loginAdmin(password: string): Promise<boolean> {
  const envPassword = process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, '').trim();
  const input = (password || '').trim();
  const secret = getAdminSecret();

  // Fail closed when no administrator credential is configured.
  if (!envPassword || !secret || !input) return false;

  if (safeEqual(input, envPassword)) {
    const cookieStore = await cookies();
    // Clear any dealer session cookie when entering an administrator session.
    cookieStore.delete(SESSION_COOKIE);

    const issuedAt = Math.floor(Date.now() / 1000);
    cookieStore.set(ADMIN_COOKIE, signAdminSession(issuedAt, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
    return true;
  }
  return false;
}

/**
 * Check if the current request is from an admin.
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    const adminCookie = cookieStore.get(ADMIN_COOKIE);
    const secret = getAdminSecret();
    if (!adminCookie?.value || !secret) return false;
    return verifyAdminSession(adminCookie.value, secret);
  } catch {
    return false;
  }
}

/**
 * Log out admin.
 */
export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
