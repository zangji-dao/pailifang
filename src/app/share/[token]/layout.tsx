import type { Metadata } from "next";

// 动态生成 metadata，确保图片使用完整URL
export const generateMetadata = async (): Promise<Metadata> => {
  // 获取域名（环境变量已包含 https:// 前缀）
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || "";
  
  return {
    title: "入驻申请表单 - Π立方企业服务",
    description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
    openGraph: {
      title: "入驻申请表单",
      description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
      type: "website",
      // 使用完整URL，微信要求（PNG格式，微信对SVG支持不好）
      images: domain ? [
        {
          url: `${domain}/og-share.png`,
          width: 1200,
          height: 630,
          alt: "Π立方企业服务 - 入驻申请",
        },
      ] : [],
      siteName: "Π立方企业服务",
      locale: "zh_CN",
    },
    // 微信分享额外需要的标签
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
