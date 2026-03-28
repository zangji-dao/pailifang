import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname),
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  devIndicators: false,
  // 禁用 devtools 以避免 [object Event] 错误
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

// 禁用 Next.js devtools
process.env.NEXT_PRIVATE_DISABLE_DEVTOOLS = '1';

export default nextConfig;
