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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Waroya</h1>
        <p className="text-zinc-500 mt-2">割り勘をもっとスムーズに</p>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 mb-8">
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
            className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
          />
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-30 active:bg-blue-600"
          >
            作成
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-zinc-500 text-sm">読み込み中...</p>
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
                    className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5"
                  >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/group/${group.id}`}
                          className="flex-1 min-w-0"
                        >
                          <div className="text-lg font-bold truncate mb-1">{group.name}</div>
                          <div className="text-sm text-zinc-500">
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
                            className="px-3 py-1.5 text-xs text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10 active:bg-rose-500/20"
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
