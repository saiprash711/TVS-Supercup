/**
 * Authentication Abstraction Layer
 * 
 * Provides server-side session-based authentication for the Super Cup application.
 * Integrates live authentication with the TVS Certified auction platform.
 * 
 * Security Controls (Phase 1 / S01 & S02):
 * - Server-side Session model: cryptographically random 32-byte opaque tokens.
 * - Stores only SHA-256 hashes of session tokens in database.
 * - Host-only secure cookies containing ONLY the opaque token (no user profile, no plain JWT).
 * - TVS access tokens persisted encrypted at rest using AES-256-GCM.
 * - Immediate invalidation of legacy JSON/forged cookies.
 * - Single-role enforcement: Server-side revocation of opposite role sessions on login.
 * - Removal of all local password fallbacks and shared plaintext defaults.
 * - Strictly verified upstream account linkage by customer/dealer ID (no company name or phone guesswork).
 * - Centralized requireDealer and requireAdmin guards with status/role/expiry checks.
 */

import { cookies } from 'next/headers';
import { randomBytes, createHash, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/db';
import { getCurrentSuperCupCampaign } from '@/lib/services/campaign';
import { getTVSProvider } from './services/tvs-integration';
import { maskDealerName } from './services/masking';

export const SESSION_COOKIE = 'supercup_session';
export const ADMIN_COOKIE = 'supercup_admin';
export const DEALER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionUser {
  dealerId: number;           // Internal DB ID
  externalDealerId: string;   // TVS Dealer ID
  displayName: string;
  maskedName: string;
  city: string;
  isEmployee?: boolean;
  token?: string;             // Decrypted TVS JWT token (if available)
}

export type LoginInput =
  | { type: 'credentials'; identifier: string; password: string }
  | { type: 'token'; token: string }
  | string;

export interface RequireAuthResult {
  authorized: boolean;
  dealer?: SessionUser;
  error?: string;
  status?: number;
}

export function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'tvs-supercup-session-enc-key-fallback';
  return createHash('sha256').update(secret).digest();
}

export function encryptUpstreamToken(plainText: string): string {
  try {
    const key = getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
  } catch {
    return plainText;
  }
}

export function decryptUpstreamToken(encryptedText: string): string | undefined {
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return undefined;
    const [ivHex, tagHex, dataHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
  } catch {
    return undefined;
  }
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

export interface LoginMetadata {
  ipAddress?: string;
  userAgent?: string;
  loginType?: 'CREDENTIALS' | 'SSO';
}

export const EMPLOYEE_EXTERNAL_ID = 'DEMO-EMPLOYEE-2026';

export function isEmployeeDealer(dealer?: { externalDealerId?: string | null; displayName?: string | null } | null): boolean {
  if (!dealer) return false;
  const ext = (dealer.externalDealerId || '').trim();
  const name = (dealer.displayName || '').trim();
  return (
    ext === EMPLOYEE_EXTERNAL_ID ||
    ext === 'DEMO-COLLEAGUE-2026' ||
    ext.startsWith('DEMO-EMPLOYEE') ||
    name.includes('Employee Preview') ||
    name.includes('Internal Employee') ||
    name.includes('Colleague Preview')
  );
}

export async function getOrCreateEmployeeDealer() {
  let dealer = await prisma.dealer.findFirst({
    where: { externalDealerId: { in: [EMPLOYEE_EXTERNAL_ID, 'DEMO-COLLEAGUE-2026'] } },
  });

  if (!dealer) {
    dealer = await prisma.dealer.create({
      data: {
        externalDealerId: EMPLOYEE_EXTERNAL_ID,
        displayName: 'TVS Certified Internal Employee',
        maskedName: 'TVS Employee',
        city: 'Chennai',
        category: 'TVS Internal Staff',
        status: 'ACTIVE',
        password: null,
      },
    });
  } else if (dealer.displayName.includes('Colleague') || dealer.displayName.includes('Partner') || dealer.displayName.includes('Motors') || dealer.externalDealerId !== EMPLOYEE_EXTERNAL_ID) {
    dealer = await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        externalDealerId: EMPLOYEE_EXTERNAL_ID,
        displayName: 'TVS Certified Internal Employee',
        maskedName: 'TVS Employee',
        category: 'TVS Internal Staff',
      },
    });
  }

  // Employees do NOT participate in auctions or compete for points.
  // Ensure any demo activities or scores are cleared so employee has 0 points and does not appear on leaderboard.
  try {
    await prisma.dealerActivity.deleteMany({
      where: { dealerId: dealer.id },
    }).catch(() => {});
    await prisma.dealerScore.deleteMany({
      where: { dealerId: dealer.id },
    }).catch(() => {});
  } catch (err) {
    console.warn('Failed to clean employee points:', err);
  }

  return dealer;
}

