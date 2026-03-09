"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useGroups } from "@/lib/useGroups";
import { formatCurrency } from "@/lib/utils";
import { LandingContent } from "@/components/LandingContent";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import Link from "next/link";

export default function Home() {
  const { groups, loading, deleteGroup, reorderGroups } = useGroups();

  // 削除確認モーダル
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ドラッグ&ドロップ状態
  const [dragging, setDragging] = useState(false);
  const dragIdRef = useRef<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);
  const lastSwapTime = useRef(0);

  // ドラッグ開始
  const handleDragStart = useCallback((groupId: string) => {
    dragIdRef.current = groupId;
    setDragging(true);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, groupId: string) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      handleDragStart(groupId);
    }, 300);
  }, [handleDragStart]);

  const trySwap = useCallback((clientY: number) => {
    const list = listRef.current;
    const dragId = dragIdRef.current;
    if (!list || !dragId) return;

    const now = Date.now();
    if (now - lastSwapTime.current < 150) return;

    const children = Array.from(list.children) as HTMLElement[];
    const dragIdx = groups.findIndex((g) => g.id === dragId);
    if (dragIdx === -1) return;

    const dragRect = children[dragIdx]?.getBoundingClientRect();
    if (!dragRect) return;

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

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) {
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

  const handleDrop = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    dragIdRef.current = null;
    setDragging(false);
  }, []);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    dragIdRef.current = null;
    setDragging(false);
  }, []);

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
      {/* ヒーロー */}
      <div className="flex flex-col items-center py-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M20 4c8.837 0 16 7.163 16 16s-7.163 16-16 16" stroke="#a1a1aa" strokeWidth="3" strokeLinecap="round" fill="none" />
            <line x1="20" y1="8" x2="20" y2="32" stroke="#52525b" strokeWidth="2" strokeDasharray="3 3" />
            <text x="11" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ffffff">¥</text>
            <text x="29" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#a1a1aa">¥</text>
          </svg>
          <h1 className="text-3xl font-bold text-white">Waroya</h1>
        </div>
        <p className="text-zinc-500 text-sm">みんなでサクッと割り勘</p>
      </div>

      {/* メインCTA */}
      <Link
        href="/new"
        className="block w-full text-center py-4 bg-blue-500 text-white rounded-xl font-medium text-base active:bg-blue-600 mb-8"
      >
        はじめる
      </Link>

      {/* グループ一覧 */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse mb-2" />
              <div className="flex gap-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="w-5 h-5 rounded-full bg-zinc-800 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">最近のグループ</h2>
          <div ref={listRef} className="flex flex-col gap-2">
            {groups.map((group) => {
              const isDragging = dragging && dragIdRef.current === group.id;

              return (
                <div
                  key={group.id}
                  className={`bg-zinc-900 rounded-xl border p-4 select-none transition-all duration-150 ${
                    isDragging
                      ? "border-blue-400 scale-[0.95] shadow-lg shadow-blue-500/20 opacity-80"
                      : "border-zinc-800"
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, group.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDrop}
                  onTouchCancel={handleTouchCancel}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 text-zinc-600 cursor-grab active:cursor-grabbing pr-2 touch-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleDragStart(group.id);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
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
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-bold truncate">{group.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {group.members.slice(0, 5).map((member) => (
                              <span
                                key={member.id}
                                className="w-5 h-5 rounded-full bg-zinc-700 text-zinc-300 text-[10px] font-medium flex items-center justify-center"
                                title={member.name}
                              >
                                {member.name.charAt(0)}
                              </span>
                            ))}
                            {group.members.length > 5 && (
                              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-500 text-[9px] font-medium flex items-center justify-center">
                                +{group.members.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-sm font-semibold">
                            {formatCurrency(group.expenses.reduce((sum, e) => sum + e.amount, 0))}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {group.expenses.length}件
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => setDeleteTarget({ id: group.id, name: group.name })}
                      aria-label={`${group.name}を削除`}
                      className="ml-1 w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-rose-400 active:text-rose-400 flex-shrink-0 rounded-lg"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 区切り線 */}
      <div className="relative my-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#09090b] px-3 text-xs text-zinc-600">Waroya とは</span>
        </div>
      </div>

      {/* LP */}
      <LandingContent />

      {/* マウスドラッグ用グローバルイベント */}
      {dragging && (
        <div
          className="fixed inset-0 z-50 cursor-grabbing"
          onMouseMove={(e) => trySwap(e.clientY)}
          onMouseUp={handleDrop}
        />
      )}

      {/* 削除確認モーダル */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`「${deleteTarget?.name}」を削除しますか？`}
        description="グループとすべての支出データが削除されます。この操作は元に戻せません。"
        confirmLabel="削除する"
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteGroup(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
