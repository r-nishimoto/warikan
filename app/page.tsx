"use client";

import { useState, useRef, useCallback } from "react";
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartY = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const group = await addGroup(name.trim());
    setName("");
    router.push(`/group/${group.id}`);
  };

  // ドラッグ開始（長押し）
  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
    setOverIndex(index);
    // ハプティクスフィードバック
    if (navigator.vibrate) navigator.vibrate(30);
  }, []);

  // タッチ開始
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    dragStartY.current = e.touches[0].clientY;
    longPressTimer.current = setTimeout(() => {
      handleDragStart(index);
    }, 300);
  }, [handleDragStart]);

  // タッチ移動
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragIndex === null) {
      // 長押し前にスクロールしたらキャンセル
      if (longPressTimer.current) {
        const dy = Math.abs(e.touches[0].clientY - dragStartY.current);
        if (dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    e.preventDefault();

    const touch = e.touches[0];
    const list = listRef.current;
    if (!list) return;

    const children = Array.from(list.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (touch.clientY < midY) {
        setOverIndex(i);
        return;
      }
    }
    setOverIndex(children.length - 1);
  }, [dragIndex]);

  // ドロップ
  const handleDrop = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newOrder = [...groups];
      const [moved] = newOrder.splice(dragIndex, 1);
      newOrder.splice(overIndex, 0, moved);
      reorderGroups(newOrder.map((g) => g.id));
    }
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, overIndex, groups, reorderGroups]);

  // タッチキャンセル
  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  return (
    <div className="p-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Waroya</h1>
        <p className="text-zinc-500 mt-2">割り勘をもっとスムーズに</p>
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
          <div ref={listRef} className="space-y-3">
            {groups.map((group, index) => {
              const isDragging = dragIndex === index;
              const isOverTarget = overIndex === index && dragIndex !== null && dragIndex !== index;

              return (
                <div
                  key={group.id}
                  className={`bg-zinc-900 rounded-2xl border p-5 transition-all duration-150 select-none ${
                    isDragging
                      ? "border-blue-500 opacity-60 scale-[0.97]"
                      : isOverTarget
                      ? "border-blue-500/50 translate-y-1"
                      : "border-zinc-800"
                  }`}
                  onTouchStart={(e) => handleTouchStart(e, index)}
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
                        handleDragStart(index);
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
                        if (dragIndex !== null) e.preventDefault();
                      }}
                    >
                      <div className="text-lg font-bold truncate mb-1">{group.name}</div>
                      <div className="text-sm text-zinc-500">
                        {group.members.length}人 ・ {group.expenses.length}件の支出 ・ {formatCurrency(group.expenses.reduce((sum, e) => sum + e.amount, 0))}
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
      {dragIndex !== null && (
        <div
          className="fixed inset-0 z-50 cursor-grabbing"
          onMouseMove={(e) => {
            const list = listRef.current;
            if (!list) return;
            const children = Array.from(list.children) as HTMLElement[];
            for (let i = 0; i < children.length; i++) {
              const rect = children[i].getBoundingClientRect();
              if (e.clientY < rect.top + rect.height / 2) {
                setOverIndex(i);
                return;
              }
            }
            setOverIndex(children.length - 1);
          }}
          onMouseUp={handleDrop}
        />
      )}
    </div>
  );
}