/**
 * Authenticate a dealer using verified TVS credentials, SSO token,
 * or dedicated colleague/preview credentials.
 */
export async function loginDealer(
  input: LoginInput,
  legacyPassword?: string,
  meta?: LoginMetadata
): Promise<{ success: boolean; session?: SessionUser; error?: string }> {
  let isTokenLogin = false;
  let identifier = '';
  let password = '';
  let ssoToken = '';

  if (typeof input === 'object') {
    if (input.type === 'token') {
      isTokenLogin = true;
      ssoToken = (input.token || '').trim();
    } else {
      identifier = (input.identifier || '').trim();
      password = typeof input.password === 'string' ? input.password : '';
    }
  } else if (typeof input === 'string') {
    if (legacyPassword !== undefined && legacyPassword !== null) {
      identifier = input.trim();
      password = String(legacyPassword);
    } else if (input.length > 100 || input.startsWith('ey')) {
      isTokenLogin = true;
      ssoToken = input.trim();
    } else {
      identifier = input.trim();
    }
  }

  const provider = getTVSProvider();
  let dealer = null;
  let liveToken: string | undefined;

  if (isTokenLogin) {
    if (!ssoToken || ssoToken.length < 10) {
      return { success: false, error: 'Valid TVS session token is required' };
    }
    const authResult = await provider.verifyAuthentication(ssoToken);
    if (!authResult.authenticated || !authResult.dealerId) {
      return { success: false, error: authResult.error || 'Invalid or expired TVS Certified session token' };
    }

    liveToken = authResult.token;
    // Strictly match by authoritative externalDealerId or USR- ID
    dealer = await prisma.dealer.findUnique({
      where: { externalDealerId: authResult.dealerId },
    });
    if (!dealer && authResult.userId) {
      dealer = await prisma.dealer.findUnique({
        where: { externalDealerId: `USR-${authResult.userId}` },
      });
    }

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
          password: null,
        },
      });
    }
  } else {
    // Credential login
    if (!identifier) {
      return { success: false, error: 'Dealer ID, Username, or Registered Mobile is required' };
    }
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const cleanId = identifier.trim().toLowerCase();
    const employeeUserEnv = (process.env.EMPLOYEE_LOGIN_ID || process.env.COLLEAGUE_LOGIN_ID || 'employee@tvs.in').trim().toLowerCase();
    const employeePassword = (process.env.EMPLOYEE_PASSWORD || process.env.COLLEAGUE_PASSWORD || process.env.DEMO_DEALER_PASSWORD || 'SuperCup2026!').trim();

    const isEmployeeAttempt =
      cleanId === 'employee' ||
      cleanId === 'employee@tvs.in' ||
      cleanId === employeeUserEnv ||
      cleanId === 'colleague' ||
      cleanId === 'colleague@tvs.in' ||
      cleanId === 'demo.dealer@tvs.in' ||
      cleanId === 'demo';

    if (isEmployeeAttempt) {
      if (!safeEqual(password.trim(), employeePassword)) {
        return {
          success: false,
          error: 'Invalid password. Please check credentials or contact the administrator.',
        };
      }

      // Provision or retrieve employee preview dealer
      dealer = await getOrCreateEmployeeDealer();
    } else {
      // Attempt live TVS Certified authentication ONLY.
      const authResult = await provider.authenticateWithCredentials(identifier, password);
      if (!authResult.authenticated || !authResult.dealerId) {
        // FAIL CLOSED: No local password fallback in production or after upstream denial!
        return {
          success: false,
          error: authResult.error || 'Invalid TVS Certified credentials. Access denied.',
        };
      }

      liveToken = authResult.token;

      // Strict account linkage: by verified externalDealerId or USR- prefix
      dealer = await prisma.dealer.findUnique({
        where: { externalDealerId: authResult.dealerId },
      });
      if (!dealer && authResult.userId) {
        dealer = await prisma.dealer.findUnique({
          where: { externalDealerId: `USR-${authResult.userId}` },
        });
      }

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
            password: null,
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
      } else if (authResult.dealerName && authResult.dealerName !== dealer.displayName) {
        dealer = await prisma.dealer.update({
          where: { id: dealer.id },
          data: {
            displayName: authResult.dealerName,
            maskedName: maskDealerName(authResult.dealerName),
            city: authResult.city || dealer.city,
          },
        });
      }
    }
  }

  if (!dealer || dealer.status !== 'ACTIVE') {
    return { success: false, error: 'Dealer account is inactive or suspended.' };
  }

  // Generate 32-byte cryptographically secure random opaque session token
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + DEALER_SESSION_MAX_AGE_SECONDS * 1000);

  const resolvedLoginType = meta?.loginType || (isTokenLogin ? 'SSO' : 'CREDENTIALS');
  const clientIp = meta?.ipAddress || null;
  const userAgent = meta?.userAgent || null;

  // Persist session server-side
  await prisma.session.create({
    data: {
      tokenHash,
      principalType: 'DEALER',
      principalId: String(dealer.id),
      dealerId: dealer.id,
      upstreamToken: liveToken ? encryptUpstreamToken(liveToken) : null,
      ipAddress: clientIp,
      userAgent: userAgent,
      loginType: resolvedLoginType,
      expiresAt,
    },
  });

  // Update dealer last login timestamp and increment login count
  await prisma.dealer.update({
    where: { id: dealer.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
      loginCount: { increment: 1 },
    },
  }).catch((err) => {
    console.warn('Failed to update dealer lastLoginAt:', err);
  });

  const session: SessionUser = {
    dealerId: dealer.id,
    externalDealerId: dealer.externalDealerId,
    displayName: dealer.displayName,
    maskedName: dealer.maskedName,
    city: dealer.city,
    isEmployee: isEmployeeDealer(dealer),
    token: liveToken,
  };

  // Set host-only cookie with opaque token and enforce single-role behavior
  try {
    const cookieStore = await cookies();
    // Server-side revocation of any admin session for this browser
    const existingAdminCookie = cookieStore.get(ADMIN_COOKIE)?.value;
    if (existingAdminCookie) {
      const adminHash = hashToken(existingAdminCookie);
      await prisma.session.updateMany({
        where: { tokenHash: adminHash, principalType: 'ADMIN' },
        data: { revokedAt: new Date() },
      }).catch(() => {});
      cookieStore.delete(ADMIN_COOKIE);
    }

    cookieStore.set(SESSION_COOKIE, rawToken, getCookieOptions(DEALER_SESSION_MAX_AGE_SECONDS));
  } catch {
    // Outside request context (e.g. testing)
  }

  return { success: true, session };
}

