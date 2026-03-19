"use client";

import { useState, useEffect, useRef } from "react";
import { Video, VideoOff, Loader2, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Camera {
  deviceSerial: string;
  cameraName: string;
  cameraNo: number;
  status: number;
  liveAddress: {
    hls: string;
    flv: string;
    rtmp: string;
  } | null;
}

interface VideoMonitorProps {
  meterId: string;
  meterCode: string;
}

export default function VideoMonitor({ meterId, meterCode }: VideoMonitorProps) {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/yswith/all');
      const result = await response.json();
      
      if (result.success) {
        setCameras(result.data);
        if (result.data.length > 0) {
          setSelectedCamera(result.data[0]);
        }
      } else {
        setError(result.error || '获取摄像头列表失败');
      }
    } catch (e: any) {
      setError(e.message || '获取摄像头列表失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-900 rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-900 rounded-xl text-center p-4">
        <VideoOff className="h-10 w-10 text-slate-500 mb-3" />
        <p className="text-slate-400 text-sm">{error}</p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-3 text-slate-400 hover:text-white"
          onClick={fetchCameras}
        >
          <RefreshCw className="h-4 w-4 mr-1.5" />
          重试
        </Button>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-900 rounded-xl text-center p-4">
        <VideoOff className="h-10 w-10 text-slate-500 mb-3" />
        <p className="text-slate-400 text-sm">暂无绑定摄像头</p>
        <p className="text-slate-500 text-xs mt-1">请在萤石云App中添加设备</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("bg-slate-900 rounded-xl overflow-hidden", isFullscreen && "fixed inset-0 z-50 rounded-none")}>
      {/* 视频区域 */}
      <div className="relative aspect-video bg-black">
        {selectedCamera?.liveAddress?.hls ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            controls
            autoPlay
            muted
            playsInline
            src={selectedCamera.liveAddress.hls}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <VideoOff className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm">无法获取直播地址</p>
          </div>
        )}
        
        {/* 控制按钮 */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 bg-black/50 hover:bg-black/70 text-white border-0"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 摄像头名称 */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 bg-black/50 rounded text-xs text-white">
            {selectedCamera?.cameraName || '未知摄像头'}
          </span>
        </div>
      </div>
      
      {/* 摄像头切换 */}
      {cameras.length > 1 && (
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            {cameras.map((camera) => (
              <button
                key={`${camera.deviceSerial}-${camera.cameraNo}`}
                onClick={() => setSelectedCamera(camera)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                  selectedCamera?.deviceSerial === camera.deviceSerial && 
                  selectedCamera?.cameraNo === camera.cameraNo
                    ? "bg-violet-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                )}
              >
                {camera.cameraName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
