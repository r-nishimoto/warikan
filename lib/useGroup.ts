"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { Group, Member, Expense, Adjustment, SplitConfig, ReceivingMethod, PaymentMethod, parseReceivingMethod, encodeReceivingMethod } from "./types";
import { nanoid } from "nanoid";

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

// adjustments JSONB カラムに splitConfig も格納する
// 新形式: { items?: Adjustment[], splitConfig?: SplitConfig }
// 旧形式（後方互換）: Adjustment[] （配列のまま）
function encodeAdjustmentsColumn(adjustments?: Adjustment[], splitConfig?: SplitConfig): any | null {
  const hasAdj = adjustments && adjustments.length > 0;
  const hasCfg = splitConfig?.mode && splitConfig.mode !== "equal";
  if (!hasAdj && !hasCfg) return null;
  if (hasAdj && !hasCfg) return adjustments; // 旧形式互換
  return {
    ...(hasAdj ? { items: adjustments } : {}),
    ...(hasCfg ? { splitConfig } : {}),
  };
}

function decodeAdjustmentsColumn(raw: any): { adjustments?: Adjustment[]; splitConfig?: SplitConfig } {
  if (!raw) return {};
  if (Array.isArray(raw)) return { adjustments: raw }; // 旧形式
  return {
    adjustments: raw.items || undefined,
    splitConfig: raw.splitConfig || undefined,
  };
}

// DB行 → アプリ型の変換
function assembleGroup(
  groupRow: { id: string; name: string; currency: string; created_at: number; updated_at: number },
  memberRows: { id: string; name: string; preferred_receiving_method: string | null }[],
  expenseRows: { id: string; description: string; amount: number; paid_by: string; payment_method: string; split_among: string[]; expense_date: string | null; date: number; adjustments: any | null }[],
  settlementRows: { settlement_key: string }[]
): Group {
  return {
    id: groupRow.id,
    name: groupRow.name,
    currency: groupRow.currency,
    members: memberRows.map((m) => {
      const parsed = parseReceivingMethod(m.preferred_receiving_method);
      return {
        id: m.id,
        name: m.name,
        preferredReceivingMethod: parsed.method || undefined,
        customReceivingMethod: parsed.custom,
      };
    }),
    expenses: expenseRows.map((e) => {
      const { adjustments, splitConfig } = decodeAdjustmentsColumn(e.adjustments);
      return {
        id: e.id,
        description: e.description,
        amount: e.amount,
        paidBy: e.paid_by,
        paymentMethod: (e.payment_method as PaymentMethod) || "cash",
        splitAmong: e.split_among || [],
        expenseDate: e.expense_date || undefined,
        date: e.date,
        adjustments,
        splitConfig,
      };
    }),
    completedSettlements: settlementRows.map((s) => s.settlement_key),
    createdAt: groupRow.created_at,
    updatedAt: groupRow.updated_at,
  };
}

