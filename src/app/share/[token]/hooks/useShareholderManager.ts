"use client";

import { useCallback } from "react";
import type { Shareholder } from "../types";

export function useShareholderManager(
  initialShareholders: Shareholder[],
  onShareholdersChange: (shareholders: Shareholder[]) => void
) {
  const addShareholder = useCallback(() => {
    const newShareholder: Shareholder = {
      type: "natural" as const,
      name: "",
      investment: "",
      phone: "",
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
      licenseOriginalKey: "",
      licenseOriginalUrl: "",
      licenseCopyKey: "",
      licenseCopyUrl: "",
    };
    onShareholdersChange([...initialShareholders, newShareholder]);
  }, [initialShareholders, onShareholdersChange]);

  const removeShareholder = useCallback(
    (index: number) => {
      const newShareholders = initialShareholders.filter((_, i) => i !== index);
      onShareholdersChange(newShareholders);
    },
    [initialShareholders, onShareholdersChange]
  );

  const updateShareholder = useCallback(
    (index: number, field: keyof Shareholder, value: string) => {
      const newShareholders = [...initialShareholders];
      newShareholders[index] = { ...newShareholders[index], [field]: value };
      onShareholdersChange(newShareholders);
    },
    [initialShareholders, onShareholdersChange]
  );

  return {
    addShareholder,
    removeShareholder,
    updateShareholder,
  };
}
