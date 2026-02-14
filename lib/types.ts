export interface Group {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  expenses: Expense[];
  completedSettlements: string[]; // "fromId->toId" 形式
  createdAt: number;
  updatedAt: number;
}

export interface Member {
  id: string;
  name: string;
  preferredReceivingMethod?: ReceivingMethod;
}

export type PaymentMethod = "cash" | "card" | "paypay" | "quickpay" | "other";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "現金" },
  { value: "card", label: "カード" },
  { value: "paypay", label: "PayPay" },
  { value: "quickpay", label: "クイックペイ" },
  { value: "other", label: "その他" },
];

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  paymentMethod: PaymentMethod;
  splitAmong: string[];
  expenseDate?: string; // YYYY-MM-DD形式（任意）
  date: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// 希望精算方法（受け取り側）
export type ReceivingMethod = "paypay" | "cash" | "bank" | "any";

export const RECEIVING_METHODS: { value: ReceivingMethod; label: string }[] = [
  { value: "any", label: "指定なし" },
  { value: "paypay", label: "PayPay" },
  { value: "cash", label: "現金" },
  { value: "bank", label: "振り込み" },
];

// 端数処理
export type RoundingUnit = 1 | 10 | 100 | 1000;

export const ROUNDING_UNITS: { value: RoundingUnit; label: string }[] = [
  { value: 1, label: "1円" },
  { value: 10, label: "10円" },
  { value: 100, label: "100円" },
  { value: 1000, label: "1000円" },
];
