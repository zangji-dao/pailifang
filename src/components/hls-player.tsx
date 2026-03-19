"use client";

import { useEffect, useRef, useState } from "react";
import { VideoOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HLSPlayerProps {
  src: string;
  srcHd?: string;  // 高清地址
  onError?: (error: string) => void;
}

// 全局 HLS 实例管理（确保只有一个实例在运行）
let globalHlsInstance: any = null;
let HlsConstructor: any = null;

export default function HLSPlayer({ src, srcHd, onError }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHd, setIsHd] = useState(true);  // 默认高清
  const currentSrcRef = useRef<string>('');

  // 优先使用高清地址
  const playSrc = (isHd && srcHd) ? srcHd : src;

  useEffect(() => {
    if (!playSrc || !videoRef.current) return;

    const video = videoRef.current;
    
    // 如果 src 没变，不重新加载
    if (currentSrcRef.current === playSrc) return;
    currentSrcRef.current = playSrc;
    
    setError(null);
    setLoading(true);

    // 先销毁全局实例
    if (globalHlsInstance) {
      globalHlsInstance.destroy();
      globalHlsInstance = null;
    }

    // 检查 Safari 原生支持
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playSrc;
      video.addEventListener('loadeddata', () => setLoading(false), { once: true });
      video.addEventListener('error', () => {
        setError('视频加载失败');
        setLoading(false);
      }, { once: true });
      video.play().catch(() => {});
      return;
    }

    // 动态加载 HLS.js
    const initHls = () => {
      if (!HlsConstructor || !HlsConstructor.isSupported()) {
        setError('浏览器不支持 HLS 播放');
        setLoading(false);
        return;
      }

      const hls = new HlsConstructor({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,           // 增加缓冲区
        maxMaxBufferLength: 60,        // 最大缓冲
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.5,
        startLevel: -1,                // 自动选择最佳画质
        capLevelToPlayerSize: false,   // 不限制画质
        abrEwmaDefaultEstimate: 500000, // 初始带宽估计
        testBandwidth: true,           // 测试带宽
      });

      hls.loadSource(playSrc);
      hls.attachMedia(video);

      hls.on(HlsConstructor.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });

      hls.on(HlsConstructor.Events.ERROR, (_event: any, data: any) => {
        if (data.fatal) {
          setLoading(false);
          const errorMsg = data.details || '视频加载失败';
          setError(errorMsg);
          onError?.(errorMsg);
        }
      });

      globalHlsInstance = hls;
    };

    if (!HlsConstructor) {
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

    return () => {
      // 组件卸载时不销毁全局实例，让下一个实例接管
    };
  }, [playSrc, onError]);

  const handleRetry = () => {
    currentSrcRef.current = '';
    if (globalHlsInstance) {
      globalHlsInstance.destroy();
      globalHlsInstance = null;
    }
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const toggleQuality = () => {
    currentSrcRef.current = '';
    if (globalHlsInstance) {
      globalHlsInstance.destroy();
      globalHlsInstance = null;
    }
    setIsHd(!isHd);
    setLoading(true);
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
          <p className="text-slate-400 text-sm mb-1">{error}</p>
          <p className="text-slate-500 text-xs mb-3">免费账号同时只能观看1路视频</p>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-1.5" />
            重试
          </Button>
        </div>
      )}
      
      {/* 画质切换按钮 */}
      {srcHd && !loading && !error && (
        <div className="absolute top-3 right-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2 bg-black/50 hover:bg-black/70 text-white text-xs border-0"
            onClick={toggleQuality}
          >
            {isHd ? '高清' : '标清'}
          </Button>
        </div>
      )}
    </div>
  );
}
