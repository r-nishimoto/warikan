"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/useGroup";
import { calculateMemberShares } from "@/lib/settlement";
import { formatCurrency } from "@/lib/utils";

type Tab = "balance" | "spending";

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const { group, loading, error } = useGroup(id);
  const [tab, setTab] = useState<Tab>("balance");

  if (loading) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-zinc-500 mb-4">{error || "グループが見つかりません"}</p>
        <Link href="/" className="text-blue-400">ホームに戻る</Link>
      </div>
    );
  }

  // 貸し借り計算: 各メンバーの収支（立て替え額 - 負担額）
  const balances = new Map<string, number>();
  group.members.forEach((m) => balances.set(m.id, 0));

  group.expenses.forEach((expense) => {
    // 立て替え分をプラス
    balances.set(expense.paidBy, (balances.get(expense.paidBy) || 0) + expense.amount);
    // 負担分をマイナス
    const shares = calculateMemberShares(expense);
    shares.forEach((share, memberId) => {
      balances.set(memberId, (balances.get(memberId) || 0) - share);
    });
  });

  // 支出計算: 各メンバーの実際の負担額
  const spending = new Map<string, number>();
  group.members.forEach((m) => spending.set(m.id, 0));

  group.expenses.forEach((expense) => {
    const shares = calculateMemberShares(expense);
    shares.forEach((share, memberId) => {
      spending.set(memberId, (spending.get(memberId) || 0) + share);
    });
  });

  const totalSpending = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/group/${group.id}`} className="text-blue-400 text-sm">
          ← 戻る
        </Link>
      </div>

      {/* タブ切替 */}
      <div className="flex rounded-xl overflow-hidden border border-zinc-800 mb-6">
        <button
          onClick={() => setTab("balance")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "balance"
              ? "bg-blue-500 text-white"
              : "bg-zinc-900 text-zinc-400 active:bg-zinc-800"
          }`}
        >
          貸し借り
        </button>
        <button
          onClick={() => setTab("spending")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            tab === "spending"
              ? "bg-blue-500 text-white"
              : "bg-zinc-900 text-zinc-400 active:bg-zinc-800"
          }`}
        >
          支出
        </button>
      </div>

      {tab === "balance" ? (
        <div className="space-y-1">
          {group.members.map((member) => {
            const balance = balances.get(member.id) || 0;
            const isPositive = balance > 0;
            return (
              <div key={member.id} className="flex items-center justify-between py-3 border-b border-zinc-800">
                <span className="font-medium text-sm">{member.name}</span>
                <span className={`font-bold text-sm ${isPositive ? "text-blue-400" : balance < 0 ? "text-rose-400" : "text-zinc-400"}`}>
                  {isPositive ? "+" : ""}{formatCurrency(Math.round(balance))}
                </span>
              </div>
            );
          })}
          <p className="text-xs text-zinc-600 pt-3 text-center">
            <span className="text-blue-400">青字</span>は受け取るべき金額 / <span className="text-rose-400">赤字</span>は支払うべき金額
          </p>
        </div>
      ) : (
        <div>
          <div className="space-y-1">
            {group.members.map((member) => {
              const memberSpending = spending.get(member.id) || 0;
              return (
                <div key={member.id} className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <span className="font-medium text-sm">{member.name}</span>
                  <span className="font-bold text-sm">{formatCurrency(Math.round(memberSpending))}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between py-3 border-t-2 border-zinc-700 mt-2">
            <span className="font-bold text-sm">グループ支出合計</span>
            <span className="font-bold text-sm">{formatCurrency(totalSpending)}</span>
          </div>
        </div>
      )}

      <Link
        href={`/group/${group.id}`}
        className="block w-full text-center py-3 border border-zinc-800 text-zinc-400 rounded-xl font-medium text-sm active:bg-zinc-800 mt-6"
      >
        戻る
      </Link>
    </div>
  );
}
