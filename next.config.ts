import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      resolveAlias: {
        recharts: 'recharts/lib/index.js',
      },
    },
  },
};

export default nextConfig;
