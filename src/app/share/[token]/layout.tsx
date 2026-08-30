import type { Metadata } from "next";

// 动态生成 metadata
export const generateMetadata = async (): Promise<Metadata> => {
  const domain = process.env.APP_URL || "http://localhost:5000";
  const ogImageUrl = new URL('/og-share.png', domain).toString();
  
  return {
    title: "入驻申请表单 - Π立方企业服务",
    description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
    openGraph: {
      title: "入驻申请表单",
      description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Π立方企业服务 - 入驻申请",
        },
      ],
      siteName: "Π立方企业服务",
      locale: "zh_CN",
    },
    other: {
      "og:site_name": "Π立方企业服务",
      "og:locale": "zh_CN",
    },
  };
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
