import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import { Toaster } from '@/components/ui/sonner';
import { ConfirmProvider } from '@/components/confirm-dialog';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Π立方企业服务中心',
    template: '%s | Π立方',
  },
  description:
    'Π立方企业服务中心 - 专业的企业服务平台，提供代理记账、工商注册、税务申报、人力资源等一站式企业服务。',
  keywords: [
    'Π立方',
    '企业服务',
    '代理记账',
    '税务申报',
    '工商注册',
    '人力资源',
    '财务外包',
  ],
  authors: [{ name: 'Π立方企业服务中心' }],
  generator: 'Π立方',
  openGraph: {
    title: 'Π立方企业服务中心',
    description: '专业的企业服务平台，提供代理记账、工商注册、税务申报、人力资源等一站式企业服务。',
    siteName: 'Π立方',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {isDev && <Inspector />}
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
