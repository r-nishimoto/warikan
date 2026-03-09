"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Group, Expense, ReceivingMethod } from "./types";

// ローカルのグループIDレジストリ管理
const GROUP_IDS_KEY = "warikan-group-ids";

export function getLocalGroupIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GROUP_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addLocalGroupId(id: string) {
  const ids = getLocalGroupIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(GROUP_IDS_KEY, JSON.stringify(ids));
  }
}

export function removeLocalGroupId(id: string) {
  const ids = getLocalGroupIds().filter((gid) => gid !== id);
  localStorage.setItem(GROUP_IDS_KEY, JSON.stringify(ids));
}

export function reorderLocalGroupIds(ids: string[]) {
  localStorage.setItem(GROUP_IDS_KEY, JSON.stringify(ids));
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 全データ取得（API Route経由）
  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        setGroup(null);
        setLoading(false);
        setError("グループが見つかりません");
        return;
      }
      const data = await res.json();
      setGroup(data);
      setLoading(false);
      setError(null);
      addLocalGroupId(groupId);
    } catch {
      setError("データの取得に失敗しました");
      setLoading(false);
    }
  }, [groupId]);

  // 初期取得 + ポーリング（30秒間隔）
  useEffect(() => {
    fetchGroup();
    intervalRef.current = setInterval(fetchGroup, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [groupId, fetchGroup]);

  // --- Mutations (全てAPI Route経由) ---

  const addMember = useCallback(async (name: string) => {
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "メンバーの追加に失敗しました");
    }
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const removeMember = useCallback(async (memberId: string) => {
    await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "追加に失敗しました");
    }
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const updateExpense = useCallback(async (expenseId: string, expense: Omit<Expense, "id">) => {
    const res = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "更新に失敗しました");
    }
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const removeExpense = useCallback(async (expenseId: string) => {
    await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, { method: "DELETE" });
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const toggleSettlementCompleted = useCallback(async (key: string) => {
    // 楽観的更新: UIを即座に反映
    setGroup((prev) => {
      if (!prev) return prev;
      const completed = prev.completedSettlements || [];
      const isCompleted = completed.includes(key);
      return {
        ...prev,
        completedSettlements: isCompleted
          ? completed.filter((k) => k !== key)
          : [...completed, key],
      };
    });
    // バックグラウンドでAPI同期
    try {
      await fetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch {
      // 失敗時はサーバーから再取得して整合性を保つ
      await fetchGroup();
    }
  }, [groupId, fetchGroup]);

  const resetGroupExpenses = useCallback(async () => {
    await fetch(`/api/groups/${groupId}/expenses`, { method: "DELETE" });
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const updateMemberPreference = useCallback(async (memberId: string, method: ReceivingMethod, customText?: string) => {
    await fetch(`/api/groups/${groupId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, customText }),
    });
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const updateGroupName = useCallback(async (name: string) => {
    await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    await fetchGroup();
  }, [groupId, fetchGroup]);

  const deleteGroup = useCallback(async () => {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    removeLocalGroupId(groupId);
  }, [groupId]);

  return {
    group,
    loading,
    error,
    addMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
    toggleSettlementCompleted,
    resetGroupExpenses,
    updateMemberPreference,
    updateGroupName,
    deleteGroup,
  };
}
