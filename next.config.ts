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
  async headers() {
    return [
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
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