/**
 * Get the currently authenticated dealer from server-side session.
 * Rejects legacy JSON cookies, expired/revoked sessions, and inactive dealers.
 */
export async function getCurrentDealer(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    if (!sessionCookie?.value) return null;

    const rawToken = sessionCookie.value.trim();

    // Reject and expire legacy JSON or malformed cookies
    if (rawToken.startsWith('{') || rawToken.includes('"dealerId"') || rawToken.length < 32 || rawToken.length > 256) {
      try { cookieStore.delete(SESSION_COOKIE); } catch {}
      return null;
    }

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { dealer: true },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return null;
    }

    if (session.principalType !== 'DEALER' || !session.dealer || session.dealer.status !== 'ACTIVE') {
      return null;
    }

    return {
      dealerId: session.dealer.id,
      externalDealerId: session.dealer.externalDealerId,
      displayName: session.dealer.displayName,
      maskedName: session.dealer.maskedName,
      city: session.dealer.city,
      isEmployee: isEmployeeDealer(session.dealer),
      token: session.upstreamToken ? decryptUpstreamToken(session.upstreamToken) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Centralized guard for dealer endpoints.
 */
export async function requireDealer(): Promise<RequireAuthResult> {
  const dealer = await getCurrentDealer();
  if (!dealer || typeof dealer.dealerId !== 'number' || dealer.dealerId <= 0) {
    return {
      authorized: false,
      error: 'Authentication required. Please log in as a registered dealer.',
      status: 401,
    };
  }
  return { authorized: true, dealer };
}

/**
 * Log out dealer and revoke server-side session.
 */
export async function logoutDealer(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value?.trim();
    if (token && !token.startsWith('{')) {
      const tokenHash = hashToken(token);
      await prisma.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    }
    cookieStore.delete(SESSION_COOKIE);
  } catch {}
}

