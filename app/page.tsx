"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGroups } from "@/lib/useGroups";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  const [name, setName] = useState("");
  const [composing, setComposing] = useState(false);
  const router = useRouter();
  const { groups, loading, addGroup, deleteGroup, reorderGroups } = useGroups();

  // ドラッグ&ドロップ状態
  const [dragging, setDragging] = useState(false);
  const dragIdRef = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  // 最後にswapした時刻（連続swap防止）
  const lastSwapTime = useRef(0);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (groups.some((g) => g.name === trimmed)) {
      alert("同じ名前のグループがすでにあります");
      return;
    }
    const group = await addGroup(trimmed);
    setName("");
    router.push(`/group/${group.id}`);
  };

  // ドラッグ開始
  const handleDragStart = useCallback((groupId: string) => {
    dragIdRef.current = groupId;
    setDragging(true);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent, groupId: string) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      handleDragStart(groupId);
    }, 300);
  }, [handleDragStart]);

  // 隣接アイテムとswap
  const trySwap = useCallback((clientY: number) => {
    const list = listRef.current;
    const dragId = dragIdRef.current;
    if (!list || !dragId) return;

    // 連続swap防止（150ms間隔）
    const now = Date.now();
    if (now - lastSwapTime.current < 150) return;

    const children = Array.from(list.children) as HTMLElement[];
    const dragIdx = groups.findIndex((g) => g.id === dragId);
    if (dragIdx === -1) return;

    const dragRect = children[dragIdx]?.getBoundingClientRect();
    if (!dragRect) return;

    const dragMidY = dragRect.top + dragRect.height / 2;

    // 上のアイテムとswap: タッチが上のアイテムの中央より上にある
    if (dragIdx > 0) {
      const aboveRect = children[dragIdx - 1]?.getBoundingClientRect();
      if (aboveRect && clientY < aboveRect.top + aboveRect.height / 2) {
        const newIds = groups.map((g) => g.id);
        [newIds[dragIdx - 1], newIds[dragIdx]] = [newIds[dragIdx], newIds[dragIdx - 1]];
        reorderGroups(newIds);
        lastSwapTime.current = now;
        if (navigator.vibrate) navigator.vibrate(15);
        return;
      }
    }

    // 下のアイテムとswap: タッチが下のアイテムの中央より下にある
    if (dragIdx < groups.length - 1) {
      const belowRect = children[dragIdx + 1]?.getBoundingClientRect();
      if (belowRect && clientY > belowRect.top + belowRect.height / 2) {
        const newIds = groups.map((g) => g.id);
        [newIds[dragIdx], newIds[dragIdx + 1]] = [newIds[dragIdx + 1], newIds[dragIdx]];
        reorderGroups(newIds);
        lastSwapTime.current = now;
        if (navigator.vibrate) navigator.vibrate(15);
        return;
      }
    }
  }, [groups, reorderGroups]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) {
      // 長押し前にスクロールしたらキャンセル
      if (longPressTimer.current) {
        const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
        const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
        if (dy > 10 || dx > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    e.preventDefault();
    trySwap(e.touches[0].clientY);
  }, [dragging, trySwap]);

  // ドロップ
  const handleDrop = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    dragIdRef.current = null;
    setDragging(false);
  }, []);

  // タッチキャンセル
  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    dragIdRef.current = null;
    setDragging(false);
  }, []);

  // ドラッグ中のスクロール完全防止
  useEffect(() => {
    if (!dragging) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    const prevent = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.overflow = "";
      html.style.overflow = "";
      window.scrollTo(0, scrollY);
      document.removeEventListener("touchmove", prevent);
    };
  }, [dragging]);

  return (
    <div className="p-6">
      <div className="flex flex-col items-center py-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* 左半円（コイン左） */}
            <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16" stroke="url(#grad1)" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* 右半円（コイン右） */}
            <path d="M20 4c8.837 0 16 7.163 16 16s-7.163 16-16 16" stroke="url(#grad2)" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* 分割線 */}
            <line x1="20" y1="8" x2="20" y2="32" stroke="#52525b" strokeWidth="2" strokeDasharray="3 3" />
            {/* 左の¥ */}
            <text x="11" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#60a5fa">¥</text>
            {/* 右の¥ */}
            <text x="29" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#22d3ee">¥</text>
            <defs>
              <linearGradient id="grad1" x1="4" y1="20" x2="20" y2="20">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="grad2" x1="20" y1="20" x2="36" y2="20">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Waroya</h1>
        </div>
        <p className="text-zinc-500 text-sm">割り勘をもっとスムーズに</p>
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
          <div ref={listRef} className="flex flex-col gap-3">
            {groups.map((group) => {
              const isDragging = dragging && dragIdRef.current === group.id;

              return (
                <div
                  key={group.id}
                  className={`bg-zinc-900 rounded-2xl border p-5 select-none transition-all duration-150 ${
                    isDragging
                      ? "border-blue-400 scale-[0.95] shadow-lg shadow-blue-500/20 opacity-80"
                      : dragging
                      ? "border-zinc-800"
                      : "border-zinc-800"
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, group.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDrop}
                  onTouchCancel={handleTouchCancel}
                >
                  <div className="flex items-center justify-between">
                    {/* ドラッグハンドル */}
                    <div
                      className="flex items-center gap-3 text-zinc-600 cursor-grab active:cursor-grabbing pr-2 touch-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleDragStart(group.id);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
                        <circle cx="5" cy="3" r="1.5" />
                        <circle cx="11" cy="3" r="1.5" />
                        <circle cx="5" cy="8" r="1.5" />
                        <circle cx="11" cy="8" r="1.5" />
                        <circle cx="5" cy="13" r="1.5" />
                        <circle cx="11" cy="13" r="1.5" />
                      </svg>
                    </div>
                    <Link
                      href={`/group/${group.id}`}
                      className="flex-1 min-w-0"
                      onClick={(e) => {
                        if (dragging) e.preventDefault();
                      }}
                    >
                      <div className="text-lg font-bold truncate mb-1">{group.name}</div>
                      <div className="flex items-center gap-1 mb-1">
                        {group.members.map((member) => (
                          <span
                            key={member.id}
                            className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-[10px] font-medium flex items-center justify-center"
                            title={member.name}
                          >
                            {member.name.charAt(0)}
                          </span>
                        ))}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {group.expenses.length}件の支出 ・ {formatCurrency(group.expenses.reduce((sum, e) => sum + e.amount, 0))}
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
              );
            })}
          </div>
        </div>
      ) : null}

      {/* マウスドラッグ用グローバルイベント */}
      {dragging && (
        <div
          className="fixed inset-0 z-50 cursor-grabbing"
          onMouseMove={(e) => trySwap(e.clientY)}
          onMouseUp={handleDrop}
        />
      )}
    </div>
  );
}
