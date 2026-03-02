"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/useGroup";
import { formatNumberWithCommas, removeCommas, formatCurrency } from "@/lib/utils";
import { Adjustment, Expense, PaymentMethod, PAYMENT_METHODS } from "@/lib/types";
import { calculateMemberShares } from "@/lib/settlement";

export default function AddExpensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { group, loading, error, addExpense } = useGroup(id);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [expenseDate, setExpenseDate] = useState("");
  const [descComposing, setDescComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 調整
  type AdjustmentInput = { memberIds: string[]; amount: string; memo: string };
  const [adjustments, setAdjustments] = useState<AdjustmentInput[]>([]);
  const [showAdjustments, setShowAdjustments] = useState(false);

  const parseAdjustments = (inputs: AdjustmentInput[]): Adjustment[] | undefined => {
    const parsed = inputs
      .filter((adj) => adj.memberIds.length > 0 && parseInt(adj.amount, 10) > 0)
      .map((adj) => ({
        memberIds: adj.memberIds,
        amount: -Math.abs(parseInt(adj.amount, 10)),
        memo: adj.memo.trim() || undefined,
      }));
    return parsed.length > 0 ? parsed : undefined;
  };

  const toggleMember = (memberId: string) => {
    setSplitAmong((prev) => {
      const next = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];
      if (!next.includes(memberId)) {
        setAdjustments((prevAdj) =>
          prevAdj.map((adj) => ({
            ...adj,
            memberIds: adj.memberIds.filter((id) => next.includes(id)),
          })).filter((adj) => adj.memberIds.length > 0)
        );
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!group) return;
    setSplitAmong(group.members.map((m) => m.id));
  };

  const handleSubmit = useCallback(async () => {
    if (!group || submitting) return;
    const numAmount = parseInt(amount, 10);
    if (!description.trim() || !numAmount || !paidBy || splitAmong.length === 0) return;

    setSubmitting(true);
    await addExpense({
      description: description.trim(),
      amount: numAmount,
      paidBy,
      paymentMethod,
      splitAmong,
      expenseDate: expenseDate || undefined,
      date: Date.now(),
      adjustments: parseAdjustments(adjustments),
    });
    router.push(`/group/${id}`);
  }, [group, submitting, description, amount, paidBy, paymentMethod, splitAmong, expenseDate, adjustments, addExpense, router, id]);

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

      <h1 className="text-xl font-bold mb-6">立て替えを追加</h1>

      <div className="space-y-5">
        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">内容</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onCompositionStart={() => setDescComposing(true)}
            onCompositionEnd={() => setDescComposing(false)}
            placeholder="例: 居酒屋での夕食"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
            autoFocus
          />
        </div>

        {/* 金額 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">金額（円）</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberWithCommas(amount)}
            onChange={(e) => {
              const v = removeCommas(e.target.value).replace(/[^0-9]/g, "");
              setAmount(v);
            }}
            placeholder="例: 12,000"
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder:text-zinc-500"
          />
        </div>

        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">日付（任意）</label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="w-full px-4 py-3 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        {/* 支払った人 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">誰が支払った？</label>
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

        {/* 支払い方法 */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">支払い方法</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-4 py-3 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base bg-zinc-800 appearance-none"
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>

        {/* 割り勘メンバー */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-zinc-400">誰で割り勘？</label>
            <button onClick={selectAll} className="text-xs text-blue-400 active:text-blue-300">
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

        {/* 割引・調整（任意） */}
        {splitAmong.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowAdjustments(!showAdjustments)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 active:text-zinc-400"
            >
              <span className={`transition-transform duration-150 ${showAdjustments ? "rotate-90" : ""}`}>▶</span>
              割引・調整（任意）
              {adjustments.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px]">
                  {adjustments.length}
                </span>
              )}
            </button>

            {showAdjustments && (
              <div className="mt-3 space-y-3">
                {adjustments.map((adj, index) => (
                  <div key={index} className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">調整 {index + 1}</span>
                      <button
                        onClick={() => setAdjustments((prev) => prev.filter((_, i) => i !== index))}
                        className="text-xs text-rose-400 active:text-rose-300"
                      >
                        削除
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">対象メンバー</label>
                      <div className="flex flex-wrap gap-1.5">
                        {group.members
                          .filter((m) => splitAmong.includes(m.id))
                          .map((member) => (
                            <button
                              key={member.id}
                              onClick={() => {
                                setAdjustments((prev) =>
                                  prev.map((a, i) =>
                                    i === index
                                      ? { ...a, memberIds: a.memberIds.includes(member.id) ? a.memberIds.filter((mid) => mid !== member.id) : [...a.memberIds, member.id] }
                                      : a
                                  )
                                );
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                adj.memberIds.includes(member.id)
                                  ? "bg-orange-500 text-white border-orange-500"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-400 active:bg-zinc-700"
                              }`}
                            >
                              {member.name}
                            </button>
                          ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">割引額（1人あたり）</label>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm">-</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formatNumberWithCommas(adj.amount)}
                          onChange={(e) => {
                            const v = removeCommas(e.target.value).replace(/[^0-9]/g, "");
                            setAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, amount: v } : a)));
                          }}
                          placeholder="1000"
                          className="flex-1 px-3 py-2 border border-zinc-700 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-600"
                        />
                        <span className="text-zinc-500 text-sm">円</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">メモ（任意）</label>
                      <input
                        type="text"
                        value={adj.memo}
                        onChange={(e) => setAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, memo: e.target.value } : a)))}
                        placeholder="例: ノンアル"
                        className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setAdjustments((prev) => [...prev, { memberIds: [], amount: "", memo: "" }])}
                  className="w-full py-2 border border-dashed border-zinc-700 text-zinc-500 rounded-xl text-sm active:bg-zinc-800"
                >
                  + 調整を追加
                </button>

                {/* プレビュー */}
                {adjustments.some((a) => a.memberIds.length > 0 && parseInt(a.amount, 10) > 0) &&
                  parseInt(amount, 10) > 0 &&
                  splitAmong.length > 0 && (
                    <div className="bg-zinc-800/30 rounded-xl p-3">
                      <p className="text-xs text-zinc-500 mb-2">調整後の1人あたり金額（目安）</p>
                      <div className="space-y-1">
                        {(() => {
                          const tempExpense: Expense = {
                            id: "preview",
                            description: "",
                            amount: parseInt(amount, 10),
                            paidBy: "",
                            paymentMethod: "cash",
                            splitAmong,
                            date: 0,
                            adjustments: parseAdjustments(adjustments),
                          };
                          const shares = calculateMemberShares(tempExpense);
                          return splitAmong.map((memberId) => {
                            const member = group.members.find((m) => m.id === memberId);
                            const share = shares.get(memberId) || 0;
                            const baseShare = Math.round(parseInt(amount, 10) / splitAmong.length);
                            const diff = share - baseShare;
                            return (
                              <div key={memberId} className="flex justify-between text-xs">
                                <span className="text-zinc-400">{member?.name}</span>
                                <span className={diff !== 0 ? "text-orange-400" : "text-zinc-300"}>
                                  {formatCurrency(share)}
                                  {diff !== 0 && ` (${diff > 0 ? "+" : ""}${formatCurrency(diff)})`}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* 送信 */}
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full py-3.5 bg-blue-500 text-white rounded-xl font-medium text-base disabled:opacity-30 active:bg-blue-600"
        >
          {submitting ? "追加中..." : "立て替えを追加する"}
        </button>
      </div>
    </div>
  );
}
