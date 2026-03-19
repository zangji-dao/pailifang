"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, Check, Move, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
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
  
  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: dstWidth, y: 0 },
    { x: dstWidth, y: dstHeight },
    { x: 0, y: dstHeight },
  ];
  
  const src = [p0, p1, p2, p3];
  const dst = dstPoints;
  
  const a: number[][] = [];
  const b: number[] = [];
  
  for (let i = 0; i < 4; i++) {
    a.push([src[i].x, src[i].y, 1, 0, 0, 0, -dst[i].x * src[i].x, -dst[i].x * src[i].y]);
    a.push([0, 0, 0, src[i].x, src[i].y, 1, -dst[i].y * src[i].x, -dst[i].y * src[i].y]);
    b.push(dst[i].x);
    b.push(dst[i].y);
  }
  
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    
    for (let k = i + 1; k < n; k++) {
      const factor = a[k][i] / a[i][i];
      for (let j = i; j < n; j++) {
        a[k][j] -= factor * a[i][j];
      }
      b[k] -= factor * b[i];
    }
  }
  
  const h = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    h[i] = b[i];
    for (let j = i + 1; j < n; j++) {
      h[i] -= a[i][j] * h[j];
    }
    h[i] /= a[i][i];
  }
  
  return [...h, 1];
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
      const w = h6 * x + h7 * y + h8;
      const srcX = (h0 * x + h1 * y + h2) / w;
      const srcY = (h3 * x + h4 * y + h5) / w;
      
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, image.width - 1);
      const y1 = Math.min(y0 + 1, image.height - 1);
      
      const xFrac = srcX - x0;
      const yFrac = srcY - y0;
      
      const dstIdx = (y * dstWidth + x) * 4;
      
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
  
  // 透视裁剪的四个角点（左上、右上、右下、左下）
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
  const [draggingEdge, setDraggingEdge] = useState<number | null>(null);
  const [isDraggingRect, setIsDraggingRect] = useState(false);
  const [rectDragStart, setRectDragStart] = useState<Point | null>(null);
  const [rectDragOffset, setRectDragOffset] = useState({ x: 0, y: 0 });
  
  // 加载图片并初始化裁剪区域
  useEffect(() => {
    if (open && imageSrc) {
      const img = new window.Image();
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height });
        // 初始化透视裁剪区域为图片中心区域（预留给身份证留白）
        const paddingX = img.width * 0.05;
        const paddingY = img.height * 0.05;
        setPerspectivePoints([
          { x: paddingX, y: paddingY },
          { x: img.width - paddingX, y: paddingY },
          { x: img.width - paddingX, y: img.height - paddingY },
          { x: paddingX, y: img.height - paddingY },
        ]);
        // 初始化矩形裁剪区域
        const cropHeight = Math.min(img.height * 0.9, (img.width * 0.9) / aspectRatio);
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
  
  // 坐标转换
  const displayToImage = useCallback((displayX: number, displayY: number): Point => {
    const scale = imageSize.width / displaySize.width;
    return {
      x: (displayX - offset.x) * scale,
      y: (displayY - offset.y) * scale,
    };
  }, [imageSize, displaySize, offset]);
  
  const imageToDisplay = useCallback((imageX: number, imageY: number): Point => {
    const scale = displaySize.width / imageSize.width;
    return {
      x: imageX * scale + offset.x,
      y: imageY * scale + offset.y,
    };
  }, [imageSize, displaySize, offset]);
  
  // 处理角点拖拽开始
  const handlePointMouseDown = (pointIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingPoint(pointIndex);
  };
  
  // 处理边拖拽开始
  const handleEdgeMouseDown = (edgeIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingEdge(edgeIndex);
  };
  
  // 处理矩形裁剪框拖拽
  const handleRectMouseDown = (e: React.MouseEvent) => {
    if (mode !== "rect") return;
    e.preventDefault();
    setIsDraggingRect(true);
    setRectDragStart({ x: e.clientX, y: e.clientY });
    setRectDragOffset({ x: rectCrop.x, y: rectCrop.y });
  };
  
  // 鼠标移动处理
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;
    const imagePoint = displayToImage(displayX, displayY);
    
    // 限制在图片范围内
    const clampPoint = (p: Point) => ({
      x: Math.max(0, Math.min(imageSize.width, p.x)),
      y: Math.max(0, Math.min(imageSize.height, p.y)),
    });
    
    if (draggingPoint !== null) {
      setPerspectivePoints(prev => {
        const newPoints = [...prev];
        newPoints[draggingPoint] = clampPoint(imagePoint);
        return newPoints;
      });
    } else if (draggingEdge !== null) {
      // 边拖拽：移动边的两个端点
      setPerspectivePoints(prev => {
        const newPoints = [...prev];
        const edgeToPoint: Record<number, number[]> = {
          0: [0, 1], // 上边 -> 左上、右上
          1: [1, 2], // 右边 -> 右上、右下
          2: [2, 3], // 下边 -> 右下、左下
          3: [3, 0], // 左边 -> 左下、左上
        };
        const pointIndices = edgeToPoint[draggingEdge];
        pointIndices.forEach(idx => {
          const oldPoint = prev[idx];
          // 计算移动方向
          if (draggingEdge === 0 || draggingEdge === 2) {
            // 上下边，移动Y
            newPoints[idx] = clampPoint({ x: oldPoint.x, y: imagePoint.y });
          } else {
            // 左右边，移动X
            newPoints[idx] = clampPoint({ x: imagePoint.x, y: oldPoint.y });
          }
        });
        return newPoints;
      });
    } else if (isDraggingRect && rectDragStart) {
      const deltaX = (e.clientX - rectDragStart.x) * (imageSize.width / displaySize.width);
      const deltaY = (e.clientY - rectDragStart.y) * (imageSize.height / displaySize.height);
      const newX = Math.max(0, Math.min(imageSize.width - rectCrop.width, rectDragOffset.x + deltaX));
      const newY = Math.max(0, Math.min(imageSize.height - rectCrop.height, rectDragOffset.y + deltaY));
      setRectCrop(prev => ({ ...prev, x: newX, y: newY }));
    }
  }, [draggingPoint, draggingEdge, isDraggingRect, rectDragStart, rectDragOffset, displayToImage, imageSize, displaySize, rectCrop, mode]);
  
  const handleMouseUp = useCallback(() => {
    setDraggingPoint(null);
    setDraggingEdge(null);
    setIsDraggingRect(false);
    setRectDragStart(null);
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  // 重置
  const handleReset = () => {
    const paddingX = imageSize.width * 0.05;
    const paddingY = imageSize.height * 0.05;
    setPerspectivePoints([
      { x: paddingX, y: paddingY },
      { x: imageSize.width - paddingX, y: paddingY },
      { x: imageSize.width - paddingX, y: imageSize.height - paddingY },
      { x: paddingX, y: imageSize.height - paddingY },
    ]);
    const cropHeight = Math.min(imageSize.height * 0.9, (imageSize.width * 0.9) / aspectRatio);
    const cropWidth = cropHeight * aspectRatio;
    setRectCrop({
      x: (imageSize.width - cropWidth) / 2,
      y: (imageSize.height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  };
  
  // 自动检测边缘（简化版：自动贴边）
  const handleAutoDetect = () => {
    // 简单实现：自动扩大到图片边缘附近
    const margin = Math.min(imageSize.width, imageSize.height) * 0.02;
    setPerspectivePoints([
      { x: margin, y: margin },
      { x: imageSize.width - margin, y: margin },
      { x: imageSize.width - margin, y: imageSize.height - margin },
      { x: margin, y: imageSize.height - margin },
    ]);
  };
  
  // 执行裁剪
  const handleCrop = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return;
    
    const img = imageRef.current;
    
    if (mode === "perspective") {
      const dstWidth = 800;
      const dstHeight = Math.round(dstWidth / aspectRatio);
      canvas.width = dstWidth;
      canvas.height = dstHeight;
      
      const transform = computePerspectiveTransform(perspectivePoints, dstWidth, dstHeight);
      applyPerspectiveTransform(ctx, img, transform, dstWidth, dstHeight);
    } else {
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
    
    canvas.toBlob((blob) => {
      if (blob) {
        onCrop(blob);
      }
    }, 'image/jpeg', 0.9);
  };
  
  // 获取显示坐标
  const displayPoints = perspectivePoints.map(p => imageToDisplay(p.x, p.y));
  
  // 边的中点坐标
  const edgeMidPoints = [
    // 上边中点
    { x: (displayPoints[0].x + displayPoints[1].x) / 2, y: (displayPoints[0].y + displayPoints[1].y) / 2 },
    // 右边中点
    { x: (displayPoints[1].x + displayPoints[2].x) / 2, y: (displayPoints[1].y + displayPoints[2].y) / 2 },
    // 下边中点
    { x: (displayPoints[2].x + displayPoints[3].x) / 2, y: (displayPoints[2].y + displayPoints[3].y) / 2 },
    // 左边中点
    { x: (displayPoints[3].x + displayPoints[0].x) / 2, y: (displayPoints[3].y + displayPoints[0].y) / 2 },
  ];
  
  const displayRectCrop = {
    x: imageToDisplay(rectCrop.x, rectCrop.y).x,
    y: imageToDisplay(rectCrop.x, rectCrop.y).y,
    width: rectCrop.width * (displaySize.width / imageSize.width),
    height: rectCrop.height * (displaySize.width / imageSize.width),
  };
  
  const cornerLabels = ["左上", "右上", "右下", "左下"];
  const edgeLabels = ["上边", "右边", "下边", "左边"];
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>裁剪身份证图片</DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "perspective" | "rect")} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perspective" className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4" />
              透视裁剪（推荐）
            </TabsTrigger>
            <TabsTrigger value="rect" className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              矩形裁剪
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-2 text-sm text-muted-foreground">
            {mode === "perspective" ? (
              <p>
                <strong>使用方法：</strong>
                拖动四个角点对齐身份证的四角，拖动边的中点可调整整条边。
                系统会自动矫正透视变形，生成正面视图。
              </p>
            ) : (
              <p>
                <strong>使用方法：</strong>
                拖动裁剪框选择区域，保持固定身份证比例（{aspectRatio}:1）。
              </p>
            )}
          </div>
          
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
            
            {/* 透视裁剪 UI */}
            {mode === "perspective" && displaySize.width > 0 && (
              <>
                {/* SVG 蒙层和边框 */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width="100%"
                  height="100%"
                >
                  <defs>
                    <mask id="cropMask">
                      <rect x="0" y="0" width="100%" height="100%" fill="white" />
                      <polygon
                        points={displayPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  {/* 半透明蒙层 */}
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.6)"
                    mask="url(#cropMask)"
                  />
                  
                  {/* 裁剪区域边框 - 粗线 */}
                  <polygon
                    points={displayPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    className="drop-shadow-md"
                  />
                  
                  {/* 对角线辅助线 */}
                  <line
                    x1={displayPoints[0].x}
                    y1={displayPoints[0].y}
                    x2={displayPoints[2].x}
                    y2={displayPoints[2].y}
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeWidth="1"
                    strokeDasharray="8,4"
                  />
                  <line
                    x1={displayPoints[1].x}
                    y1={displayPoints[1].y}
                    x2={displayPoints[3].x}
                    y2={displayPoints[3].y}
                    stroke="hsl(var(--primary) / 0.3)"
                    strokeWidth="1"
                    strokeDasharray="8,4"
                  />
                </svg>
                
                {/* 四条边 - 可拖拽区域 */}
                {displayPoints.map((_, i) => {
                  const next = (i + 1) % 4;
                  const midPoint = edgeMidPoints[i];
                  return (
                    <div
                      key={`edge-${i}`}
                      className="absolute cursor-move group"
                      style={{
                        left: midPoint.x - 20,
                        top: midPoint.y - 20,
                        width: 40,
                        height: 40,
                      }}
                      onMouseDown={(e) => handleEdgeMouseDown(i, e)}
                    >
                      {/* 边的中点指示器 */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-lg opacity-70 group-hover:opacity-100 group-hover:scale-125 transition-all" />
                      {/* Hover 提示 */}
                      <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        拖拽调整{edgeLabels[i]}
                      </div>
                    </div>
                  );
                })}
                
                {/* 四个角点 */}
                {displayPoints.map((point, index) => (
                  <div
                    key={`point-${index}`}
                    className={cn(
                      "absolute cursor-move group",
                      "transition-transform duration-100"
                    )}
                    style={{
                      left: point.x - 24,
                      top: point.y - 24,
                      width: 48,
                      height: 48,
                    }}
                    onMouseDown={(e) => handlePointMouseDown(index, e)}
                  >
                    {/* 角点圆圈 */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary shadow-lg group-hover:scale-110 transition-transform">
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    {/* 角点标签 */}
                    <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {cornerLabels[index]}
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* 矩形裁剪 UI */}
            {mode === "rect" && displaySize.width > 0 && (
              <>
                {/* 蒙层 - 使用 clip-path */}
                <div
                  className="absolute bg-black/60 pointer-events-none"
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
                  className="absolute border-[3px] border-primary cursor-move shadow-xl"
                  style={{
                    left: displayRectCrop.x,
                    top: displayRectCrop.y,
                    width: displayRectCrop.width,
                    height: displayRectCrop.height,
                  }}
                  onMouseDown={handleRectMouseDown}
                >
                  {/* 九宫格参考线 */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* 垂直线 */}
                    <div className="absolute top-0 bottom-0 left-1/3 w-px bg-primary/40" />
                    <div className="absolute top-0 bottom-0 left-2/3 w-px bg-primary/40" />
                    {/* 水平线 */}
                    <div className="absolute left-0 right-0 top-1/3 h-px bg-primary/40" />
                    <div className="absolute left-0 right-0 top-2/3 h-px bg-primary/40" />
                  </div>
                  
                  {/* 四个角标记 */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary bg-background" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary bg-background" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary bg-background" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary bg-background" />
                </div>
              </>
            )}
          </div>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
            {mode === "perspective" && (
              <Button variant="outline" size="sm" onClick={handleAutoDetect}>
                <Maximize2 className="h-4 w-4 mr-2" />
                自动贴边
              </Button>
            )}
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
