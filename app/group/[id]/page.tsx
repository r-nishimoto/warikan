"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/useGroup";
import { formatCurrency, formatNumberWithCommas, removeCommas } from "@/lib/utils";
import { Expense, PaymentMethod, PAYMENT_METHODS, ReceivingMethod, RECEIVING_METHODS } from "@/lib/types";

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const {
    group,
    loading,
    error,
    addMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
    resetGroupExpenses,
    updateMemberPreference,
    updateGroupName,
  } = useGroup(id);

  // グループ名編集
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupNameComposing, setGroupNameComposing] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberComposing, setMemberComposing] = useState(false);
  const [copied, setCopied] = useState(false);

  // 支出フォーム
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [splitAmong, setSplitAmong] = useState<string[]>([]);
  const [expenseDate, setExpenseDate] = useState("");
  const [descComposing, setDescComposing] = useState(false);
  const [memberError, setMemberError] = useState("");

  // 編集モード
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaidBy, setEditPaidBy] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>("cash");
  const [editSplitAmong, setEditSplitAmong] = useState<string[]>([]);
  const [editExpenseDate, setEditExpenseDate] = useState("");
  const [editDescComposing, setEditDescComposing] = useState(false);

  const startEditing = (expense: Expense) => {
    setEditingId(expense.id);
    setEditDesc(expense.description);
    setEditAmount(String(expense.amount));
    setEditPaidBy(expense.paidBy);
    setEditPaymentMethod(expense.paymentMethod);
    setEditSplitAmong([...expense.splitAmong]);
    setEditExpenseDate(expense.expenseDate || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleSaveEdit = useCallback(async () => {
    if (!group || !editingId) return;
    const numAmount = parseInt(editAmount, 10);
    if (!editDesc.trim() || !numAmount || !editPaidBy || editSplitAmong.length === 0)
      return;
    await updateExpense(editingId, {
      description: editDesc.trim(),
      amount: numAmount,
      paidBy: editPaidBy,
      paymentMethod: editPaymentMethod,
      splitAmong: editSplitAmong,
      expenseDate: editExpenseDate || undefined,
      date: Date.now(),
    });
    setEditingId(null);
  }, [group, editingId, editDesc, editAmount, editPaidBy, editPaymentMethod, editSplitAmong, editExpenseDate, updateExpense]);

  const toggleEditSplitMember = (memberId: string) => {
    setEditSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

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

  const handleShare = useCallback(async () => {
    if (!group) return;
    const url = `${window.location.origin}/group/${group.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `Waroya: ${group.name}`,
          text: `「${group.name}」の割り勘グループに参加しよう`,
          url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled share dialog
    }
  }, [group]);

  const handleAddExpense = useCallback(async () => {
    if (!group) return;
    const numAmount = parseInt(amount, 10);
    if (!description.trim() || !numAmount || !paidBy || splitAmong.length === 0)
      return;
    await addExpense({
      description: description.trim(),
      amount: numAmount,
      paidBy,
      paymentMethod,
      splitAmong,
      expenseDate: expenseDate || undefined,
      date: Date.now(),
    });
    setDescription("");
    setAmount("");
    setPaidBy("");
    setPaymentMethod("cash");
    setExpenseDate("");
    setSplitAmong([]);
  }, [group, description, amount, paidBy, paymentMethod, splitAmong, expenseDate, addExpense]);

  const toggleSplitMember = (memberId: string) => {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (!group) return;
    setSplitAmong(group.members.map((m) => m.id));
  };

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
        <Link href="/" className="text-blue-400">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const totalExpenses = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  const isExpenseValid =
    description.trim() &&
    parseInt(amount, 10) > 0 &&
    paidBy &&
    splitAmong.length > 0;
  const isEditValid =
    editDesc.trim() &&
    parseInt(editAmount, 10) > 0 &&
    editPaidBy &&
    editSplitAmong.length > 0;

  return (
    <div className="p-6 pb-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-blue-400 text-sm">
          ← グループ作成画面に戻る
        </Link>
        <button
          onClick={handleShare}
          className="text-sm px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg active:bg-blue-500/20"
        >
          {copied ? "コピーしました!" : "グループに招待する"}
        </button>
      </div>

      {editingGroupName ? (
        <div className="mb-1 space-y-2">
          <input
            type="text"
            value={groupNameInput}
            onChange={(e) => setGroupNameInput(e.target.value)}
            onCompositionStart={() => setGroupNameComposing(true)}
            onCompositionEnd={() => setGroupNameComposing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !groupNameComposing) {
                if (groupNameInput.trim()) {
                  updateGroupName(groupNameInput.trim());
                }
                setEditingGroupName(false);
              }
              if (e.key === "Escape") setEditingGroupName(false);
            }}
            autoFocus
            className="w-full px-3 py-2 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-bold"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setEditingGroupName(false)}
              className="flex-1 py-2 border border-zinc-700 text-zinc-400 rounded-xl font-medium text-sm active:bg-zinc-800"
            >
              キャンセル
            </button>
            <button
              onClick={() => {
                if (groupNameInput.trim()) {
                  updateGroupName(groupNameInput.trim());
                }
                setEditingGroupName(false);
              }}
              disabled={!groupNameInput.trim()}
              className="flex-1 py-2 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-30 active:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      ) : (
        <h1
          className="text-2xl font-bold mb-1 flex items-center gap-2 cursor-pointer group"
          onClick={() => {
            setGroupNameInput(group.name);
            setEditingGroupName(true);
          }}
        >
          {group.name}
          <span className="text-zinc-600 group-hover:text-zinc-500 text-sm font-normal">✏️</span>
        </h1>
      )}
      <p className="text-zinc-500 text-sm mb-6">
        合計: {formatCurrency(totalExpenses)}
      </p>

      {/* メンバー */}
      <section className="mb-8">
        <h2 className="text-base font-semibold mb-3">メンバー</h2>
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
            placeholder="名前を入力"
            className="flex-1 px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-500"
          />
          <button
            onClick={handleAddMember}
            disabled={!memberName.trim()}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-30"
          >
            追加
          </button>
        </div>
        {memberError && (
          <p className="text-rose-400 text-xs mb-2">{memberError}</p>
        )}
        {group.members.length === 0 ? (
          <p className="text-zinc-600 text-sm">メンバーを追加してください</p>
        ) : (
          <div className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-zinc-800/50 rounded-xl px-3 py-2"
              >
                <span className="text-sm font-medium flex-shrink-0">{member.name}</span>
                <select
                  value={member.preferredReceivingMethod || "any"}
                  onChange={(e) => updateMemberPreference(member.id, e.target.value as ReceivingMethod)}
                  className="flex-1 text-xs px-2 py-1 border border-zinc-700 rounded-lg bg-zinc-800 appearance-none text-zinc-500"
                >
                  {RECEIVING_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      受取: {m.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeMember(member.id)}
                  className="text-zinc-500 hover:text-rose-400 text-sm flex-shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 支出追加フォーム（インライン） */}
      {group.members.length >= 2 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3">支出を追加</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-4">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onCompositionStart={() => setDescComposing(true)}
              onCompositionEnd={() => setDescComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !descComposing && isExpenseValid)
                  handleAddExpense();
              }}
              placeholder="内容（例: 居酒屋での夕食）"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-500"
            />
            <input
              type="text"
              inputMode="numeric"
              value={formatNumberWithCommas(amount)}
              onChange={(e) => {
                const v = removeCommas(e.target.value).replace(/[^0-9]/g, "");
                setAmount(v);
              }}
              placeholder="金額（円）"
              className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-zinc-500"
            />
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                日付（任意）
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                誰が支払った？
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
              >
                <option value="">選択してください</option>
                {group.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">
                支払い方法
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-zinc-500">誰で割り勘？</label>
                <button
                  onClick={selectAllMembers}
                  className="text-xs text-blue-400 active:text-blue-300"
                >
                  全員選択
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleSplitMember(member.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
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
            <button
              onClick={handleAddExpense}
              disabled={!isExpenseValid}
              className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-30 active:bg-blue-600"
            >
              支出を追加する
            </button>
          </div>
        </section>
      )}

      {/* 支出一覧 */}
      {group.expenses.length > 0 && (
        <section className="mb-8">
          <h2 className="text-base font-semibold mb-3">支出一覧</h2>
          <div className="space-y-2">
            {group.expenses
              .sort((a, b) => b.date - a.date)
              .map((expense) => {
                const payer = group.members.find(
                  (m) => m.id === expense.paidBy
                );
                const isEditing = editingId === expense.id;

                if (isEditing) {
                  return (
                    <div
                      key={expense.id}
                      className="bg-zinc-900 rounded-2xl border-2 border-blue-500 p-5 space-y-3"
                    >
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
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          日付（任意）
                        </label>
                        <input
                          type="date"
                          value={editExpenseDate}
                          onChange={(e) => setEditExpenseDate(e.target.value)}
                          className="w-full px-4 py-2.5 border border-zinc-700 bg-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          誰が支払った？
                        </label>
                        <select
                          value={editPaidBy}
                          onChange={(e) => setEditPaidBy(e.target.value)}
                          className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
                        >
                          <option value="">選択してください</option>
                          {group.members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1.5">
                          支払い方法
                        </label>
                        <select
                          value={editPaymentMethod}
                          onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-zinc-800 appearance-none"
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
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
                      <div className="font-medium text-sm truncate">
                        {expense.description}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {expense.expenseDate && `${expense.expenseDate} ・ `}
                        {payer?.name || "不明"} が支払い ・{" "}
                        {PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod)?.label || "現金"} ・{" "}
                        {expense.splitAmong.length}人で分割
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm">
                        {formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`「${expense.description}」を本当に削除しますか？`)) {
                            removeExpense(expense.id);
                          }
                        }}
                        className="px-2 py-1 text-xs text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/10"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* 精算結果へのリンク */}
      {group.expenses.length > 0 && group.members.length >= 2 && (
        <Link
          href={`/group/${group.id}/settlements`}
          className="block w-full text-center py-3 bg-emerald-500 text-white rounded-xl font-medium active:bg-emerald-600 mb-3"
        >
          精算結果画面を見る
        </Link>
      )}

      {/* グループリセットボタン */}
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
    </div>
  );
}
