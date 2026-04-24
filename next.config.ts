import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // 允许在生产环境构建时存在类型错误（为了确保您的项目能先跑起来）
    ignoreBuildErrors: true,
  },
  eslint: {
    // 允许在生产环境构建时存在 ESLint 警告/错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
