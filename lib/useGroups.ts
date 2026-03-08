"use client";

import { useState, useEffect, useCallback } from "react";
import { Group } from "./types";
import { getLocalGroupIds, addLocalGroupId, removeLocalGroupId, reorderLocalGroupIds } from "./useGroup";

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

    try {
      const res = await fetch("/api/groups/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      const fetchedGroups: Group[] = data.groups || [];
      const existingIds = new Set(data.existingIds || []);

      // DBに存在しないグループIDをレジストリから削除
      ids.forEach((id) => {
        if (!existingIds.has(id)) removeLocalGroupId(id);
      });

      // localStorageの配列順で並び替え
      const idOrder = getLocalGroupIds();
      fetchedGroups.sort((a, b) => {
        const ai = idOrder.indexOf(a.id);
        const bi = idOrder.indexOf(b.id);
        return ai - bi;
      });

      setGroups(fetchedGroups);
    } catch {
      setGroups([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = useCallback(async (name: string, memberNames?: string[]): Promise<Group> => {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, memberNames }),
    });
    if (!res.ok) throw new Error("グループの作成に失敗しました");

    const newGroup: Group = await res.json();
    addLocalGroupId(newGroup.id);
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    removeLocalGroupId(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const reorderGroups = useCallback((orderedIds: string[]) => {
    reorderLocalGroupIds(orderedIds);
    setGroups((prev) => {
      const map = new Map(prev.map((g) => [g.id, g]));
      return orderedIds.map((id) => map.get(id)!).filter(Boolean);
    });
  }, []);

  return { groups, loading, addGroup, deleteGroup, reorderGroups };
}
