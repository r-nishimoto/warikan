"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/useGroup";
import { formatCurrency, formatNumberWithCommas, removeCommas } from "@/lib/utils";
import { Adjustment, Expense, PaymentMethod, PAYMENT_METHODS, RECEIVING_METHODS, RoundingUnit, ROUNDING_UNITS } from "@/lib/types";
import { calculateMemberShares, calculateSettlements } from "@/lib/settlement";

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const {
    group,
    loading,
    error,
    updateExpense,
    removeExpense,
    resetGroupExpenses,
    toggleSettlementCompleted,
  } = useGroup(id);

  // 共有URL
  const [urlCopied, setUrlCopied] = useState(false);

  // 精算
  const [roundingUnit, setRoundingUnit] = useState<RoundingUnit>(1);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 編集モード
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaidBy, setEditPaidBy] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("cash");
  const [editSplitAmong, setEditSplitAmong] = useState<string[]>([]);
  const [editExpenseDate, setEditExpenseDate] = useState("");
  const [editDescComposing, setEditDescComposing] = useState(false);

  // 調整（Edit form）
  type AdjustmentInput = { memberIds: string[]; amount: string; memo: string };
  const [editAdjustments, setEditAdjustments] = useState<AdjustmentInput[]>([]);
  const [showEditAdjustments, setShowEditAdjustments] = useState(false);

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditDesc(expense.description);
    setEditAmount(String(expense.amount));
    setEditPaidBy(expense.paidBy);
    setEditPaymentMethod(expense.paymentMethod);
    setEditSplitAmong([...expense.splitAmong]);
    setEditExpenseDate(expense.expenseDate || "");
    setEditAdjustments(
      expense.adjustments?.map((adj) => ({
        memberIds: [...adj.memberIds],
        amount: String(Math.abs(adj.amount)),
        memo: adj.memo || "",
      })) || []
    );
    setShowEditAdjustments((expense.adjustments?.length || 0) > 0);
  };

  const cancelEditing = () => setEditingId(null);

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

  const handleSaveEdit = useCallback(async () => {
    if (!group || !editingId) return;
    const numAmount = parseInt(editAmount, 10);
    if (!editDesc.trim() || !numAmount || !editPaidBy || editSplitAmong.length === 0) return;
    await updateExpense(editingId, {
      description: editDesc.trim(),
      amount: numAmount,
      paidBy: editPaidBy,
      paymentMethod: editPaymentMethod,
      splitAmong: editSplitAmong,
      expenseDate: editExpenseDate || undefined,
      date: Date.now(),
      adjustments: parseAdjustments(editAdjustments),
    });
    setEditingId(null);
  }, [group, editingId, editDesc, editAmount, editPaidBy, editPaymentMethod, editSplitAmong, editExpenseDate, editAdjustments, updateExpense]);

  const toggleEditSplitMember = (memberId: string) => {
    setEditSplitAmong((prev) => {
      const next = prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId];
      if (!next.includes(memberId)) {
        setEditAdjustments((prevAdj) =>
          prevAdj.map((adj) => ({
            ...adj,
            memberIds: adj.memberIds.filter((id) => next.includes(id)),
          })).filter((adj) => adj.memberIds.length > 0)
        );
      }
      return next;
    });
  };

  const groupUrl = group ? `${typeof window !== "undefined" ? window.location.origin : ""}/group/${group?.id}` : "";

  const handleCopyUrl = useCallback(async () => {
    if (!groupUrl) return;
    try {
      await navigator.clipboard.writeText(groupUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch { /* fallback */ }
  }, [groupUrl]);

  const handleShare = useCallback(async () => {
    if (!group) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Waroya: ${group.name}`,
          text: `「${group.name}」の割り勘グループに参加しよう`,
          url: groupUrl,
        });
      } else {
        await handleCopyUrl();
      }
    } catch { /* user cancelled */ }
  }, [group, groupUrl, handleCopyUrl]);

  if (loading) {
    return (
      <div className="p-6 pb-8">
        <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-6" />
        <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse mb-2" />
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-zinc-800 rounded-lg animate-pulse mb-6" />
        <div className="h-12 bg-zinc-800 rounded-xl animate-pulse mb-6" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="h-4 w-40 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="h-3 w-56 bg-zinc-800/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
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

  const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const isEditValid =
    editDesc.trim() &&
    parseInt(editAmount, 10) > 0 &&
    editPaidBy &&
    editSplitAmong.length > 0;

  // 精算計算
  const settlements = calculateSettlements(group.members, group.expenses, roundingUnit);
  const completedKeys = group.completedSettlements || [];
  const getMemberName = (memberId: string) =>
    group.members.find((m) => m.id === memberId)?.name || "不明";
  const getMemberReceivingMethod = (memberId: string) => {
    const member = group.members.find((m) => m.id === memberId);
    const method = member?.preferredReceivingMethod;
    if (!method || method === "any") return null;
    if (method === "other") return member?.customReceivingMethod || "その他";
    return RECEIVING_METHODS.find((m) => m.value === method)?.label || null;
  };
  const getSettlementKey = (from: string, to: string) => `${from}->${to}`;
  const allCompleted = settlements.length > 0 && settlements.every((s) =>
    completedKeys.includes(getSettlementKey(s.from, s.to))
  );

  const buildSettlementText = () => {
    const lines = [`【${group.name}】精算結果`, ""];
    if (roundingUnit > 1) {
      lines.push(`※${roundingUnit}円単位で端数切り上げ`);
      lines.push("");
    }
    settlements.forEach((s) => {
      const key = getSettlementKey(s.from, s.to);
      const done = completedKeys.includes(key);
      const receivingMethod = getMemberReceivingMethod(s.to);
      const methodSuffix = receivingMethod ? `（${receivingMethod}で）` : "";
      lines.push(
        `${done ? "✅ " : ""}${getMemberName(s.from)} → ${getMemberName(s.to)}：${formatCurrency(s.amount)}${methodSuffix}`
      );
    });
    return lines.join("\n");
  };

  const handleCopySettlementText = async () => {
    await navigator.clipboard.writeText(buildSettlementText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopySettlementUrl = async () => {
    const url = `${window.location.origin}/group/${group.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLineShare = () => {
    const text = buildSettlementText();
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-6 pb-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-400 text-sm">← ホーム</Link>
      </div>

      {/* グループ名 + メンバー表示 */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <Link
            href={`/group/${group.id}/edit`}
            className="p-2 text-zinc-500 hover:text-zinc-300 active:text-zinc-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Link>
        </div>
        <div className="flex items-center gap-1 mt-1">
          {group.members.slice(0, 6).map((member) => (
            <span
              key={member.id}
              className="w-6 h-6 rounded-full bg-zinc-700 text-zinc-300 text-[11px] font-medium flex items-center justify-center"
              title={member.name}
            >
              {member.name.charAt(0)}
            </span>
          ))}
          {group.members.length > 6 && (
            <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-500 text-[10px] font-medium flex items-center justify-center">
              +{group.members.length - 6}
            </span>
          )}
          {group.members.length === 0 && (
            <Link href={`/group/${group.id}/edit`} className="text-sm text-blue-400">
              メンバーを追加
            </Link>
          )}
        </div>
      </div>

      {/* 招待URL（折りたたみ） */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 min-w-0 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 truncate">
          {groupUrl}
        </div>
        <button
          onClick={handleCopyUrl}
          className="flex-shrink-0 px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium active:bg-zinc-700"
        >
          {urlCopied ? "✓" : "コピー"}
        </button>
        <button
          onClick={handleShare}
          className="flex-shrink-0 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium active:bg-blue-600"
        >
          共有
        </button>
      </div>

      {/* 立て替えを追加 CTA */}
      {group.members.length >= 2 && (
        <Link
          href={`/group/${group.id}/add-expense`}
          className="block w-full text-center py-3.5 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 mb-6"
        >
          立て替えを追加
        </Link>
      )}

      {/* 空状態ガイド */}
      {group.expenses.length === 0 && group.members.length >= 2 && (
        <div className="text-center py-8 mb-6">
          <p className="text-zinc-500 text-sm">まだ立て替えがありません</p>
        </div>
      )}

      {/* 支出一覧 */}
      {group.expenses.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold pl-3 border-l-4 border-blue-500">みんなの立て替え</h2>
            <span className="text-xs text-zinc-500">合計 {formatCurrency(totalExpenses)}</span>
          </div>
          <div className="space-y-2">
            {group.expenses
              .sort((a, b) => b.date - a.date)
              .map((expense) => {
                const payer = group.members.find((m) => m.id === expense.paidBy);
                const isEditing = editingId === expense.id;

                if (isEditing) {
                  return (
                    <div key={expense.id} className="bg-zinc-900 rounded-2xl border-2 border-blue-500 p-5 space-y-3">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onCompositionStart={() => setEditDescComposing(true)}
                        onCompositionEnd={() => setEditDescComposing(false)}
                        placeholder="内容"
                        className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-500"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNumberWithCommas(editAmount)}
                        onChange={(e) => {
                          const v = removeCommas(e.target.value).replace(/[^0-9]/g, "");
                          setEditAmount(v);
                        }}
                        placeholder="金額（円）"
                        className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-500"
                      />
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">日付（任意）</label>
                        <input
                          type="date"
                          value={editExpenseDate}
                          onChange={(e) => setEditExpenseDate(e.target.value)}
                          className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">誰が支払った？</label>
                        <select
                          value={editPaidBy}
                          onChange={(e) => setEditPaidBy(e.target.value)}
                          className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
                        >
                          <option value="">選択してください</option>
                          {group.members.map((member) => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">支払い方法</label>
                        <select
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>{method.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs text-zinc-500">誰で割り勘？</label>
                          <button
                            onClick={() => setEditSplitAmong(group.members.map((m) => m.id))}
                            className="text-xs text-blue-400 active:text-blue-300"
                          >
                            全員選択
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {group.members.map((member) => (
                            <button
                              key={member.id}
                              onClick={() => toggleEditSplitMember(member.id)}
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                editSplitAmong.includes(member.id)
                                  ? "bg-emerald-500 text-white border-emerald-500"
                                  : "bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700"
                              }`}
                            >
                              {member.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 割引・調整（編集） */}
                      {editSplitAmong.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowEditAdjustments(!showEditAdjustments)}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 active:text-zinc-400"
                          >
                            <span className={`transition-transform duration-150 ${showEditAdjustments ? "rotate-90" : ""}`}>▶</span>
                            割引・調整（任意）
                            {editAdjustments.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[10px]">
                                {editAdjustments.length}
                              </span>
                            )}
                          </button>

                          {showEditAdjustments && (
                            <div className="mt-3 space-y-3">
                              {editAdjustments.map((adj, index) => (
                                <div key={index} className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-zinc-500">調整 {index + 1}</span>
                                    <button
                                      onClick={() => setEditAdjustments((prev) => prev.filter((_, i) => i !== index))}
                                      className="text-xs text-rose-400 active:text-rose-300"
                                    >
                                      削除
                                    </button>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">対象メンバー</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {group.members
                                        .filter((m) => editSplitAmong.includes(m.id))
                                        .map((member) => (
                                          <button
                                            key={member.id}
                                            onClick={() => {
                                              setEditAdjustments((prev) =>
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
                                          setEditAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, amount: v } : a)));
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
                                      onChange={(e) => setEditAdjustments((prev) => prev.map((a, i) => (i === index ? { ...a, memo: e.target.value } : a)))}
                                      placeholder="例: ノンアル"
                                      className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-600"
                                    />
                                  </div>
                                </div>
                              ))}

                              <button
                                onClick={() => setEditAdjustments((prev) => [...prev, { memberIds: [], amount: "", memo: "" }])}
                                className="w-full py-2 border border-dashed border-zinc-700 text-zinc-500 rounded-xl text-sm active:bg-zinc-800"
                              >
                                + 調整を追加
                              </button>

                              {/* プレビュー */}
                              {editAdjustments.some((a) => a.memberIds.length > 0 && parseInt(a.amount, 10) > 0) &&
                                parseInt(editAmount, 10) > 0 &&
                                editSplitAmong.length > 0 && (
                                  <div className="bg-zinc-800/30 rounded-xl p-3">
                                    <p className="text-xs text-zinc-500 mb-2">調整後の1人あたり金額（目安）</p>
                                    <div className="space-y-1">
                                      {(() => {
                                        const tempExpense: Expense = {
                                          id: "preview",
                                          description: "",
                                          amount: parseInt(editAmount, 10),
                                          paidBy: "",
                                          paymentMethod: "cash",
                                          splitAmong: editSplitAmong,
                                          date: 0,
                                          adjustments: parseAdjustments(editAdjustments),
                                        };
                                        const shares = calculateMemberShares(tempExpense);
                                        return editSplitAmong.map((memberId) => {
                                          const member = group.members.find((m) => m.id === memberId);
                                          const share = shares.get(memberId) || 0;
                                          const baseShare = Math.round(parseInt(editAmount, 10) / editSplitAmong.length);
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

                      <div className="flex gap-2">
                        <button
                          onClick={cancelEditing}
                          className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 rounded-xl font-medium text-sm active:bg-zinc-800"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!isEditValid}
                          className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-30 active:bg-blue-600"
                        >
                          保存
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (window.confirm(`「${editDesc}」を本当に削除しますか？`)) {
                            removeExpense(expense.id);
                            cancelEditing();
                          }
                        }}
                        className="w-full py-2 text-xs text-rose-400 active:text-rose-300"
                      >
                        この支出を削除する
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={expense.id}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center justify-between cursor-pointer active:bg-zinc-800"
                    onClick={() => startEditing(expense)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate">{expense.description}</span>
                        <svg className="w-3 h-3 text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {expense.expenseDate && `${expense.expenseDate} ・ `}
                        {payer?.name || "不明"}が立て替え ・{" "}
                        {PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod)?.label || "現金"}
                        {expense.adjustments && expense.adjustments.length > 0 && (
                          <span className="text-orange-400"> ・ 調整あり</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {expense.splitAmong.map((memberId) => {
                          const member = group.members.find((m) => m.id === memberId);
                          const initial = member?.name?.charAt(0) || "?";
                          return (
                            <span
                              key={memberId}
                              className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-[10px] font-medium flex items-center justify-center"
                              title={member?.name}
                            >
                              {initial}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <span className="font-semibold text-sm flex-shrink-0 ml-3">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 端数処理（精算の上に配置） */}
      {group.expenses.length > 0 && group.members.length >= 2 && (
        <div className="mb-4">
          <label className="block text-xs text-zinc-500 mb-2">端数処理</label>
          <div className="flex rounded-xl overflow-hidden border border-zinc-800">
            {ROUNDING_UNITS.map((unit) => (
              <button
                key={unit.value}
                onClick={() => setRoundingUnit(unit.value)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  roundingUnit === unit.value
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900 text-zinc-400 active:bg-zinc-800"
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 精算方法（同一ページ表示） */}
      {group.expenses.length > 0 && group.members.length >= 2 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold pl-3 border-l-4 border-blue-500">精算方法</h2>
            <button
              onClick={handleCopySettlementText}
              className="text-xs text-blue-400 active:text-blue-300"
            >
              {copiedText ? "✓ コピー済み" : "共有用にコピー"}
            </button>
          </div>

          {allCompleted && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3 text-center">
              <p className="text-emerald-400 font-medium text-sm">すべての精算が完了しました</p>
            </div>
          )}

          {settlements.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4 text-center">精算の必要はありません</p>
          ) : (
            <div className="space-y-2">
              {settlements.map((s, i) => {
                const key = getSettlementKey(s.from, s.to);
                const isCompleted = completedKeys.includes(key);
                const receivingMethod = getMemberReceivingMethod(s.to);
                return (
                  <div
                    key={i}
                    className={`rounded-xl p-4 flex items-center gap-3 transition-colors ${
                      isCompleted
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-zinc-900 border border-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => toggleSettlementCompleted(key)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-zinc-600 text-transparent hover:border-zinc-500"
                      }`}
                    >
                      <span className="text-xs">✓</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center gap-1.5 text-sm ${isCompleted ? "line-through opacity-60" : ""}`}>
                        <span className="font-semibold">{getMemberName(s.from)}</span>
                        <span className="text-zinc-500">→</span>
                        <span className="font-semibold">{getMemberName(s.to)}</span>
                      </div>
                      {receivingMethod && (
                        <span className="text-[11px] text-blue-400">{receivingMethod}で受取希望</span>
                      )}
                    </div>
                    <span className={`font-bold text-sm ${isCompleted ? "line-through opacity-60" : ""}`}>
                      {formatCurrency(s.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 明細・共有ボタン */}
          {settlements.length > 0 && (
            <div className="mt-4 space-y-2">
              <Link
                href={`/group/${group.id}/detail`}
                className="block w-full text-center py-2.5 border border-zinc-800 text-zinc-400 rounded-xl font-medium text-sm active:bg-zinc-800"
              >
                明細を見る
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={handleCopySettlementUrl}
                  className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-medium text-xs active:bg-zinc-700"
                >
                  {copiedUrl ? "✓ コピー済み" : "URLをコピー"}
                </button>
                <button
                  onClick={handleLineShare}
                  className="flex-1 py-2.5 bg-[#06C755] text-white rounded-xl font-medium text-xs active:opacity-80 flex items-center justify-center gap-1.5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINEで送る
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* リセットボタン */}
      {group.expenses.length > 0 && (
        <button
          onClick={() => {
            if (window.confirm("支出をすべて削除してグループをリセットしますか？\nメンバーはそのまま残ります。")) {
              resetGroupExpenses();
            }
          }}
          className="block w-full text-center py-3 border border-orange-500/30 text-orange-400 rounded-xl font-medium text-sm active:bg-orange-500/10"
        >
          精算をリセット（メンバーを残す）
        </button>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        支払い回数を最小化して計算しています
      </p>
    </div>
  );
}
