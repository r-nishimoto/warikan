import { Group, Adjustment, SplitConfig, PaymentMethod, parseReceivingMethod } from "./types";

// adjustments JSONB カラムに splitConfig も格納する
// 新形式: { items?: Adjustment[], splitConfig?: SplitConfig }
// 旧形式（後方互換）: Adjustment[] （配列のまま）
export function encodeAdjustmentsColumn(adjustments?: Adjustment[], splitConfig?: SplitConfig): any | null {
  const hasAdj = adjustments && adjustments.length > 0;
  const hasCfg = splitConfig?.mode && splitConfig.mode !== "equal";
  if (!hasAdj && !hasCfg) return null;
  if (hasAdj && !hasCfg) return adjustments; // 旧形式互換
  return {
    ...(hasAdj ? { items: adjustments } : {}),
    ...(hasCfg ? { splitConfig } : {}),
  };
}

export function decodeAdjustmentsColumn(raw: any): { adjustments?: Adjustment[]; splitConfig?: SplitConfig } {
  if (!raw) return {};
  if (Array.isArray(raw)) return { adjustments: raw }; // 旧形式
  return {
    adjustments: raw.items || undefined,
    splitConfig: raw.splitConfig || undefined,
  };
}

// DB行 → アプリ型の変換
export function assembleGroup(
  groupRow: { id: string; name: string; currency: string; created_at: number; updated_at: number },
  memberRows: { id: string; name: string; preferred_receiving_method: string | null }[],
  expenseRows: { id: string; description: string; amount: number; paid_by: string; payment_method: string; split_among: string[]; expense_date: string | null; date: number; adjustments: any | null }[],
  settlementRows: { settlement_key: string }[]
): Group {
  return {
    id: groupRow.id,
    name: groupRow.name,
    currency: groupRow.currency,
    members: memberRows.map((m) => {
      const parsed = parseReceivingMethod(m.preferred_receiving_method);
      return {
        id: m.id,
        name: m.name,
        preferredReceivingMethod: parsed.method || undefined,
        customReceivingMethod: parsed.custom,
      };
    }),
    expenses: expenseRows.map((e) => {
      const { adjustments, splitConfig } = decodeAdjustmentsColumn(e.adjustments);
      return {
        id: e.id,
        description: e.description,
        amount: e.amount,
        paidBy: e.paid_by,
        paymentMethod: (e.payment_method as PaymentMethod) || "cash",
        splitAmong: e.split_among || [],
        expenseDate: e.expense_date || undefined,
        date: e.date,
        adjustments,
        splitConfig,
      };
    }),
    completedSettlements: settlementRows.map((s) => s.settlement_key),
    createdAt: groupRow.created_at,
    updatedAt: groupRow.updated_at,
  };
}
