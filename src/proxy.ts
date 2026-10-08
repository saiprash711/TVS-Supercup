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

  const isAdminSubdomain =
    host.startsWith('admin.') ||
    host.includes('supercup-admin') ||
    host.startsWith('supercup-admin.');

  const hasDealerSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  // 2. Admin Subdomain Routing (e.g., https://supercup-admin.tvs.in)
  if (isAdminSubdomain) {
    // If accessing root of admin domain, redirect directly to /admin
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
  }

  // 3. Dealer Domain Routing (e.g., https://supercup.tvs.in)
  // If dealer already has an active session and visits login page (/), send to /dashboard
  if (pathname === '/' && hasDealerSession && !isAdminSubdomain) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If unauthenticated user attempts to visit /dashboard, redirect to /
  if (pathname.startsWith('/dashboard') && !hasDealerSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 4. Strict Subdomain Isolation (Optional flag: STRICT_ADMIN_SUBDOMAIN=true)
  // When enabled in production, prevents accessing /admin on the dealer-facing domain
  if (
    process.env.STRICT_ADMIN_SUBDOMAIN === 'true' &&
    host.includes('supercup.tvs.in') &&
    pathname.startsWith('/admin') &&
    !isAdminSubdomain
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
