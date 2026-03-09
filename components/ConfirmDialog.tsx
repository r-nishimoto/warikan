"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // フォーカストラップ
      confirmRef.current?.focus();
      // Escapeキーで閉じる
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") onCancel();
      };
      document.addEventListener("keydown", handleKey);
      // スクロール防止
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleKey);
        document.body.style.overflow = "";
      };
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/60 animate-[fadeIn_150ms_ease-out]"
        onClick={onCancel}
      />
      {/* ダイアログ */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 animate-[slideUp_200ms_ease-out] sm:animate-[fadeIn_150ms_ease-out]">
        <h3 className="text-base font-bold text-zinc-100">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-400 leading-relaxed">{description}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-700 text-zinc-400 rounded-xl font-medium text-sm active:bg-zinc-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
              destructive
                ? "bg-rose-500 text-white active:bg-rose-600"
                : "bg-blue-500 text-white active:bg-blue-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
