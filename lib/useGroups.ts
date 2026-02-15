"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { Group } from "./types";
import { nanoid } from "nanoid";
import { getLocalGroupIds, addLocalGroupId, removeLocalGroupId } from "./useGroup";

// ホーム画面用: ローカルレジストリに登録されたグループ一覧を取得
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    const ids = getLocalGroupIds();
    if (ids.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const [groupsRes, membersRes, expensesRes] = await Promise.all([
      supabase.from("groups").select("*").in("id", ids),
      supabase.from("members").select("*").in("group_id", ids),
      supabase.from("expenses").select("*").in("group_id", ids),
    ]);

    const groupRows = groupsRes.data || [];
    const memberRows = membersRes.data || [];
    const expenseRows = expensesRes.data || [];

    // DBに存在しないグループIDをレジストリから削除
    const existingIds = new Set(groupRows.map((g) => g.id));
    ids.forEach((id) => {
      if (!existingIds.has(id)) removeLocalGroupId(id);
    });

    const assembled: Group[] = groupRows.map((g) => ({
      id: g.id,
      name: g.name,
      currency: g.currency,
      members: memberRows
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          preferredReceivingMethod: m.preferred_receiving_method || undefined,
        })),
      expenses: expenseRows
        .filter((e) => e.group_id === g.id)
        .map((e) => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          paidBy: e.paid_by,
          paymentMethod: e.payment_method || "cash",
          splitAmong: e.split_among || [],
          expenseDate: e.expense_date || undefined,
          date: e.date,
        })),
      completedSettlements: [],
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    }));

    setGroups(assembled);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = useCallback(async (name: string): Promise<Group> => {
    const groupId = nanoid(8);
    const now = Date.now();
    const { error } = await supabase.from("groups").insert({
      id: groupId,
      name,
      currency: "JPY",
      created_at: now,
      updated_at: now,
    });
    if (error) {
      console.error("Failed to create group:", error);
      throw new Error("グループの作成に失敗しました");
    }
    addLocalGroupId(groupId);

    const newGroup: Group = {
      id: groupId,
      name,
      currency: "JPY",
      members: [],
      expenses: [],
      completedSettlements: [],
      createdAt: now,
      updatedAt: now,
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    await supabase.from("groups").delete().eq("id", groupId);
    removeLocalGroupId(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  return { groups, loading, addGroup, deleteGroup };
}
