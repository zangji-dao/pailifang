// 内容类型
export type ContentType = "article" | "video" | "dynamic";

// 发布状态
export type PublishStatus = "success" | "reviewing" | "failed" | "scheduled";

// 平台能力配置
export interface PlatformCapabilities {
  video?: { support: boolean; limit?: string; format?: string };
  article?: { support: boolean; limit?: string; format?: string };
  dynamic?: { support: boolean; limit?: string };
  live?: { support: boolean };
}

// 平台配置
export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  capabilities: PlatformCapabilities;
  apiSupport: boolean;
  autoPublish: boolean;
  limitations?: string;
}

// 发布记录
export interface PublishRecord {
  id: string;
  title: string;
  type: ContentType;
  platforms: string[];
  status: PublishStatus;
  publishTime: string;
  views: number;
  likes: number;
  comments: number;
  error?: string;
}

// 状态配置
export interface StatusConfig {
  label: string;
  color: string;
}

// 发布表单数据
export interface PublishFormData {
  contentType: ContentType;
  selectedPlatforms: string[];
  title: string;
  content: string;
  coverImage: string | null;
  videoFile: string | null;
  tags: string[];
  scheduledPublish: boolean;
  publishDate: string;
  publishTime: string;
}
