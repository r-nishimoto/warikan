import { Expense, Member, RoundingUnit, Settlement } from "./types";

function roundUp(amount: number, unit: RoundingUnit): number {
  if (unit === 1) return amount;
  return Math.ceil(amount / unit) * unit;
}

/**
 * 支出ごとの各メンバーの負担額を計算
 * 調整なし: 均等割り
 * 調整あり: 調整メンバーは baseShare + adjustment、残額を非調整メンバーで均等割り
 */
export function calculateMemberShares(expense: Expense): Map<string, number> {
  const { amount, splitAmong, adjustments } = expense;
  const shares = new Map<string, number>();

  if (!adjustments || adjustments.length === 0) {
    // 調整なし: 従来通り均等割り
    const share = Math.round(amount / splitAmong.length);
    splitAmong.forEach((memberId) => shares.set(memberId, share));
    return shares;
  }

  // 各メンバーの調整額を集計（複数調整が同一メンバーに適用される場合あり）
  const adjustmentPerMember = new Map<string, number>();
  for (const adj of adjustments) {
    for (const memberId of adj.memberIds) {
      if (splitAmong.includes(memberId)) {
        adjustmentPerMember.set(
          memberId,
          (adjustmentPerMember.get(memberId) || 0) + adj.amount
        );
      }
    }
  }

  const baseShare = amount / splitAmong.length;
  const adjustedMemberIds = new Set(adjustmentPerMember.keys());
  let adjustedTotal = 0;

  // 調整メンバーの負担額を計算
  for (const memberId of splitAmong) {
    if (adjustedMemberIds.has(memberId)) {
      const memberShare = Math.round(baseShare + adjustmentPerMember.get(memberId)!);
      shares.set(memberId, memberShare);
      adjustedTotal += memberShare;
    }
  }

  // 残額を非調整メンバーで均等割り
  const nonAdjustedMembers = splitAmong.filter((id) => !adjustedMemberIds.has(id));
  const remainingForNonAdjusted = amount - adjustedTotal;

  if (nonAdjustedMembers.length > 0) {
    const perNonAdjusted = Math.round(remainingForNonAdjusted / nonAdjustedMembers.length);
    nonAdjustedMembers.forEach((memberId) => {
      shares.set(memberId, perNonAdjusted);
    });
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
