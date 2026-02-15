"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroups } from "@/lib/useGroups";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  const [name, setName] = useState("");
  const [composing, setComposing] = useState(false);
  const router = useRouter();
  const { groups, loading, addGroup, deleteGroup } = useGroups();

  const handleCreate = async () => {
    if (!name.trim()) return;
    const group = await addGroup(name.trim());
    setName("");
    router.push(`/group/${group.id}`);
  };

  return (
    <div className="p-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold text-blue-600">Waroya</h1>
        <p className="text-gray-500 mt-2">割り勘をもっとスムーズに</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">新しいグループを作成</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !composing) handleCreate();
            }}
            placeholder="例: 箱根旅行"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-base"
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-40 active:bg-blue-600"
          >
            作成
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">読み込み中...</p>
        </div>
      ) : groups.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">グループ一覧</h2>
          <div className="space-y-3">
            {groups
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((group) => (
                  <div
                    key={group.id}
                    className="bg-white rounded-2xl shadow-sm p-5"
                  >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/group/${group.id}`}
                          className="flex-1 min-w-0"
                        >
                          <div className="text-lg font-bold truncate mb-1">{group.name}</div>
                          <div className="text-sm text-gray-400">
                            {group.members.length}人 ・ {group.expenses.length}件の支出 ・ {formatCurrency(group.expenses.reduce((sum, e) => sum + e.amount, 0))}
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => {
                              if (window.confirm(`「${group.name}」を本当に削除しますか？`)) {
                                deleteGroup(group.id);
                              }
                            }}
                            className="px-3 py-1.5 text-xs text-red-400 border border-red-200 rounded-lg hover:bg-red-50 active:bg-red-100"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
