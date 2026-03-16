"use client";

import { useRouter } from "next/navigation";
import { useTabs } from "./tabs-context";
import { BookOpen } from "lucide-react";
import { LedgerList } from "@/components/ledgers/LedgerList";

export default function LedgersPage() {
  const router = useRouter();
  const tabsContext = useTabs();

  // 打开创建账套标签页
  const handleCreateLedger = () => {
    if (tabsContext) {
      tabsContext.openTab({
        id: `create-${Date.now()}`,
        label: "新增账套",
        path: "/dashboard/ledgers/create",
        icon: <BookOpen className="h-3.5 w-3.5" />,
      });
    } else {
      router.push("/dashboard/ledgers/create");
    }
  };

  return (
    <LedgerList
      title="账套管理"
      description="管理客户账套信息"
      onCreateClick={handleCreateLedger}
    />
  );
}
