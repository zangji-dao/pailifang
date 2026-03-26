"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, Check, Move } from "lucide-react";
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
  
  // 旋转角度（0, 90, 180, 270）
  const [rotation, setRotation] = useState(0);
  
  // 矩形裁剪（原图坐标）
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 拖拽状态
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialRect, setInitialRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 获取旋转后的图片尺寸（使用 useMemo 缓存）
  const rotatedImageSize = useMemo(() => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      return { width: 0, height: 0 };
    }
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    return {
      width: imageSize.width * cos + imageSize.height * sin,
      height: imageSize.width * sin + imageSize.height * cos,
    };
  }, [imageSize.width, imageSize.height, rotation]);
  
  // 计算裁剪区域（根据尺寸和比例）
  const calculateCropRect = useCallback((width: number, height: number) => {
    const maxHeight = height * 0.9;
    const maxWidth = width * 0.9;
    
    let cropHeight, cropWidth;
    
    if (maxWidth / maxHeight > aspectRatio) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * aspectRatio;
    } else {
      cropWidth = maxWidth;
      cropHeight = cropWidth / aspectRatio;
    }
    
    return {
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
  }, [aspectRatio]);
  
  // 加载图片并初始化
  useEffect(() => {
    if (open && imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        const size = { width: img.width, height: img.height };
        setImageSize(size);
        setRotation(0);
        setCropRect(calculateCropRect(size.width, size.height));
      };
      img.src = imageSrc;
    }
  }, [open, imageSrc, calculateCropRect]);
  
  // 计算显示尺寸和偏移
  useEffect(() => {
    if (containerRef.current && rotatedImageSize.width > 0) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = 450;
      const scale = Math.min(containerWidth / rotatedImageSize.width, containerHeight / rotatedImageSize.height);
      const displayWidth = rotatedImageSize.width * scale;
      const displayHeight = rotatedImageSize.height * scale;
      setDisplaySize({ width: displayWidth, height: displayHeight });
      setOffset({
        x: (containerWidth - displayWidth) / 2,
        y: (containerHeight - displayHeight) / 2,
      });
    }
  }, [rotatedImageSize.width, rotatedImageSize.height]);
  
  // 当旋转改变时，重新计算裁剪区域
  useEffect(() => {
    if (rotatedImageSize.width > 0 && rotation !== 0) {
      setCropRect(calculateCropRect(rotatedImageSize.width, rotatedImageSize.height));
    }
  }, [rotation, rotatedImageSize.width, rotatedImageSize.height, calculateCropRect]);
  
  // 坐标转换：显示坐标 -> 旋转后的原图坐标
  const displayToImage = useCallback((displayX: number, displayY: number) => {
    const scale = rotatedImageSize.width / displaySize.width;
    return {
      x: (displayX - offset.x) * scale,
      y: (displayY - offset.y) * scale,
    };
  }, [rotatedImageSize, displaySize, offset]);
  
  // 坐标转换：旋转后的原图坐标 -> 显示坐标
  const imageToDisplay = useCallback((imageX: number, imageY: number) => {
    const scale = displaySize.width / rotatedImageSize.width;
    return {
      x: imageX * scale + offset.x,
      y: imageY * scale + offset.y,
    };
  }, [rotatedImageSize, displaySize, offset]);
  
  // 获取裁剪框的显示坐标
  const displayCrop = {
    x: imageToDisplay(cropRect.x, cropRect.y).x,
    y: imageToDisplay(cropRect.x, cropRect.y).y,
    width: cropRect.width * (displaySize.width / rotatedImageSize.width),
    height: cropRect.height * (displaySize.width / rotatedImageSize.width),
  };
  
  // 限制裁剪框在图片范围内
  const clampRect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    const minSize = 50; // 最小尺寸
    let { x, y, width, height } = rect;
    
    // 先限制尺寸
    width = Math.max(minSize, Math.min(width, rotatedImageSize.width));
    height = Math.max(minSize, Math.min(height, rotatedImageSize.height));
    
    // 再限制位置
    x = Math.max(0, Math.min(x, rotatedImageSize.width - width));
    y = Math.max(0, Math.min(y, rotatedImageSize.height - height));
    
    return { x, y, width, height };
  }, [rotatedImageSize]);
  
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
    
    const deltaX = (e.clientX - dragStart.x) * (rotatedImageSize.width / displaySize.width);
    const deltaY = (e.clientY - dragStart.y) * (rotatedImageSize.height / displaySize.height);
    
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
  }, [dragMode, dragStart, initialRect, rotatedImageSize, displaySize, aspectRatio, clampRect]);
  
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
  
  // 旋转操作
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };
  
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  // 重置
  const handleReset = () => {
    setRotation(0);
    setCropRect(calculateCropRect(imageSize.width, imageSize.height));
  };
  
  // 执行裁剪（带旋转）
  const handleCrop = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;
    
    const img = imageRef.current;
    
    // 设置画布尺寸为裁剪区域大小
    canvas.width = cropRect.width;
    canvas.height = cropRect.height;
    
    // 计算旋转后的裁剪坐标（转换回原始图片坐标）
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // 原始图片中心点
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;
    
    // 旋转后的图片尺寸
    const rotatedWidth = rotatedImageSize.width;
    const rotatedHeight = rotatedImageSize.height;
    
    // 裁剪区域在旋转后图片中的位置，转换回原始图片坐标
    // 旋转后图片的中心偏移
    const rotatedCenterX = rotatedWidth / 2;
    const rotatedCenterY = rotatedHeight / 2;
    
    // 裁剪区域中心在旋转后坐标系中的位置
    const cropCenterX = cropRect.x + cropRect.width / 2;
    const cropCenterY = cropRect.y + cropRect.height / 2;
    
    // 相对于旋转后图片中心的偏移
    const offsetX = cropCenterX - rotatedCenterX;
    const offsetY = cropCenterY - rotatedCenterY;
    
    // 逆向旋转，得到原始图片中的偏移
    const originalOffsetX = offsetX * cos + offsetY * sin;
    const originalOffsetY = -offsetX * sin + offsetY * cos;
    
    // 原始图片中的裁剪中心
    const originalCropCenterX = centerX + originalOffsetX;
    const originalCropCenterY = centerY + originalOffsetY;
    
    // 保存当前状态
    ctx.save();
    
    // 移动到画布中心
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // 旋转
    ctx.rotate(-rad);
    
    // 计算绘制位置
    const drawX = -originalCropCenterX;
    const drawY = -originalCropCenterY;
    
    // 绘制图片
    ctx.drawImage(
      img,
      drawX,
      drawY,
      imageSize.width,
      imageSize.height
    );
    
    // 恢复状态
    ctx.restore();
    
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
          
          {/* 显示图片（带旋转） */}
          <img
            src={imageSrc}
            alt="预览"
            className="absolute object-contain select-none"
            style={{
              left: offset.x,
              top: offset.y,
              width: displaySize.width,
              height: displaySize.height,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center center',
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRotateLeft} title="向左旋转90°">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotateRight} title="向右旋转90°">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Move className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
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
