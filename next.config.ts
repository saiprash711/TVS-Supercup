import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  ...(process.env.DOCKER_BUILD ? { output: 'standalone' } : {}),
  outputFileTracingIncludes: {
    '/**': ['./prisma/dev.db'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
