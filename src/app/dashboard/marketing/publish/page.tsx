"use client";

import { History, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublishForm } from "./usePublishForm";
import { ContentEditor } from "./_components/ContentEditor";
import { PlatformSelector } from "./_components/PlatformSelector";
import { PublishSettings } from "./_components/PublishSettings";
import { PreviewDialog } from "./_components/PreviewDialog";
import { HistoryDialog } from "./_components/HistoryDialog";

export default function ContentPublishPage() {
  const {
    formData,
    tagInput,
    isPublishing,
    showPreview,
    showHistory,
    fileInputRef,
    videoInputRef,
    setContentType,
    updateField,
    setTagInput,
    addTag,
    removeTag,
    addRecommendedTag,
    handleCoverUpload,
    removeCoverImage,
    handleVideoUpload,
    removeVideo,
    getWordCount,
    togglePlatform,
    setShowPreview,
    setShowHistory,
    handlePublish,
    handleSaveDraft,
  } = usePublishForm();

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">内容发布</h1>
          <p className="text-sm text-slate-500 mt-1">一键发布内容至多个平台</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" />
            发布记录
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4" />
            预览
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：内容编辑区 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <ContentEditor
            formData={formData}
            tagInput={tagInput}
            fileInputRef={fileInputRef}
            videoInputRef={videoInputRef}
            setContentType={setContentType}
            updateField={updateField}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            addRecommendedTag={addRecommendedTag}
            handleCoverUpload={handleCoverUpload}
            removeCoverImage={removeCoverImage}
            handleVideoUpload={handleVideoUpload}
            removeVideo={removeVideo}
            getWordCount={getWordCount}
          />
        </div>

        {/* 右侧：平台选择与发布设置 */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <PlatformSelector
            contentType={formData.contentType}
            selectedPlatforms={formData.selectedPlatforms}
            togglePlatform={togglePlatform}
          />
          <PublishSettings
            formData={formData}
            isPublishing={isPublishing}
            updateField={updateField}
            handlePublish={handlePublish}
            handleSaveDraft={handleSaveDraft}
          />
        </div>
      </div>

      {/* 预览对话框 */}
      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} formData={formData} />

      {/* 发布历史对话框 */}
      <HistoryDialog open={showHistory} onOpenChange={setShowHistory} />
    </div>
  );
}
