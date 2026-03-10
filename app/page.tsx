"use client";

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { useGroups } from "@/lib/useGroups";
import { formatCurrency } from "@/lib/utils";
import { LandingContent } from "@/components/LandingContent";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function Home() {
  const { groups, loading, deleteGroup, reorderGroups } = useGroups();

  // 削除確認モーダル
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ドラッグ&ドロップ状態
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const draggedElRef = useRef<HTMLDivElement | null>(null);
  const prevDraggedElRef = useRef<HTMLDivElement | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const cardHeightRef = useRef(0);
  const lastTargetRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dragging = dragIndex !== null;

  // ドラッグ開始
  const startDrag = useCallback((index: number, startY: number) => {
    const list = listRef.current;
    if (!list) return;
    const children = Array.from(list.children) as HTMLDivElement[];
    const rect = children[index]?.getBoundingClientRect();
    const gap = 8; // gap-2
    cardHeightRef.current = (rect?.height || 0) + gap;
    draggedElRef.current = children[index];
    touchStartY.current = startY;
    lastTargetRef.current = index;
    setDragIndex(index);
    setTargetIndex(index);
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => {
      startDrag(index, e.touches[0].clientY);
    }, 300);
  }, [startDrag]);

  // ドラッグ位置更新（指追従 + ターゲット計算）
  const updateDragPosition = useCallback((clientY: number) => {
    if (dragIndex === null) return;
    const offsetY = clientY - touchStartY.current;

    // ドラッグ中のカードを指に追従（直接DOM操作で60fps）
    if (draggedElRef.current) {
      draggedElRef.current.style.transform = `translateY(${offsetY}px) scale(1.03)`;
    }

    // ターゲット位置を計算
    let newTarget = dragIndex + Math.round(offsetY / cardHeightRef.current);
    newTarget = Math.max(0, Math.min(groups.length - 1, newTarget));

    if (newTarget !== lastTargetRef.current) {
      lastTargetRef.current = newTarget;
      setTargetIndex(newTarget);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [dragIndex, groups.length]);

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
    updateDragPosition(e.touches[0].clientY);
  }, [dragging, updateDragPosition]);

  const handleDrop = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // useLayoutEffectでDOM更新後にtransformを消すためにrefを退避
    prevDraggedElRef.current = draggedElRef.current;
    draggedElRef.current = null;

    // 位置が変わった場合のみ並び替え
    if (dragIndex !== null && targetIndex !== null && dragIndex !== targetIndex) {
      const newIds = groups.map((g) => g.id);
      const [moved] = newIds.splice(dragIndex, 1);
      newIds.splice(targetIndex, 0, moved);
      reorderGroups(newIds);
    }

    setDragIndex(null);
    setTargetIndex(null);
    lastTargetRef.current = null;
  }, [dragIndex, targetIndex, groups, reorderGroups]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (draggedElRef.current) {
      draggedElRef.current.style.transform = "";
      draggedElRef.current = null;
    }
    setDragIndex(null);
    setTargetIndex(null);
    lastTargetRef.current = null;
  }, []);

  // カードシフトスタイル計算
  const getCardShiftStyle = (i: number): React.CSSProperties => {
    if (dragIndex === null || targetIndex === null) return {};
    if (i === dragIndex) {
      return { position: "relative", zIndex: 50 };
    }
    const shift = cardHeightRef.current;
    let translateY = 0;
    if (dragIndex < targetIndex) {
      if (i > dragIndex && i <= targetIndex) translateY = -shift;
    } else if (dragIndex > targetIndex) {
      if (i >= targetIndex && i < dragIndex) translateY = shift;
    }
    return {
      transform: `translateY(${translateY}px)`,
      transition: "transform 200ms cubic-bezier(0.25, 1, 0.5, 1)",
    };
  };

  // ドラッグ中のスクロールロック
  useEffect(() => {
    if (dragIndex === null) return;

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
  }, [dragIndex]);

  // DOM更新後にドラッグカードのtransformをクリア（フラッシュ防止）
  useLayoutEffect(() => {
    if (dragIndex === null && prevDraggedElRef.current) {
      prevDraggedElRef.current.style.transform = "";
      prevDraggedElRef.current = null;
    }
  }, [dragIndex]);

  return (
    <div className="p-6">
      {/* ヒーロー */}
      <div className="flex flex-col items-center py-8">
        <div className="flex items-center gap-3 mb-2">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4C11.163 4 4 11.163 4 20s7.163 16 16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M20 4c8.837 0 16 7.163 16 16s-7.163 16-16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
            <line x1="20" y1="8" x2="20" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" opacity="0.3" />
            <text x="11" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">¥</text>
            <text x="29" y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor" opacity="0.4">¥</text>
          </svg>
          <h1 className="text-3xl font-bold text-on-surface">Waroya</h1>
          <ThemeToggle />
        </div>
        <p className="text-on-surface-tertiary text-sm">みんなでサクッと割り勘</p>
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
          <div className="h-4 w-28 bg-surface-tertiary rounded animate-pulse mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-secondary rounded-xl border border-border-default p-4">
              <div className="h-4 w-32 bg-surface-tertiary rounded animate-pulse mb-2" />
              <div className="flex gap-1">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="w-5 h-5 rounded-full bg-surface-tertiary animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-on-surface-secondary mb-3">最近のグループ</h2>
          <div ref={listRef} className="flex flex-col gap-2">
            {groups.map((group, index) => {
              const isDragging = dragIndex === index;

              return (
                <div
                  key={group.id}
                  style={getCardShiftStyle(index)}
                  className={`bg-surface-secondary rounded-xl border p-4 select-none ${
                    isDragging
                      ? "border-blue-400 shadow-xl shadow-blue-500/25 will-change-transform"
                      : dragging
                        ? "border-border-default will-change-transform"
                        : "border-border-default"
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleDrop}
                  onTouchCancel={handleTouchCancel}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 text-on-surface-faint cursor-grab active:cursor-grabbing pr-2 touch-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        touchStartY.current = e.clientY;
                        startDrag(index, e.clientY);
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
                                className="w-5 h-5 rounded-full bg-border-secondary text-on-surface-secondary text-[10px] font-medium flex items-center justify-center"
                                title={member.name}
                              >
                                {member.name.charAt(0)}
                              </span>
                            ))}
                            {group.members.length > 5 && (
                              <span className="w-5 h-5 rounded-full bg-surface-tertiary text-on-surface-tertiary text-[9px] font-medium flex items-center justify-center">
                                +{group.members.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className="text-sm font-semibold">
                            {formatCurrency(group.expenses.reduce((sum, e) => sum + e.amount, 0))}
                          </div>
                          <div className="text-[11px] text-on-surface-tertiary">
                            {group.expenses.length}件
                          </div>
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => setDeleteTarget({ id: group.id, name: group.name })}
                      aria-label={`${group.name}を削除`}
                      className="ml-1 w-10 h-10 flex items-center justify-center text-on-surface-faint hover:text-rose-400 active:text-rose-400 flex-shrink-0 rounded-lg"
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
          <div className="w-full border-t border-border-default" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-surface px-3 text-xs text-on-surface-faint">Waroya とは</span>
        </div>
      </div>

      {/* LP */}
      <LandingContent />

      {/* マウスドラッグ用グローバルイベント */}
      {dragging && (
        <div
          className="fixed inset-0 z-40 cursor-grabbing"
          onMouseMove={(e) => updateDragPosition(e.clientY)}
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
