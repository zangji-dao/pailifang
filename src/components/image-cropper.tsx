"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Check, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 默认身份证比例 1.58:1
}

type DragMode = "move" | "resize-tl" | "resize-tr" | "resize-bl" | "resize-br" | null;

export function ImageCropper({
  open,
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1.58,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // 矩形裁剪（原图坐标）
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 拖拽状态
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 加载图片并初始化裁剪区域
  useEffect(() => {
    if (open && imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        
        // 初始化裁剪区域：居中，保持比例，尽可能大
        const maxHeight = img.height * 0.9;
        const maxWidth = img.width * 0.9;
        
        let cropHeight, cropWidth;
        
        if (maxWidth / maxHeight > aspectRatio) {
          // 宽度有富余，以高度为准
          cropHeight = maxHeight;
          cropWidth = cropHeight * aspectRatio;
        } else {
          // 高度有富余，以宽度为准
          cropWidth = maxWidth;
          cropHeight = cropWidth / aspectRatio;
        }
        
        setCropRect({
          x: (img.width - cropWidth) / 2,
          y: (img.height - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight,
        });
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc, aspectRatio]);
  
  // 计算显示尺寸和偏移
  useEffect(() => {
    if (containerRef.current && imageSize.width > 0) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = 450;
      const scale = Math.min(containerWidth / imageSize.width, containerHeight / imageSize.height);
      const displayWidth = imageSize.width * scale;
      const displayHeight = imageSize.height * scale;
      setDisplaySize({ width: displayWidth, height: displayHeight });
      setOffset({
        x: (containerWidth - displayWidth) / 2,
        y: (containerHeight - displayHeight) / 2,
      });
    }
  }, [imageSize]);
  
  // 坐标转换：显示坐标 -> 原图坐标
  const displayToImage = useCallback((displayX: number, displayY: number) => {
    const scale = imageSize.width / displaySize.width;
    return {
      x: (displayX - offset.x) * scale,
      y: (displayY - offset.y) * scale,
    };
  }, [imageSize, displaySize, offset]);
  
  // 坐标转换：原图坐标 -> 显示坐标
  const imageToDisplay = useCallback((imageX: number, imageY: number) => {
    const scale = displaySize.width / imageSize.width;
    return {
      x: imageX * scale + offset.x,
      y: imageY * scale + offset.y,
    };
  }, [imageSize, displaySize, offset]);
  
  // 获取裁剪框的显示坐标
  const displayCrop = {
    x: imageToDisplay(cropRect.x, cropRect.y).x,
    y: imageToDisplay(cropRect.x, cropRect.y).y,
    width: cropRect.width * (displaySize.width / imageSize.width),
    height: cropRect.height * (displaySize.width / imageSize.width),
  };
  
  // 限制裁剪框在图片范围内
  const clampRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const minSize = 50; // 最小尺寸
    let { x, y, width, height } = rect;
    
    // 先限制尺寸
    width = Math.max(minSize, Math.min(width, imageSize.width));
    height = Math.max(minSize, Math.min(height, imageSize.height));
    
    // 再限制位置
    x = Math.max(0, Math.min(x, imageSize.width - width));
    y = Math.max(0, Math.min(y, imageSize.height - height));
    
    return { x, y, width, height };
  }, [imageSize]);
  
  // 拖拽开始
  const handleMouseDown = (mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialRect({ ...cropRect });
  };
  
  // 鼠标移动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragMode) return;
    
    const deltaX = (e.clientX - dragStart.x) * (imageSize.width / displaySize.width);
    const deltaY = (e.clientY - dragStart.y) * (imageSize.height / displaySize.height);
    
    if (dragMode === "move") {
      // 移动裁剪框
      setCropRect(clampRect({
        ...initialRect,
        x: initialRect.x + deltaX,
        y: initialRect.y + deltaY,
      }));
    } else {
      // 调整大小（保持比例）
      let newWidth = initialRect.width;
      let newHeight = initialRect.height;
      let newX = initialRect.x;
      let newY = initialRect.y;
      
      // 根据拖拽点计算新尺寸
      if (dragMode === "resize-tr") {
        // 右上角：向右扩大，向上收缩
        newWidth = initialRect.width + deltaX;
        newHeight = newWidth / aspectRatio;
        newY = initialRect.y + initialRect.height - newHeight;
      } else if (dragMode === "resize-br") {
        // 右下角：向右扩大，向下扩大
        newWidth = initialRect.width + deltaX;
        newHeight = newWidth / aspectRatio;
      } else if (dragMode === "resize-bl") {
        // 左下角：向左收缩，向下扩大
        newWidth = initialRect.width - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = initialRect.x + initialRect.width - newWidth;
      } else if (dragMode === "resize-tl") {
        // 左上角：向左收缩，向上收缩
        newWidth = initialRect.width - deltaX;
        newHeight = newWidth / aspectRatio;
        newX = initialRect.x + initialRect.width - newWidth;
        newY = initialRect.y + initialRect.height - newHeight;
      }
      
      // 确保最小尺寸
      if (newWidth >= 50 && newHeight >= 50 / aspectRatio) {
        setCropRect(clampRect({ x: newX, y: newY, width: newWidth, height: newHeight }));
      }
    }
  }, [dragMode, dragStart, initialRect, imageSize, displaySize, aspectRatio, clampRect]);
  
  const handleMouseUp = useCallback(() => {
    setDragMode(null);
  }, []);
  
  useEffect(() => {
    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);
  
  // 重置
  const handleReset = () => {
    const maxHeight = imageSize.height * 0.9;
    const maxWidth = imageSize.width * 0.9;
    
    let cropHeight, cropWidth;
    
    if (maxWidth / maxHeight > aspectRatio) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * aspectRatio;
    } else {
      cropWidth = maxWidth;
      cropHeight = cropWidth / aspectRatio;
    }
    
    setCropRect({
      x: (imageSize.width - cropWidth) / 2,
      y: (imageSize.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };
  
  // 执行裁剪
  const handleCrop = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;
    
    const img = imageRef.current;
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    
    ctx.drawImage(
      img,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>裁剪身份证图片</DialogTitle>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground">
          拖动裁剪框移动位置，拖动四角可调整大小（保持身份证比例 {aspectRatio}:1）
        </p>
        
        {/* 裁剪区域 */}
        <div
          ref={containerRef}
          className="relative bg-muted/50 rounded-lg overflow-hidden flex-1 min-h-[450px]"
        >
          {/* 隐藏的原图用于裁剪 */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="原图"
            className="hidden"
            crossOrigin="anonymous"
          />
          
          {/* 显示图片 */}
          <img
            src={imageSrc}
            alt="预览"
            className="absolute object-contain select-none"
            style={{
              left: offset.x,
              top: offset.y,
              width: displaySize.width,
              height: displaySize.height,
            }}
            crossOrigin="anonymous"
            draggable={false}
          />
          
          {displaySize.width > 0 && (
            <>
              {/* 蒙层 */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  left: offset.x,
                  top: offset.y,
                  width: displaySize.width,
                  height: displaySize.height,
                  clipPath: `polygon(
                    0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                    ${displayCrop.x - offset.x}px ${displayCrop.y - offset.y}px,
                    ${displayCrop.x - offset.x}px ${displayCrop.y - offset.y + displayCrop.height}px,
                    ${displayCrop.x - offset.x + displayCrop.width}px ${displayCrop.y - offset.y + displayCrop.height}px,
                    ${displayCrop.x - offset.x + displayCrop.width}px ${displayCrop.y - offset.y}px,
                    ${displayCrop.x - offset.x}px ${displayCrop.y - offset.y}px
                  )`,
                }}
              />
              
              {/* 裁剪框 */}
              <div
                className="absolute border-[3px] border-primary"
                style={{
                  left: displayCrop.x,
                  top: displayCrop.y,
                  width: displayCrop.width,
                  height: displayCrop.height,
                }}
              >
                {/* 九宫格参考线 */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/50" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/50" />
                  <div className="absolute left-0 right-0 top-1/3 h-px bg-white/50" />
                  <div className="absolute left-0 right-0 top-2/3 h-px bg-white/50" />
                </div>
                
                {/* 中间移动区域 */}
                <div
                  className="absolute inset-4 cursor-move"
                  onMouseDown={(e) => handleMouseDown("move", e)}
                />
              </div>
              
              {/* 四个角调整点 */}
              <div
                className="absolute w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg hover:scale-125 transition-transform cursor-nw-resize"
                style={{
                  left: displayCrop.x - 8,
                  top: displayCrop.y - 8,
                }}
                onMouseDown={(e) => handleMouseDown("resize-tl", e)}
              />
              <div
                className="absolute w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg hover:scale-125 transition-transform cursor-ne-resize"
                style={{
                  left: displayCrop.x + displayCrop.width - 8,
                  top: displayCrop.y - 8,
                }}
                onMouseDown={(e) => handleMouseDown("resize-tr", e)}
              />
              <div
                className="absolute w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg hover:scale-125 transition-transform cursor-sw-resize"
                style={{
                  left: displayCrop.x - 8,
                  top: displayCrop.y + displayCrop.height - 8,
                }}
                onMouseDown={(e) => handleMouseDown("resize-bl", e)}
              />
              <div
                className="absolute w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg hover:scale-125 transition-transform cursor-se-resize"
                style={{
                  left: displayCrop.x + displayCrop.width - 8,
                  top: displayCrop.y + displayCrop.height - 8,
                }}
                onMouseDown={(e) => handleMouseDown("resize-br", e)}
              />
            </>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleCrop}>
              <Check className="h-4 w-4 mr-2" />
              确认裁剪
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
