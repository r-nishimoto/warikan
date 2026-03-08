import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { decodeAdjustmentsColumn } from "@/lib/db-helpers";
import { PaymentMethod } from "@/lib/types";

// POST /api/groups/batch - 複数グループ取得（ホーム画面用）
export async function POST(req: NextRequest) {
  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ groups: [] });
  }

  const [groupsRes, membersRes, expensesRes] = await Promise.all([
    supabaseAdmin.from("groups").select("*").in("id", ids),
    supabaseAdmin.from("members").select("*").in("group_id", ids),
    supabaseAdmin.from("expenses").select("*").in("group_id", ids),
  ]);

  const groupRows = groupsRes.data || [];
  const memberRows = membersRes.data || [];
  const expenseRows = expensesRes.data || [];

  const groups = groupRows.map((g) => ({
    id: g.id,
    name: g.name,
    currency: g.currency,
    members: memberRows
      .filter((m) => m.group_id === g.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        preferredReceivingMethod: m.preferred_receiving_method || undefined,
      })),
    expenses: expenseRows
      .filter((e) => e.group_id === g.id)
      .map((e) => {
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
    completedSettlements: [],
    createdAt: g.created_at,
    updatedAt: g.updated_at,
  }));

  return NextResponse.json({ groups, existingIds: groupRows.map((g) => g.id) });
}
