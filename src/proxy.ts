import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * TVS Super Cup - Request Proxy & Routing Controller (Next.js 16 Convention)
 * 
 * Handles:
 * 1. Subdomain-based routing (Dealer Domain vs. Admin Domain)
 * 2. Automatic route redirection (/ to /dashboard for authenticated dealers)
 * 3. Protected route guards (/dashboard requires active session)
 * 4. Header normalization for Reverse Proxies / Corporate Load Balancers
 */

const SESSION_COOKIE = 'supercup_session';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Detect incoming Host (respects X-Forwarded-Host from TVS reverse proxy/WAF)
  const host = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase();

  const isLocalhost =
    host.includes('localhost') ||
    host.includes('127.0.0.1');

  const isAdminSubdomain =
    host.startsWith('admin.') ||
    host.includes('supercup-admin') ||
    host.startsWith('supercup-admin.');

  const hasDealerSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const hasAdminSession = Boolean(request.cookies.get('supercup_admin')?.value);

  // 2. Admin Subdomain Routing (e.g., https://supercup-admin.tvs.in)
  if (isAdminSubdomain) {
    // If accessing root of admin domain, redirect directly to /admin
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // 3. Admin Access Control (Local-only vs Deployed Vercel)
  // When ENABLE_ADMIN is 'false', or in production without ENABLE_ADMIN='true',
  // block all /admin access and redirect to dealer portal.
  // This ensures admin can only be operated locally on your PC (localhost:3000)
  // unless explicitly allowed in environment variables.
  const isAdminGloballyDisabled = process.env.ENABLE_ADMIN === 'false';
  const isExplicitAdminAllowed = process.env.ENABLE_ADMIN === 'true';
  const allowAdmin = !isAdminGloballyDisabled && (isLocalhost || isExplicitAdminAllowed || isAdminSubdomain);

  if (pathname.startsWith('/admin')) {
    if (!allowAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // 4. Dealer Domain Routing (e.g., https://supercup.tvs.in or https://tvs-supercup.vercel.app)
  // If dealer already has an active session and visits login page (/), send to /dashboard
  if (pathname === '/' && hasDealerSession && !isAdminSubdomain) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If unauthenticated user attempts to visit /dashboard, /dealer, or /leaderboard, redirect to /
  if (
    (pathname.startsWith('/dashboard') || pathname.startsWith('/dealer') || pathname.startsWith('/leaderboard')) &&
    !hasDealerSession &&
    !hasAdminSession
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 5. Strict Subdomain Isolation (DEFAULT: ON in production)
  // Prevents accessing /admin on the dealer-facing domain (blocks attack surface)
  // Set STRICT_ADMIN_SUBDOMAIN=false to explicitly disable (dev only)
  if (
    process.env.STRICT_ADMIN_SUBDOMAIN !== 'false' &&
    (host.includes('supercup.tvs.in') || host.includes('vercel.app') || host.includes('tvssupercup.in')) &&
    pathname.startsWith('/admin') &&
    !isAdminSubdomain &&
    !isLocalhost &&
    !isExplicitAdminAllowed
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 6. Forward request with normalized proxy headers
  const response = NextResponse.next();
  response.headers.set('X-Supercup-Routing-Mode', isAdminSubdomain ? 'admin-console' : 'dealer-portal');

  return response;
}

// Backwards compatibility alias for middleware runners
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled independently with own auth logic)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, video, image, and font files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico|woff|woff2)$).*)',
  ],
};
