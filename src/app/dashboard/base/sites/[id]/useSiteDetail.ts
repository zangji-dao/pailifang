"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { BaseDetail, StatsInfo } from "./types";

export function useSiteDetail(baseId: string) {
  const router = useRouter();

  // 状态
  const [baseDetail, setBaseDetail] = useState<BaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeter, setExpandedMeter] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 获取基地详情
  const fetchBaseDetail = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`/api/bases/${baseId}`, { signal });
      const result = await response.json();
      if (result.success) {
        setBaseDetail(result.data);
      }
    } catch (error) {
      // 忽略 AbortError
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("获取基地详情失败:", error);
    }
  }, [baseId]);

  // 初始加载
  useEffect(() => {
    if (baseId) {
      const controller = new AbortController();
      fetchBaseDetail(controller.signal).finally(() => setLoading(false));
      return () => controller.abort();
    }
  }, [baseId, fetchBaseDetail]);

  // 计算统计信息
  const stats: StatsInfo = useMemo(() => {
    if (!baseDetail) {
      return {
        totalMeters: 0,
        totalSpaces: 0,
        totalRegNumbers: 0,
        allocatedRegNumbers: 0,
      };
    }

    const totalMeters = baseDetail.meters?.length || 0;
    const totalSpaces = baseDetail.meters?.reduce((sum, m) => sum + (m.spaces?.length || 0), 0) || 0;
    const totalRegNumbers = baseDetail.meters?.reduce(
      (sum, m) => sum + (m.spaces?.reduce((s, sp) => s + (sp.regNumbers?.length || 0), 0) || 0),
      0
    ) || 0;
    const allocatedRegNumbers = baseDetail.meters?.reduce(
      (sum, m) => sum + (m.spaces?.reduce((s, sp) => s + (sp.regNumbers?.filter(r => r.available === false)?.length || 0), 0) || 0),
      0
    ) || 0;

    return { totalMeters, totalSpaces, totalRegNumbers, allocatedRegNumbers };
  }, [baseDetail]);

  // 删除基地
  const handleDeleteBase = useCallback(async () => {
    if (!baseDetail) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/bases/${baseDetail.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        router.push('/dashboard/base/sites');
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除基地失败:', error);
      toast.error('删除失败，请稍后重试');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }, [baseDetail, router]);

  // 获取当前选中的物业
  const selectedMeter = useMemo(() => {
    if (!expandedMeter || !baseDetail) return null;
    return baseDetail.meters.find(m => m.id === expandedMeter) || null;
  }, [expandedMeter, baseDetail]);

  return {
    // 状态
    baseDetail,
    loading,
    expandedMeter,
    setExpandedMeter,
    showDeleteDialog,
    setShowDeleteDialog,
    deleting,
    stats,
    selectedMeter,

    // 方法
    handleDeleteBase,
    refreshBaseDetail: fetchBaseDetail,
  };
}
