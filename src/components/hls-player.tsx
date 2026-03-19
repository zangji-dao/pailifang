"use client";

import { useEffect, useRef, useState } from "react";
import { VideoOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HLSPlayerProps {
  src: string;
  onError?: (error: string) => void;
}

// 动态导入 HLS.js（仅客户端）
let HlsConstructor: any = null;

export default function HLSPlayer({ src, onError }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;
    setError(null);
    setLoading(true);

    // 检查 Safari 原生支持
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadeddata', () => setLoading(false));
      video.addEventListener('error', () => {
        setError('视频加载失败');
        setLoading(false);
      });
      video.play().catch(() => {});
      return;
    }

    // 动态加载 HLS.js
    if (!HlsConstructor) {
      // 使用 script 标签加载
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        HlsConstructor = window.Hls;
        initHls();
      };
      script.onerror = () => {
        setError('播放器加载失败');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initHls();
    }

    function initHls() {
      if (!HlsConstructor || !HlsConstructor.isSupported()) {
        setError('浏览器不支持 HLS 播放');
        setLoading(false);
        return;
      }

      // 销毁旧实例
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new HlsConstructor({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(HlsConstructor.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          setLoading(false);
          setError('视频加载失败，请重试');
          onError?.('视频加载失败');
        }
      });

      hlsRef.current = hls;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onError]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // 强制重新加载
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    // 触发重新渲染
    window.location.reload();
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        autoPlay
        muted
        playsInline
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white text-sm">加载中...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          <VideoOff className="h-12 w-12 text-slate-500 mb-2" />
          <p className="text-slate-400 text-sm">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-slate-400 hover:text-white"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            重试
          </Button>
        </div>
      )}
    </div>
  );
}
