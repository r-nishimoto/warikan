"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Link from "next/link";

export default function AddExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getGroup, addExpense } = useStore();
  const group = getGroup(id);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  if (!group) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-zinc-500 mb-4">グループが見つかりません</p>
        <Link href="/" className="text-blue-400">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    const numAmount = parseInt(amount, 10);
    if (!description.trim() || !numAmount || !paidBy || splitAmong.length === 0)
      return;

    addExpense(group.id, {
      description: description.trim(),
      amount: numAmount,
      paidBy,
      paymentMethod: "cash",
      splitAmong,
      date: Date.now(),
    });
    router.push(`/group/${group.id}`);
  };

  const toggleMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAll = () => {
    setSplitAmong(group.members.map((m) => m.id));
  };

  const isValid =
    description.trim() &&
    parseInt(amount, 10) > 0 &&
    paidBy &&
    splitAmong.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/group/${group.id}`} className="text-blue-400 text-sm">
          ← 戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-6">支出を追加</h1>

      <div className="space-y-5">
        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            内容
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例: 居酒屋での夕食"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
          />
        </div>

        {/* 金額 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            金額（円）
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setAmount(v);
            }}
            placeholder="例: 12000"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
          />
        </div>

        {/* 支払った人 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            誰が支払った？
          </label>
          <div className="grid grid-cols-2 gap-2">
            {group.members.map((member) => (
              <button
                key={member.id}
                onClick={() => setPaidBy(member.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  paidBy === member.id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700"
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>

        {/* 分割対象 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-zinc-400">
              誰で割り勘？
            </label>
            <button
              onClick={selectAll}
              className="text-xs text-blue-400 active:text-blue-300"
            >
              全員選択
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {group.members.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  splitAmong.includes(member.id)
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700"
                }`}
              >
                {member.name}
              </button>
            ))}
          </div>
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-30 active:bg-blue-600 text-base"
        >
          支出を追加する
        </button>
      </div>
    </div>
  );
}
