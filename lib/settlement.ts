import { Expense, Member, RoundingUnit, Settlement } from "./types";

function roundUp(amount: number, unit: RoundingUnit): number {
  if (unit === 1) return amount;
  return Math.ceil(amount / unit) * unit;
}

/**
 * 支出ごとの各メンバーの負担額を計算
 * Step1: splitConfig.mode に応じてベース負担額を計算
 * Step2: adjustments を全モード共通で適用
 */
export function calculateMemberShares(expense: Expense): Map<string, number> {
  const { amount, splitAmong, adjustments, splitConfig } = expense;
  const shares = new Map<string, number>();
  const mode = splitConfig?.mode || "equal";

  // Step 1: モード別ベース負担額
  if (mode === "ratio" && splitConfig?.ratios) {
    const totalRatio = splitAmong.reduce((sum, id) => sum + (splitConfig.ratios![id] || 1), 0);
    splitAmong.forEach((id) => {
      const ratio = splitConfig.ratios![id] || 1;
      shares.set(id, Math.round(amount * ratio / totalRatio));
    });
  } else if (mode === "fixed" && splitConfig?.fixedAmounts) {
    let specifiedTotal = 0;
    const unspecified: string[] = [];
    splitAmong.forEach((id) => {
      const fixed = splitConfig.fixedAmounts![id];
      if (fixed !== undefined && fixed > 0) {
        shares.set(id, fixed);
        specifiedTotal += fixed;
      } else {
        unspecified.push(id);
      }
    });
    // 残額を未指定メンバーで均等配分
    if (unspecified.length > 0) {
      const remaining = amount - specifiedTotal;
      const perMember = Math.round(remaining / unspecified.length);
      unspecified.forEach((id) => shares.set(id, perMember));
    }
  } else {
    // equal（デフォルト）
    const share = Math.round(amount / splitAmong.length);
    splitAmong.forEach((id) => shares.set(id, share));
  }

  // Step 2: adjustments 適用（全モード共通）
  if (!adjustments || adjustments.length === 0) return shares;

  const adjustmentPerMember = new Map<string, number>();
  for (const adj of adjustments) {
    for (const memberId of adj.memberIds) {
      if (splitAmong.includes(memberId)) {
        adjustmentPerMember.set(memberId, (adjustmentPerMember.get(memberId) || 0) + adj.amount);
      }
    }
  }

  const adjustedMemberIds = new Set(adjustmentPerMember.keys());
  let adjustedTotal = 0;

  for (const memberId of splitAmong) {
    if (adjustedMemberIds.has(memberId)) {
      const memberShare = Math.round((shares.get(memberId) || 0) + adjustmentPerMember.get(memberId)!);
      shares.set(memberId, memberShare);
    }
    adjustedTotal += shares.get(memberId) || 0;
  }

  // 残額を非調整メンバーで再配分
  const nonAdjustedMembers = splitAmong.filter((id) => !adjustedMemberIds.has(id));
  if (nonAdjustedMembers.length > 0 && adjustedTotal !== amount) {
    const currentNonAdjTotal = nonAdjustedMembers.reduce((sum, id) => sum + (shares.get(id) || 0), 0);
    const adjustedOnlyTotal = adjustedTotal - currentNonAdjTotal;
    const remaining = amount - adjustedOnlyTotal;
    const perMember = Math.round(remaining / nonAdjustedMembers.length);
    nonAdjustedMembers.forEach((id) => shares.set(id, perMember));
  }

  return shares;
}

export function calculateSettlements(
  members: Member[],
  expenses: Expense[],
  roundingUnit: RoundingUnit = 1
): Settlement[] {
  // Step 1: 各メンバーの収支を計算
  const balances = new Map<string, number>();
  members.forEach((m) => balances.set(m.id, 0));

  expenses.forEach((exp) => {
    // 支払った人にクレジット
    balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) + exp.amount);

    // 各メンバーの負担額を計算（調整対応）
    const memberShares = calculateMemberShares(exp);
    for (const [memberId, share] of memberShares) {
      balances.set(memberId, (balances.get(memberId) || 0) - share);
    }
  });

  // Step 2: 債権者と債務者に分離
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  balances.forEach((balance, id) => {
    if (balance > 0) creditors.push({ id, amount: balance });
    else if (balance < 0) debtors.push({ id, amount: -balance });
  });

  // Step 3: 大きい順にソート
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 4: 貪欲法でマッチング（支払い回数を最小化）
  const settlements: Settlement[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);
    if (amount > 0) {
      settlements.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: roundUp(amount, roundingUnit),
      });
    }
    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;
    if (creditors[ci].amount === 0) ci++;
    if (debtors[di].amount === 0) di++;
  }

  return settlements;
}
