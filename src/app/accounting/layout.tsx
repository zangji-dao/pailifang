"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/hooks/use-toast";
import { ConfirmProvider } from "@/components/confirm-dialog";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // 检查登录状态
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userData = localStorage.getItem("user");

    if (!isLoggedIn || !userData) {
      router.push("/login");
      return;
    }
  }, [router]);

  return (
    <ConfirmProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfirmProvider>
  );
}
