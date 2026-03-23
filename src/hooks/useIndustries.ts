"use client";

import { useState, useEffect, useCallback } from "react";

export interface Industry {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export function useIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIndustries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/industries");
      const data = await response.json();
      
      if (data.success) {
        setIndustries(data.data);
        setError(null);
      } else {
        setError(data.error || "获取行业列表失败");
      }
    } catch (err) {
      console.error("获取行业列表失败:", err);
      setError("获取行业列表失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndustries();
  }, [fetchIndustries]);

  return {
    industries,
    loading,
    error,
    refresh: fetchIndustries,
  };
}
