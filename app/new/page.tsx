"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGroups } from "@/lib/useGroups";

export default function NewGroupPage() {
  const router = useRouter();
  const { groups, addGroup } = useGroups();
  const [name, setName] = useState("");
  const [nameComposing, setNameComposing] = useState(false);
  const [memberInput, setMemberInput] = useState("");
  const [memberComposing, setMemberComposing] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const memberInputRef = useRef<HTMLInputElement>(null);

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) return;
    if (members.includes(trimmed)) {
      setError("同じ名前のメンバーがいます");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setError("");
    setMembers((prev) => [...prev, trimmed]);
    setMemberInput("");
    memberInputRef.current?.focus();
  };

  const handleRemoveMember = (name: string) => {
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groups.some((g) => g.name === trimmed)) {
      setError("同じ名前のグループがすでにあります");
      setTimeout(() => setError(""), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const group = await addGroup(trimmed, members);
      router.push(`/group/${group.id}`);
    } catch {
      setError("作成に失敗しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href="/" className="text-blue-400 text-sm">
          ← ホーム
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-6">グループを作成</h1>

      <div className="space-y-6">
        {/* グループ名 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            グループ名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onCompositionStart={() => setNameComposing(true)}
            onCompositionEnd={() => setNameComposing(false)}
            placeholder="例: 箱根旅行"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
            autoFocus
          />
        </div>

        {/* メンバー追加 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            メンバー名
          </label>
          <div className="flex gap-2">
            <input
              ref={memberInputRef}
              type="text"
              value={memberInput}
              onChange={(e) => setMemberInput(e.target.value)}
              onCompositionStart={() => setMemberComposing(true)}
              onCompositionEnd={() => setMemberComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !memberComposing) handleAddMember();
              }}
              placeholder="例: たろう"
              className="flex-1 px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
            />
            <button
              onClick={handleAddMember}
              disabled={!memberInput.trim()}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-30 active:bg-blue-600"
            >
              追加
            </button>
          </div>

          {/* メンバー一覧 */}
          {members.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {members.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm"
                >
                  {m}
                  <button
                    onClick={() => handleRemoveMember(m)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-rose-400 text-sm">{error}</p>
        )}

        {/* 作成ボタン */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || submitting}
          className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium text-base disabled:opacity-30 active:bg-blue-600"
        >
          {submitting ? "作成中..." : "グループを作成"}
        </button>

        <p className="text-xs text-zinc-600 text-center">
          メンバーはあとから追加・編集できます
        </p>
      </div>
    </div>
  );
}