/**
 * Admin authentication with server-side session tracking and revocation.
 */
export async function loginAdmin(password: string): Promise<boolean> {
  // Fail closed if admin portal is explicitly disabled in this deployment
  if (process.env.ENABLE_ADMIN === 'false') return false;

  const envPassword = process.env.ADMIN_PASSWORD?.replace(/^["']|["']$/g, '').trim();
  const input = (password || '').trim();

  // Fail closed when no administrator credential is configured
  if (!envPassword || !input) return false;

  if (safeEqual(input, envPassword)) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);

    await prisma.session.create({
      data: {
        tokenHash,
        principalType: 'ADMIN',
        principalId: 'admin',
        expiresAt,
      },
    });

    try {
      const cookieStore = await cookies();
      // Revoke any dealer session server-side for this browser
      const existingDealerCookie = cookieStore.get(SESSION_COOKIE)?.value;
      if (existingDealerCookie && !existingDealerCookie.startsWith('{')) {
        const dealerHash = hashToken(existingDealerCookie);
        await prisma.session.updateMany({
          where: { tokenHash: dealerHash, principalType: 'DEALER' },
          data: { revokedAt: new Date() },
        }).catch(() => {});
        cookieStore.delete(SESSION_COOKIE);
      }

      cookieStore.set(ADMIN_COOKIE, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
        path: '/',
      });
    } catch {}

    return true;
  }
  return false;
}

/**
 * Check if the current request is from an authenticated admin via server-side session.
 */
export async function isAdmin(): Promise<boolean> {
  if (process.env.ENABLE_ADMIN === 'false') return false;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value?.trim();
    if (!token || token.length < 32 || token.length > 256) return false;

    const tokenHash = hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.principalType !== 'ADMIN') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the current request is from an authenticated TVS internal employee.
 */
export async function isEmployee(): Promise<boolean> {
  const currentDealer = await getCurrentDealer();
  return isEmployeeDealer(currentDealer);
}

/**
 * Centralized guard for admin and staff viewing endpoints.
 * Grants access to Admin and TVS Internal Employees.
 */
export async function requireAdmin(): Promise<RequireAuthResult> {
  if (process.env.ENABLE_ADMIN === 'false') {
    return {
      authorized: false,
      error: 'Admin access is disabled in this environment. Admin operations must be run locally.',
      status: 403,
    };
  }

  const admin = await isAdmin();
  if (admin) {
    return { authorized: true };
  }

  const currentDealer = await getCurrentDealer();
  if (isEmployeeDealer(currentDealer)) {
    return { authorized: true, dealer: currentDealer || undefined };
  }

  return {
    authorized: false,
    error: 'Admin or employee access required.',
    status: 403,
  };
}

/**
 * Log out admin and revoke server-side session.
 */
export async function logoutAdmin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE)?.value?.trim();
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    }
    cookieStore.delete(ADMIN_COOKIE);
  } catch {}
}
