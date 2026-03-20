"use client";

import { useState, useCallback } from "react";
import type { Personnel } from "../types";

export function usePersonnelManager(
  initialPersonnel: Personnel[],
  onPersonnelChange: (personnel: Personnel[]) => void
) {
  const addPersonnel = useCallback(() => {
    const newPersonnel: Personnel = {
      name: "",
      phone: "",
      email: "",
      address: "",
      roles: [],
      idCardFrontKey: "",
      idCardFrontUrl: "",
      idCardBackKey: "",
      idCardBackUrl: "",
    };
    onPersonnelChange([...initialPersonnel, newPersonnel]);
  }, [initialPersonnel, onPersonnelChange]);

  const removePersonnel = useCallback(
    (index: number) => {
      const newPersonnel = initialPersonnel.filter((_, i) => i !== index);
      onPersonnelChange(newPersonnel);
    },
    [initialPersonnel, onPersonnelChange]
  );

  const updatePersonnel = useCallback(
    (index: number, field: keyof Personnel, value: string | string[]) => {
      const newPersonnel = [...initialPersonnel];
      newPersonnel[index] = { ...newPersonnel[index], [field]: value };
      onPersonnelChange(newPersonnel);
    },
    [initialPersonnel, onPersonnelChange]
  );

  const togglePersonnelRole = useCallback(
    (index: number, roleKey: string) => {
      const newPersonnel = [...initialPersonnel];
      const currentRoles = newPersonnel[index].roles;
      if (currentRoles.includes(roleKey)) {
        newPersonnel[index].roles = currentRoles.filter((r) => r !== roleKey);
      } else {
        newPersonnel[index].roles = [...currentRoles, roleKey];
      }
      onPersonnelChange(newPersonnel);
    },
    [initialPersonnel, onPersonnelChange]
  );

  const isRoleTakenByOthers = useCallback(
    (roleKey: string, currentIndex: number): boolean => {
      return initialPersonnel.some(
        (p, idx) => idx !== currentIndex && p.roles.includes(roleKey)
      );
    },
    [initialPersonnel]
  );

  const getRoleHolderIndex = useCallback(
    (roleKey: string): number => {
      return initialPersonnel.findIndex((p) => p.roles.includes(roleKey));
    },
    [initialPersonnel]
  );

  return {
    addPersonnel,
    removePersonnel,
    updatePersonnel,
    togglePersonnelRole,
    isRoleTakenByOthers,
    getRoleHolderIndex,
  };
}
