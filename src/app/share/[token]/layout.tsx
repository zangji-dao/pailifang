import type { Metadata } from "next";

// OG图片URL（对象存储，公开可访问）
const OG_IMAGE_URL = "https://coze-coding-project.tos.coze.site/coze_storage_7616706366320672831/image/generate_image_f92c85a5-3a23-4ecc-860c-e785074c240b.jpeg?sign=1805530191-de1fe4b969-0-508bccdb528e309935772fd335e76107404bd186814a00cbafb2cabfcd21814b";

// 动态生成 metadata
export const generateMetadata = async (): Promise<Metadata> => {
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || "";
  
  return {
    title: "入驻申请表单 - Π立方企业服务",
    description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
    openGraph: {
      title: "入驻申请表单",
      description: "请填写您的企业入驻申请信息，我们将为您提供专业的企业服务。",
      type: "website",
      // 使用对象存储的公开URL
      images: [
        {
          url: OG_IMAGE_URL,
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
