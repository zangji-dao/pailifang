"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import type { ContentType, PublishFormData } from "./types";

export function usePublishForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 表单状态
  const [formData, setFormData] = useState<PublishFormData>({
    contentType: "article",
    selectedPlatforms: [],
    title: "",
    content: "",
    coverImage: null,
    videoFile: null,
    tags: [],
    scheduledPublish: false,
    publishDate: "",
    publishTime: "",
  });

  const [tagInput, setTagInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 更新字段
  const updateField = useCallback(<K extends keyof PublishFormData>(field: K, value: PublishFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // 切换内容类型
  const setContentType = useCallback((type: ContentType) => {
    setFormData((prev) => ({ ...prev, contentType: type }));
  }, []);

  // 切换平台选择
  const togglePlatform = useCallback((platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platformId)
        ? prev.selectedPlatforms.filter((id) => id !== platformId)
        : [...prev.selectedPlatforms, platformId],
    }));
  }, []);

  // 添加标签
  const addTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  }, [tagInput, formData.tags]);

  // 移除标签
  const removeTag = useCallback((tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  // 添加推荐标签
  const addRecommendedTag = useCallback((tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  }, [formData.tags]);

  // 上传封面图
  const handleCoverUpload = useCallback((file: File) => {
    setFormData((prev) => ({ ...prev, coverImage: URL.createObjectURL(file) }));
  }, []);

  // 移除封面图
  const removeCoverImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, coverImage: null }));
  }, []);

  // 上传视频
  const handleVideoUpload = useCallback((file: File) => {
    setFormData((prev) => ({ ...prev, videoFile: URL.createObjectURL(file) }));
  }, []);

  // 移除视频
  const removeVideo = useCallback(() => {
    setFormData((prev) => ({ ...prev, videoFile: null }));
  }, []);

  // 获取字数统计
  const getWordCount = useCallback(() => {
    return formData.content.length;
  }, [formData.content]);

  // 发布内容
  const handlePublish = useCallback(async () => {
    if (!formData.title.trim()) {
      toast.error("请输入标题");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("请输入内容");
      return;
    }
    if (formData.selectedPlatforms.length === 0) {
      toast.error("请选择发布平台");
      return;
    }

    setIsPublishing(true);

    try {
      // 模拟发布过程
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("发布成功！内容已提交至各平台审核。");

      // 重置表单
      setFormData({
        contentType: "article",
        selectedPlatforms: [],
        title: "",
        content: "",
        coverImage: null,
        videoFile: null,
        tags: [],
        scheduledPublish: false,
        publishDate: "",
        publishTime: "",
      });
    } catch (error) {
      console.error("发布失败:", error);
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
    }
  }, [formData]);

  // 保存草稿
  const handleSaveDraft = useCallback(() => {
    toast.success("草稿已保存");
  }, []);

  return {
    // 表单数据
    formData,
    tagInput,
    isPublishing,
    showPreview,
    showHistory,

    // Refs
    fileInputRef,
    videoInputRef,

    // 更新方法
    updateField,
    setContentType,
    togglePlatform,
    setTagInput,
    addTag,
    removeTag,
    addRecommendedTag,
    handleCoverUpload,
    removeCoverImage,
    handleVideoUpload,
    removeVideo,
    getWordCount,

    // 对话框控制
    setShowPreview,
    setShowHistory,

    // 发布方法
    handlePublish,
    handleSaveDraft,
  };
}
