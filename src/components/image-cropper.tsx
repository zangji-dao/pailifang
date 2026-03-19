"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Check, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

interface ImageCropperProps {
  open: boolean;
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // 默认身份证比例 1.58:1
}

// 计算透视变换矩阵
function computePerspectiveTransform(srcPoints: Point[], dstWidth: number, dstHeight: number): number[] {
  const [p0, p1, p2, p3] = srcPoints; // 左上、右上、右下、左下
  
  // 目标点：矩形四个角
  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: dstWidth, y: 0 },
    { x: dstWidth, y: dstHeight },
    { x: 0, y: dstHeight },
  ];
  
  // 计算8个方程的系数矩阵
  const src = [p0, p1, p2, p3];
  const dst = dstPoints;
  
  const a = [];
  const b = [];
  
  for (let i = 0; i < 4; i++) {
    a.push([src[i].x, src[i].y, 1, 0, 0, 0, -dst[i].x * src[i].x, -dst[i].x * src[i].y]);
    a.push([0, 0, 0, src[i].x, src[i].y, 1, -dst[i].y * src[i].x, -dst[i].y * src[i].y]);
    b.push(dst[i].x);
    b.push(dst[i].y);
  }
  
  // 高斯消元法求解
  const n = 8;
  for (let i = 0; i < n; i++) {
    // 找主元
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    
    // 消元
    for (let k = i + 1; k < n; k++) {
      const factor = a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        a[k][j] -= factor * a[i][j];
      }
      b[k] -= factor * b[i];
    }
  }
  
  // 回代
  const h = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    h[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      h[i] -= a[i][j] * h[j];
    }
    h[i] /= a[i][i];
  }
  
  return [...h, 1]; // 9个元素，h8=1
}

// 应用透视变换
function applyPerspectiveTransform(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  transform: number[],
  dstWidth: number,
  dstHeight: number
) {
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = image.width;
  srcCanvas.height = image.height;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(image, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, image.width, image.height);
  
  const dstImageData = ctx.createImageData(dstWidth, dstHeight);
  const dstData = dstImageData.data;
  
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = transform;
  
  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      // 逆变换：从目标坐标求源坐标
      const w = h6 * x + h7 * y + h8;
      const srcX = (h0 * x + h1 * y + h2) / w;
      const srcY = (h3 * x + h4 * y + h5) / w;
      
      // 双线性插值
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, image.width - 1);
      const y1 = Math.min(y0 + 1, image.height - 1);
      
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;
      
      const dstIdx = (y * dstWidth + x) * 4;
      
      // 边界检查
      if (x0 >= 0 && x0 < image.width && y0 >= 0 && y0 < image.height) {
        const getPixel = (px: number, py: number) => {
          const idx = (py * image.width + px) * 4;
          return [
            srcData.data[idx],
            srcData.data[idx + 1],
            srcData.data[idx + 2],
            srcData.data[idx + 3],
          ];
        };
        
        const c00 = getPixel(x0, y0);
        const c10 = getPixel(x1, y0);
        const c01 = getPixel(x0, y1);
        const c11 = getPixel(x1, y1);
        
        for (let c = 0; c < 4; c++) {
          const val =
            c00[c] * (1 - xFrac) * (1 - yFrac) +
            c10[c] * xFrac * (1 - yFrac) +
            c01[c] * (1 - xFrac) * yFrac +
            c11[c] * xFrac * yFrac;
          dstData[dstIdx + c] = Math.round(val);
        }
      } else {
        // 超出边界设为透明
        dstData[dstIdx + 3] = 0;
      }
    }
  }
  
  ctx.putImageData(dstImageData, 0, 0);
}

