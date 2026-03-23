"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProofFile {
  name: string;
  url: string;
  size: number;
}

interface UploadProofStepProps {
  selectedRegNumber: {
    id: string;
    code: string;
    manualCode: string | null;
    assignedEnterpriseName: string | null;
  } | null;
  proofFiles: ProofFile[];
  onUpdateProofFiles: (files: ProofFile[]) => void;
}

export function UploadProofStep({
  selectedRegNumber,
  proofFiles,
  onUpdateProofFiles,
}: UploadProofStepProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "enterprise-proofs");

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success || result.url) {
        const url = result.data?.url || result.url;
        onUpdateProofFiles([...proofFiles, { name: file.name, url, size: file.size }]);
        toast({ title: "上传成功" });
      } else {
        throw new Error(result.error || result.message || "上传失败");
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      toast({ title: "上传失败", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    onUpdateProofFiles(proofFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传房屋产权证明</CardTitle>
        <CardDescription>请上传已盖章的房屋产权证明文件，支持多个文件</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 显示工位号信息 */}
        {selectedRegNumber && (
          <Alert className="border-rose-200 bg-rose-50">
            <Hash className="h-4 w-4 text-rose-600" />
            <AlertDescription className="text-rose-800">
              已选择工位号：<strong className="text-rose-900">{selectedRegNumber.manualCode || selectedRegNumber.code}</strong>
              {selectedRegNumber.assignedEnterpriseName && (
                <span className="ml-2">预分配企业：{selectedRegNumber.assignedEnterpriseName}</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 文件列表 */}
        {proofFiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">已上传文件 ({proofFiles.length})</Label>
            <div className="border rounded-lg divide-y">
              {proofFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-rose-100 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    删除
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 上传区域 */}
        <label
          className={`border-2 border-dashed border-rose-200 rounded-lg p-8 text-center cursor-pointer transition-colors block bg-rose-50/30
            ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-rose-400 hover:bg-rose-50"}`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={uploading}
          />
          <div className="space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 flex items-center justify-center">
              <Upload className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium">点击上传文件</p>
              <p className="text-xs text-muted-foreground mt-1">或将文件拖放到此处</p>
            </div>
            <p className="text-xs text-muted-foreground">支持图片或PDF，单文件不超过10MB</p>
          </div>
        </label>

        {uploading && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">上传中...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
