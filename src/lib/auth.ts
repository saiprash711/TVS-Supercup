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
import { prisma } from '@/lib/db';
import { getTVSProvider } from './services/tvs-integration';
import { maskDealerName } from './services/masking';

const SESSION_COOKIE = 'supercup_session';
const ADMIN_COOKIE = 'supercup_admin';

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

        const activeCamp = await prisma.campaign.findFirst({
          where: { type: 'SUPER_CUP', status: 'ACTIVE' },
        });
        if (activeCamp) {
          await prisma.dealerScore.upsert({
            where: { dealerId_campaignId: { dealerId: dealer.id, campaignId: activeCamp.id } },
            update: {},
            create: { dealerId: dealer.id, campaignId: activeCamp.id, totalPoints: 0, rank: 9999 },
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
  const envPassword = process.env.ADMIN_PASSWORD
    ? process.env.ADMIN_PASSWORD.replace(/^["']|["']$/g, '').trim()
    : 'supercup2026';
  const input = (password || '').trim();

  // Accept configured env password, 'admin', 'supercup2026', or 'tvs123'
  const isMatch =
    input === envPassword ||
    input.toLowerCase() === envPassword.toLowerCase() ||
    input.toLowerCase() === 'admin' ||
    input === 'supercup2026' ||
    input.toLowerCase() === 'supercup2026' ||
    input.toLowerCase() === 'tvs123';

  if (isMatch) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
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
    return adminCookie?.value === 'true';
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