export function ImageCropper({
  open,
  imageSrc,
  onCrop,
  onCancel,
  aspectRatio = 1.58,
}: ImageCropperProps) {
  const [mode, setMode] = useState<"perspective" | "rect">("perspective");
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  // 透视裁剪的四个角点（相对于原图的坐标）
  const [perspectivePoints, setPerspectivePoints] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ]);
  
  // 矩形裁剪
  const [rectCrop, setRectCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // 拖拽状态
  const [draggingPoint, setDraggingPoint] = useState<number | null>(null);
  const [isDraggingRect, setIsDraggingRect] = useState(false);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  
  // 加载图片并初始化裁剪区域
  useEffect(() => {
    if (open && imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        // 初始化透视裁剪区域为图片中心区域
        const padding = Math.min(img.width, img.height) * 0.1;
        setPerspectivePoints([
          { x: padding, y: padding },
          { x: img.width - padding, y: padding },
          { x: img.width - padding, y: img.height - padding },
          { x: padding, y: img.height - padding },
        ]);
        // 初始化矩形裁剪区域
        const cropHeight = Math.min(img.height, img.width / aspectRatio);
        const cropWidth = cropHeight * aspectRatio;
        setRectCrop({
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
      const containerHeight = 400;
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
  const displayToImage = useCallback((displayX: number, displayY: number): Point => {
    const scale = imageSize.width / displaySize.width;
    return {
      x: (displayX - offset.x) * scale,
      y: (displayY - offset.y) * scale,
    };
  }, [imageSize, displaySize, offset]);
  
  // 坐标转换：原图坐标 -> 显示坐标
  const imageToDisplay = useCallback((imageX: number, imageY: number): Point => {
    const scale = displaySize.width / imageSize.width;
    return {
      x: imageX * scale + offset.x,
      y: imageY * scale + offset.y,
    };
  }, [imageSize, displaySize, offset]);
  
  // 处理角点拖拽
  const handlePointMouseDown = (pointIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingPoint(pointIndex);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingPoint !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const displayX = e.clientX - rect.left;
      const displayY = e.clientY - rect.top;
      const imagePoint = displayToImage(displayX, displayY);
      
      // 限制在图片范围内
      const clampedPoint = {
        x: Math.max(0, Math.min(imageSize.width, imagePoint.x)),
        y: Math.max(0, Math.min(imageSize.height, imagePoint.y)),
      };
      
      setPerspectivePoints(prev => {
        const newPoints = [...prev];
        newPoints[draggingPoint] = clampedPoint;
        return newPoints;
      });
    } else if (mode === "rect" && isDraggingRect && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const displayX = e.clientX - rect.left;
      const displayY = e.clientY - rect.top;
      const imagePoint = displayToImage(displayX, displayY);
      
      // 根据拖拽位置调整裁剪框
      const centerX = rectCrop.x + rectCrop.width / 2;
      const centerY = rectCrop.y + rectCrop.height / 2;
      const newCenterX = (centerX + imagePoint.x) / 2;
      const newCenterY = (centerY + imagePoint.y) / 2;
      
      setRectCrop(prev => ({
        x: Math.max(0, Math.min(imageSize.width - prev.width, newCenterX - prev.width / 2)),
        y: Math.max(0, Math.min(imageSize.height - prev.height, newCenterY - prev.height / 2)),
        width: prev.width,
        height: prev.height,
      }));
    }
  }, [draggingPoint, isDraggingRect, displayToImage, imageSize, mode, rectCrop]);
  
  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null);
    setIsDraggingRect(false);
    setDragStart(null);
  }, []);
  
  useEffect(() => {
    if (draggingPoint !== null || isDraggingRect) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingPoint, isDraggingRect, handleMouseMove, handleMouseUp]);
  
  // 重置裁剪区域
  const handleReset = () => {
    const padding = Math.min(imageSize.width, imageSize.height) * 0.1;
    setPerspectivePoints([
      { x: padding, y: padding },
      { x: imageSize.width - padding, y: padding },
      { x: imageSize.width - padding, y: imageSize.height - padding },
      { x: padding, y: imageSize.height - padding },
    ]);
    const cropHeight = Math.min(imageSize.height, imageSize.width / aspectRatio);
    const cropWidth = cropHeight * aspectRatio;
    setRectCrop({
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
    
    if (mode === "perspective") {
      // 透视裁剪
      const dstWidth = 800; // 输出宽度
      const dstHeight = Math.round(dstWidth / aspectRatio);
      canvas.width = dstWidth;
      canvas.height = dstHeight;
      
      const transform = computePerspectiveTransform(perspectivePoints, dstWidth, dstHeight);
      applyPerspectiveTransform(ctx, img, transform, dstWidth, dstHeight);
    } else {
      // 矩形裁剪
      canvas.width = rectCrop.width;
      canvas.height = rectCrop.height;
      ctx.drawImage(
        img,
        rectCrop.x,
        rectCrop.y,
        rectCrop.width,
        rectCrop.height,
        0,
        0,
        rectCrop.width,
        rectCrop.height
      );
    }
    
    // 转换为 Blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };
  
  // 获取显示坐标
  const displayPoints = perspectivePoints.map(p => imageToDisplay(p.x, p.y));
  const displayRectCrop = {
    x: imageToDisplay(rectCrop.x, rectCrop.y).x,
    y: imageToDisplay(rectCrop.x, rectCrop.y).y,
    width: rectCrop.width * (displaySize.width / imageSize.width),
    height: rectCrop.height * (displaySize.width / imageSize.width),
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>裁剪身份证图片</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "perspective" | "rect")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perspective" className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              透视裁剪
            </TabsTrigger>
            <TabsTrigger value="rect" className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              矩形裁剪
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="perspective" className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              拖动四个角点对齐身份证边角，系统将自动矫正透视变形
            </p>
          </TabsContent>
          
          <TabsContent value="rect" className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              拖动裁剪框选择区域
            </p>
          </TabsContent>
        </Tabs>
        
        {/* 裁剪区域 */}
        <div
          ref={containerRef}
          className="relative bg-muted rounded-lg overflow-hidden"
          style={{ height: 400 }}
        >
          {/* 原图（隐藏，用于裁剪） */}
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
            className="absolute object-contain"
            style={{
              left: offset.x,
              top: offset.y,
              width: displaySize.width,
              height: displaySize.height,
            }}
            crossOrigin="anonymous"
          />
          
          {/* 透视裁剪蒙层和角点 */}
          {mode === "perspective" && displaySize.width > 0 && (
            <>
              {/* SVG 蒙层和裁剪区域 */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width="100%"
                height="100%"
              >
                {/* 蒙层 */}
                <defs>
                  <mask id="cropMask">
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <polygon
                      points={displayPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.5)"
                  mask="url(#cropMask)"
                />
                
                {/* 裁剪区域边框 */}
                <polygon
                  points={displayPoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                
                {/* 网格线 */}
                {perspectivePoints.length === 4 && (
                  <>
                    <line
                      x1={displayPoints[0].x}
                      y1={displayPoints[0].y}
                      x2={displayPoints[2].x}
                      y2={displayPoints[2].y}
                      stroke="hsl(var(--primary) / 0.3)"
                      strokeWidth="1"
                    />
                    <line
                      x1={displayPoints[1].x}
                      y1={displayPoints[1].y}
                      x2={displayPoints[3].x}
                      y2={displayPoints[3].y}
                      stroke="hsl(var(--primary) / 0.3)"
                      strokeWidth="1"
                    />
                  </>
                )}
              </svg>
              
              {/* 四个角点 */}
              {displayPoints.map((point, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-primary bg-background cursor-move shadow-lg",
                    "hover:scale-125 transition-transform",
                    "flex items-center justify-center text-xs font-medium text-primary"
                  )}
                  style={{ left: point.x, top: point.y }}
                  onMouseDown={(e) => handlePointMouseDown(index, e)}
                >
                  {index + 1}
                </div>
              ))}
            </>
          )}
          
          {/* 矩形裁剪框 */}
          {mode === "rect" && displaySize.width > 0 && (
            <>
              {/* 蒙层 */}
              <div
                className="absolute bg-black/50"
                style={{
                  left: offset.x,
                  top: offset.y,
                  width: displaySize.width,
                  height: displaySize.height,
                  clipPath: `polygon(
                    0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                    ${displayRectCrop.x - offset.x}px ${displayRectCrop.y - offset.y}px,
                    ${displayRectCrop.x - offset.x}px ${displayRectCrop.y - offset.y + displayRectCrop.height}px,
                    ${displayRectCrop.x - offset.x + displayRectCrop.width}px ${displayRectCrop.y - offset.y + displayRectCrop.height}px,
                    ${displayRectCrop.x - offset.x + displayRectCrop.width}px ${displayRectCrop.y - offset.y}px,
                    ${displayRectCrop.x - offset.x}px ${displayRectCrop.y - offset.y}px
                  )`,
                }}
              />
              
              {/* 裁剪框 */}
              <div
                className="absolute border-2 border-primary border-dashed cursor-move"
                style={{
                  left: displayRectCrop.x,
                  top: displayRectCrop.y,
                  width: displayRectCrop.width,
                  height: displayRectCrop.height,
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingRect(true);
                  setDragStart({ x: e.clientX, y: e.clientY });
                }}
              >
                {/* 九宫格参考线 */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "border-primary/30",
                        i % 3 === 1 ? "border-l border-r" : "",
                        Math.floor(i / 3) === 1 ? "border-t border-b" : ""
                      )}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between">
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
