import { Expense, Member, RoundingUnit, Settlement } from "./types";

function roundUp(amount: number, unit: RoundingUnit): number {
  if (unit === 1) return amount;
  return Math.ceil(amount / unit) * unit;
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
    const share = Math.round(exp.amount / exp.splitAmong.length);
    // 支払った人にクレジット
    balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) + exp.amount);
    // 恩恵を受けた人にデビット
    exp.splitAmong.forEach((memberId) => {
      balances.set(memberId, (balances.get(memberId) || 0) - share);
    });
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
