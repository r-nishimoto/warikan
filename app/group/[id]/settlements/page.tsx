"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { calculateSettlements } from "@/lib/settlement";
import { formatCurrency } from "@/lib/utils";
import { RoundingUnit, ROUNDING_UNITS } from "@/lib/types";

export default function SettlementsPage() {
  const { id } = useParams<{ id: string }>();
  const { getGroup, toggleSettlementCompleted } = useStore();
  const group = getGroup(id);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [roundingUnit, setRoundingUnit] = useState<RoundingUnit>(1);

  if (!group) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-gray-400 mb-4">グループが見つかりません</p>
        <Link href="/" className="text-blue-500">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const settlements = calculateSettlements(group.members, group.expenses, roundingUnit);
  const completedKeys = group.completedSettlements || [];
  const getMemberName = (memberId: string) =>
    group.members.find((m) => m.id === memberId)?.name || "不明";

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
      lines.push(
        `${done ? "✅ " : ""}${getMemberName(s.from)} → ${getMemberName(s.to)}：${formatCurrency(s.amount)}`
      );
    });
    return lines.join("\n");
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(buildSettlementText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLineShare = () => {
    const text = buildSettlementText();
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link href={`/group/${group.id}`} className="text-blue-500 text-sm">
          ← 戻る
        </Link>
      </div>

      <h1 className="text-xl font-bold mb-2">精算結果</h1>
      <p className="text-gray-400 text-sm mb-6">{group.name}</p>

      {/* 端数処理の選択 */}
      <div className="mb-6">
        <label className="block text-xs text-gray-500 mb-2">端数処理</label>
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          {ROUNDING_UNITS.map((unit) => (
            <button
              key={unit.value}
              onClick={() => setRoundingUnit(unit.value)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                roundingUnit === unit.value
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 active:bg-gray-50"
              }`}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>

      {settlements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">精算の必要はありません</p>
        </div>
      ) : (
        <>
          {allCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-center">
              <p className="text-green-600 font-medium">🎉 すべての精算が完了しました！</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {settlements.map((s, i) => {
              const key = getSettlementKey(s.from, s.to);
              const isCompleted = completedKeys.includes(key);
              return (
                <div
                  key={i}
                  className={`rounded-2xl shadow-sm p-5 flex items-center gap-4 transition-colors ${
                    isCompleted
                      ? "bg-green-50 border border-green-200"
                      : "bg-white"
                  }`}
                >
                  <button
                    onClick={() => toggleSettlementCompleted(group.id, key)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-transparent hover:border-gray-400"
                    }`}
                  >
                    ✓
                  </button>
                  <div className="flex-1">
                    <div className={`flex items-center gap-2 text-base ${isCompleted ? "line-through opacity-60" : ""}`}>
                      <span className="font-semibold text-red-500">
                        {getMemberName(s.from)}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-semibold text-green-600">
                        {getMemberName(s.to)}
                      </span>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isCompleted ? "line-through opacity-60" : ""}`}>
                    {formatCurrency(s.amount)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={handleCopyText}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm active:bg-blue-600"
              >
                {copiedText ? "コピーしました!" : "精算結果をコピー"}
              </button>
              <button
                onClick={handleCopyUrl}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200"
              >
                {copiedUrl ? "コピーしました!" : "URLをコピー"}
              </button>
            </div>
            <button
              onClick={handleLineShare}
              className="w-full py-3 bg-[#06C755] text-white rounded-xl font-medium text-sm active:opacity-80 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              LINEで送る
            </button>
          </div>
        </>
      )}

      <div className="mt-8 text-center text-xs text-gray-300">
        支払い回数を最小化して計算しています
      </div>
    </div>
  );
}