export function useGroup(groupId: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 全データ取得
  const fetchGroup = useCallback(async () => {
    const [groupRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
      supabase.from("groups").select("*").eq("id", groupId).single(),
      supabase.from("members").select("*").eq("group_id", groupId),
      supabase.from("expenses").select("*").eq("group_id", groupId),
      supabase.from("completed_settlements").select("settlement_key").eq("group_id", groupId),
    ]);

    if (groupRes.error || !groupRes.data) {
      setGroup(null);
      setLoading(false);
      setError("グループが見つかりません");
      return;
    }

    const assembled = assembleGroup(
      groupRes.data,
      membersRes.data || [],
      expensesRes.data || [],
      settlementsRes.data || []
    );
    setGroup(assembled);
    setLoading(false);
    setError(null);

    // このグループをローカルレジストリに追加
    addLocalGroupId(groupId);
  }, [groupId]);

  // 初期取得 + リアルタイム購読
  useEffect(() => {
    fetchGroup();

    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "groups", filter: `id=eq.${groupId}` }, () => {
        fetchGroup();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `group_id=eq.${groupId}` }, () => {
        fetchGroup();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter: `group_id=eq.${groupId}` }, () => {
        fetchGroup();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "completed_settlements", filter: `group_id=eq.${groupId}` }, () => {
        fetchGroup();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [groupId, fetchGroup]);

  // updated_atを更新するヘルパー
  const touchGroup = useCallback(async () => {
    await supabase.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);
  }, [groupId]);

  // --- Mutations ---

  const addMember = useCallback(async (name: string) => {
    const memberId = nanoid(6);
    await supabase.from("members").insert({
      id: memberId,
      group_id: groupId,
      name,
      preferred_receiving_method: null,
    });
    await touchGroup();
  }, [groupId, touchGroup]);

  const removeMember = useCallback(async (memberId: string) => {
    // 関連する支出も整理（paidByがこのメンバーの支出を削除、splitAmongからも除去）
    if (group) {
      for (const expense of group.expenses) {
        if (expense.paidBy === memberId) {
          await supabase.from("expenses").delete().eq("id", expense.id);
        } else if (expense.splitAmong.includes(memberId)) {
          const newSplitAmong = expense.splitAmong.filter((id) => id !== memberId);
          if (newSplitAmong.length === 0) {
            await supabase.from("expenses").delete().eq("id", expense.id);
          } else {
            // adjustments からもメンバーを除去
            const newAdjustments = expense.adjustments
              ?.map((adj) => ({
                ...adj,
                memberIds: adj.memberIds.filter((id) => id !== memberId),
              }))
              .filter((adj) => adj.memberIds.length > 0);
            await supabase.from("expenses").update({
              split_among: newSplitAmong,
              adjustments: newAdjustments?.length ? newAdjustments : null,
            }).eq("id", expense.id);
          }
        }
      }
    }
    await supabase.from("members").delete().eq("id", memberId);
    await touchGroup();
  }, [groupId, group, touchGroup]);

  const addExpense = useCallback(async (expense: Omit<Expense, "id">) => {
    const expenseId = nanoid(8);
    const { error } = await supabase.from("expenses").insert({
      id: expenseId,
      group_id: groupId,
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      payment_method: expense.paymentMethod,
      split_among: expense.splitAmong,
      expense_date: expense.expenseDate || null,
      date: expense.date,
      adjustments: encodeAdjustmentsColumn(expense.adjustments, expense.splitConfig),
    });
    if (error) throw new Error(error.message);
    await touchGroup();
  }, [groupId, touchGroup]);

  const updateExpense = useCallback(async (expenseId: string, expense: Omit<Expense, "id">) => {
    const { error } = await supabase.from("expenses").update({
      description: expense.description,
      amount: expense.amount,
      paid_by: expense.paidBy,
      payment_method: expense.paymentMethod,
      split_among: expense.splitAmong,
      expense_date: expense.expenseDate || null,
      date: expense.date,
      adjustments: encodeAdjustmentsColumn(expense.adjustments, expense.splitConfig),
    }).eq("id", expenseId);
    if (error) throw new Error(error.message);
    await touchGroup();
  }, [touchGroup]);

  const removeExpense = useCallback(async (expenseId: string) => {
    await supabase.from("expenses").delete().eq("id", expenseId);
    await touchGroup();
  }, [touchGroup]);

  const toggleSettlementCompleted = useCallback(async (key: string) => {
    const existing = group?.completedSettlements.includes(key);
    if (existing) {
      await supabase.from("completed_settlements").delete().eq("group_id", groupId).eq("settlement_key", key);
    } else {
      await supabase.from("completed_settlements").insert({ group_id: groupId, settlement_key: key });
    }
  }, [groupId, group]);

  const resetGroupExpenses = useCallback(async () => {
    await supabase.from("expenses").delete().eq("group_id", groupId);
    await supabase.from("completed_settlements").delete().eq("group_id", groupId);
    await touchGroup();
  }, [groupId, touchGroup]);

  const updateMemberPreference = useCallback(async (memberId: string, method: ReceivingMethod, customText?: string) => {
    const encoded = encodeReceivingMethod(method, customText);
    await supabase.from("members").update({ preferred_receiving_method: encoded }).eq("id", memberId);
    await touchGroup();
  }, [touchGroup]);

  const updateGroupName = useCallback(async (name: string) => {
    await supabase.from("groups").update({ name, updated_at: Date.now() }).eq("id", groupId);
  }, [groupId]);

  const deleteGroup = useCallback(async () => {
    await supabase.from("groups").delete().eq("id", groupId);
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
