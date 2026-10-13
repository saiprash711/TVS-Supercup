import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || undefined;

const nextConfig: NextConfig = {
  /* Dynamic base path for enterprise subpath routing (e.g., tvs.in/supercup) */
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),

  ...(process.env.DOCKER_BUILD ? { output: 'standalone' } : {}),
  outputFileTracingIncludes: {
    '/api/**/*': ['./prisma/dev.db'],
    '/api/**': ['./prisma/dev.db'],
    '/**/*': ['./prisma/dev.db'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // ─── Powered-By Header Removal (prevents server fingerprinting) ─────
  poweredByHeader: false,

  async redirects() {
    return [
      {
        source: '/dealer-portal',
        destination: '/dealer',
        permanent: true,
      },
      {
        source: '/supercup',
        destination: '/',
        permanent: false,
      },
      {
        source: '/tvs-supercup',
        destination: '/',
        permanent: false,
      },
    ];
  },

  async headers() {
    // CSP policy: allow self + inline styles (needed for Next.js), block everything else
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https://tvs.in https://*.tvs.in",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      // ── Global Security Headers ──────────────────────────────────────
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-XSS-Protection',
            value: '0', // Rely on CSP; X-XSS-Protection can cause issues
          },
        ],
      },
      // ── API-Specific: Prevent caching of sensitive data ──────────────
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

