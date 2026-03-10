"use client";

import { useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/useGroup";
import { ReceivingMethod, RECEIVING_METHODS } from "@/lib/types";

export default function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const {
    group,
    loading,
    error,
    addMember,
    removeMember,
    updateMemberPreference,
    updateGroupName,
  } = useGroup(id);

  const [memberName, setMemberName] = useState("");
  const [memberComposing, setMemberComposing] = useState(false);
  const [memberError, setMemberError] = useState("");

  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupNameComposing, setGroupNameComposing] = useState(false);

  const handleAddMember = useCallback(async () => {
    if (!memberName.trim() || !group) return;
    const trimmed = memberName.trim();
    if (group.members.some((m) => m.name === trimmed)) {
      setMemberError("名前が重複しているため登録できません");
      setTimeout(() => setMemberError(""), 3000);
      return;
    }
    setMemberError("");
    await addMember(trimmed);
    setMemberName("");
  }, [memberName, group, addMember]);

  if (loading) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-on-surface-tertiary">読み込み中...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-on-surface-tertiary mb-4">{error || "グループが見つかりません"}</p>
        <Link href="/" className="text-blue-400">ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/group/${group.id}`} className="text-blue-400 text-sm">
          ← 戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-6">グループ設定</h1>

      <div className="space-y-8">
        {/* グループ名 */}
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-2">グループ名</label>
          {editingGroupName ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                onCompositionStart={() => setGroupNameComposing(true)}
                onCompositionEnd={() => setGroupNameComposing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setEditingGroupName(false);
                  if (e.key === "Enter" && !groupNameComposing && groupNameInput.trim()) {
                    updateGroupName(groupNameInput.trim());
                    setEditingGroupName(false);
                  }
                }}
                className="flex-1 px-4 py-3 border border-border-secondary bg-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                autoFocus
              />
              <button
                onClick={() => setEditingGroupName(false)}
                className="px-4 py-3 text-sm text-on-surface-secondary border border-border-secondary rounded-xl"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (groupNameInput.trim()) {
                    updateGroupName(groupNameInput.trim());
                    setEditingGroupName(false);
                  }
                }}
                className="px-4 py-3 text-sm bg-blue-500 text-white rounded-xl"
              >
                保存
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setGroupNameInput(group.name);
                setEditingGroupName(true);
              }}
              className="flex items-center gap-2 text-lg font-bold active:text-on-surface-secondary"
            >
              {group.name}
              <svg className="w-4 h-4 text-on-surface-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </div>

        {/* メンバー管理 */}
        <div>
          <label className="block text-sm font-medium text-on-surface-secondary mb-2">メンバー</label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              onCompositionStart={() => setMemberComposing(true)}
              onCompositionEnd={() => setMemberComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !memberComposing) handleAddMember();
              }}
              placeholder="メンバー名を入力"
              className="flex-1 px-4 py-3 border border-border-secondary bg-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-on-surface-tertiary"
            />
            <button
              onClick={handleAddMember}
              disabled={!memberName.trim()}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-30 active:bg-blue-600"
            >
              追加
            </button>
          </div>

          {memberError && <p className="text-rose-400 text-sm mb-2">{memberError}</p>}

          {group.members.length === 0 ? (
            <p className="text-on-surface-faint text-sm py-4 text-center">メンバーを追加してください</p>
          ) : (
            <div className="space-y-2">
              {group.members.map((member) => {
                const isOther = member.preferredReceivingMethod === "other";
                return (
                  <div
                    key={member.id}
                    className="bg-surface-secondary border border-border-default rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-border-secondary text-on-surface-secondary text-xs font-medium flex items-center justify-center flex-shrink-0">
                        {member.name.charAt(0)}
                      </span>
                      <span className="flex-1 font-medium text-sm">{member.name}</span>
                      <select
                        value={member.preferredReceivingMethod || "any"}
                        onChange={(e) => {
                          const val = e.target.value as ReceivingMethod;
                          if (val === "other") {
                            updateMemberPreference(member.id, val, member.customReceivingMethod || "");
                          } else {
                            updateMemberPreference(member.id, val);
                          }
                        }}
                        className="text-xs bg-surface-tertiary border border-border-secondary rounded-lg px-2 py-1.5 text-on-surface-secondary"
                      >
                        {RECEIVING_METHODS.map((rm) => (
                          <option key={rm.value} value={rm.value}>{rm.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (window.confirm(`「${member.name}」を削除しますか？\n関連する支出データも影響を受けます。`)) {
                            removeMember(member.id);
                          }
                        }}
                        className="text-on-surface-faint hover:text-rose-400 text-lg"
                      >
                        ×
                      </button>
                    </div>
                    {isOther && (
                      <div className="mt-2 ml-10">
                        <input
                          type="text"
                          defaultValue={member.customReceivingMethod || ""}
                          placeholder="例: PayPayのID、口座情報など"
                          onBlur={(e) => {
                            updateMemberPreference(member.id, "other", e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full px-3 py-2 text-xs bg-surface-tertiary border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-on-surface-faint"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
