import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // 转译有问题的 ES 模块
  transpilePackages: ['linkifyjs', '@tiptap/react'],
};

export default nextConfig;
