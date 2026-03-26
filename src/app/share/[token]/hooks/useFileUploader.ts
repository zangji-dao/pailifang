"use client";

import { useState, useCallback } from "react";

// 裁剪目标类型
interface CropperTarget {
  type: "front" | "back";
  personnelIndex: number;
}

interface ShareholderCropperTarget {
  fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy";
  shareholderIndex: number;
}

interface UploadResult {
  key: string;
  url: string;
}

export function useFileUploader() {
  // 文件上传状态
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [uploadingShareholderFiles, setUploadingShareholderFiles] =
    useState<Record<string, boolean>>({});

  // 人员文件裁剪状态
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string>("");
  const [cropperTarget, setCropperTarget] = useState<CropperTarget | null>(null);

  // 股东文件裁剪状态
  const [shareholderCropperOpen, setShareholderCropperOpen] = useState(false);
  const [shareholderCropperImageSrc, setShareholderCropperImageSrc] =
    useState<string>("");
  const [shareholderCropperTarget, setShareholderCropperTarget] =
    useState<ShareholderCropperTarget | null>(null);

  // 上传文件到存储
  const uploadFile = useCallback(
    async (blob: Blob, filename: string): Promise<UploadResult | null> => {
      try {
        const formData = new FormData();
        formData.append("file", blob, filename);

        const response = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          return { key: result.key, url: result.url };
        }
        return null;
      } catch (error) {
        console.error("上传文件失败:", error);
        return null;
      }
    },
    []
  );

  // 处理人员文件选择
  const handlePersonnelFileChange = useCallback(
    async (personnelIndex: number, type: "front" | "back", file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        setCropperImageSrc(reader.result as string);
        setCropperTarget({ type, personnelIndex });
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // 处理股东文件选择
  const handleShareholderFileChange = useCallback(
    async (
      shareholderIndex: number,
      fileType: "idCardFront" | "idCardBack" | "licenseOriginal" | "licenseCopy",
      file: File
    ) => {
      const reader = new FileReader();
      reader.onload = () => {
        setShareholderCropperImageSrc(reader.result as string);
        setShareholderCropperTarget({ fileType, shareholderIndex });
        setShareholderCropperOpen(true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  return {
    // 状态
    uploadingFiles,
    uploadingShareholderFiles,
    cropperOpen,
    cropperImageSrc,
    cropperTarget,
    shareholderCropperOpen,
    shareholderCropperImageSrc,
    shareholderCropperTarget,

    // 方法
    uploadFile,
    handlePersonnelFileChange,
    handleShareholderFileChange,
    setUploadingFiles,
    setUploadingShareholderFiles,
    setCropperOpen,
    setCropperTarget,
    setShareholderCropperOpen,
    setShareholderCropperTarget,
  };
}
