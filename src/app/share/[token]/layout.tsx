import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "入驻申请表单 - Π立方企业服务",
  description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
  openGraph: {
    title: "入驻申请表单",
    description: "请填写您的企业入驻申请信息",
    type: "website",
    images: [
      {
        url: "/share-og-image.png",
        width: 1200,
        height: 630,
        alt: "Π立方企业服务 - 入驻申请",
      },
    ],
  },
  // 微信分享需要的 meta 标签
  other: {
    "og:site_name": "Π立方企业服务",
    "og:locale": "zh_CN",
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
