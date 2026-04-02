import { useState, useCallback } from "react";
import { toast } from "sonner";

export function useWordExport() {
  const [exporting, setExporting] = useState(false);

  // 导出 Word 文档
  const handleExportWord = useCallback(async (templateId: string, name: string) => {
    if (!templateId) {
      toast.error('模板ID不存在');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/contract-templates/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '导出失败');
      }

      // 获取文件 blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || '合同模板'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Word 文档导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error(error instanceof Error ? error.message : '导出失败');
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    handleExportWord,
  };
}
