import type { Platform, PublishRecord, StatusConfig, ContentType } from "./types";

// 平台配置
export const PLATFORMS: Platform[] = [
  {
    id: "douyin",
    name: "抖音",
    icon: "🎬",
    color: "#000000",
    capabilities: {
      video: { support: true, limit: "15秒-15分钟", format: "MP4/MOV" },
      article: { support: false },
      dynamic: { support: true, limit: "2200字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "kuaishou",
    name: "快手",
    icon: "⚡",
    color: "#FF4906",
    capabilities: {
      video: { support: true, limit: "10秒-10分钟", format: "MP4/MOV" },
      article: { support: false },
      dynamic: { support: true, limit: "2000字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "wechat-mp",
    name: "微信公众号",
    icon: "📰",
    color: "#07C160",
    capabilities: {
      video: { support: false },
      article: { support: true, limit: "20000字", format: "图文" },
      dynamic: { support: false },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
    limitations: "订阅号每天1次群发，服务号每月4次",
  },
  {
    id: "toutiao",
    name: "今日头条",
    icon: "📱",
    color: "#FF0000",
    capabilities: {
      video: { support: true, limit: "1秒-30分钟", format: "MP4" },
      article: { support: true, limit: "50000字" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "baijiahao",
    name: "百家号",
    icon: "🔍",
    color: "#306CFF",
    capabilities: {
      video: { support: true, limit: "1秒-60分钟", format: "MP4" },
      article: { support: true, limit: "50000字" },
      dynamic: { support: false },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "weibo",
    name: "微博",
    icon: "🐦",
    color: "#FF8200",
    capabilities: {
      video: { support: true, limit: "15分钟", format: "MP4" },
      article: { support: true, limit: "10000字", format: "长微博" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: true },
    },
    apiSupport: true,
    autoPublish: true,
  },
  {
    id: "bilibili",
    name: "B站",
    icon: "📺",
    color: "#00A1D6",
    capabilities: {
      video: { support: true, limit: "无限制", format: "MP4/FLV" },
      article: { support: true, limit: "50000字", format: "专栏" },
      dynamic: { support: true, limit: "2000字" },
      live: { support: false },
    },
    apiSupport: true,
    autoPublish: true,
    limitations: "需申请开放平台权限",
  },
  {
    id: "xiaohongshu",
    name: "小红书",
    icon: "📕",
    color: "#FE2C55",
    capabilities: {
      video: { support: true, limit: "15分钟", format: "MP4" },
      article: { support: true, limit: "1000字", format: "笔记" },
      dynamic: { support: false },
      live: { support: true },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "API不开放，需手动发布",
  },
  {
    id: "channels",
    name: "视频号",
    icon: "📹",
    color: "#07C160",
    capabilities: {
      video: { support: true, limit: "1小时", format: "MP4" },
      article: { support: false },
      dynamic: { support: false },
      live: { support: true },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "通过微信内部发布，API受限",
  },
  {
    id: "zhihu",
    name: "知乎",
    icon: "💙",
    color: "#0066FF",
    capabilities: {
      video: { support: true, limit: "无限制", format: "MP4" },
      article: { support: true, limit: "无限制", format: "文章/回答" },
      dynamic: { support: true, limit: "无限制" },
      live: { support: false },
    },
    apiSupport: false,
    autoPublish: false,
    limitations: "发布API权限受限",
  },
];

// 发布记录模拟数据
export const PUBLISH_HISTORY: PublishRecord[] = [
  {
    id: "1",
    title: "代理记账常见问题解答",
    type: "article",
    platforms: ["微信公众号", "今日头条", "百家号"],
    status: "success",
    publishTime: "2024-01-15 10:30",
    views: 1234,
    likes: 89,
    comments: 23,
  },
  {
    id: "2",
    title: "公司注册流程详解",
    type: "video",
    platforms: ["抖音", "快手"],
    status: "reviewing",
    publishTime: "2024-01-15 14:00",
    views: 0,
    likes: 0,
    comments: 0,
  },
  {
    id: "3",
    title: "财税知识小课堂",
    type: "dynamic",
    platforms: ["微博", "今日头条"],
    status: "failed",
    publishTime: "2024-01-14 16:45",
    views: 0,
    likes: 0,
    comments: 0,
    error: "内容审核未通过：包含敏感词",
  },
  {
    id: "4",
    title: "创业者必看！营业执照办理指南",
    type: "video",
    platforms: ["抖音", "快手", "B站"],
    status: "success",
    publishTime: "2024-01-14 09:00",
    views: 5678,
    likes: 234,
    comments: 56,
  },
  {
    id: "5",
    title: "小微企业税收优惠政策解读",
    type: "article",
    platforms: ["微信公众号", "知乎"],
    status: "scheduled",
    publishTime: "2024-01-16 09:00",
    views: 0,
    likes: 0,
    comments: 0,
  },
];

// 状态配置
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  success: { label: "发布成功", color: "bg-emerald-100 text-emerald-700" },
  reviewing: { label: "审核中", color: "bg-amber-100 text-amber-700" },
  failed: { label: "发布失败", color: "bg-red-100 text-red-700" },
  scheduled: { label: "待发布", color: "bg-blue-100 text-blue-700" },
};

// 内容类型配置
export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; icon: string }> = {
  article: { label: "图文", icon: "FileText" },
  video: { label: "视频", icon: "Video" },
  dynamic: { label: "动态", icon: "Sparkles" },
};

// 推荐标签
export const RECOMMENDED_TAGS = ["代理记账", "公司注册", "财税知识", "创业", "营业执照"];

// 字数限制
export const WORD_LIMITS: Record<ContentType, number> = {
  article: 20000,
  video: 500,
  dynamic: 2200,
};
