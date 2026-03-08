import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { encodeAdjustmentsColumn } from "@/lib/db-helpers";

// PATCH /api/groups/[id]/expenses/[expenseId] - 支出更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  const { id: groupId, expenseId } = await params;
  const expense = await req.json();

  const { error } = await supabaseAdmin.from("expenses").update({
    description: expense.description,
    amount: expense.amount,
    paid_by: expense.paidBy,
    payment_method: expense.paymentMethod,
    split_among: expense.splitAmong,
    expense_date: expense.expenseDate || null,
    date: expense.date,
    adjustments: encodeAdjustmentsColumn(expense.adjustments, expense.splitConfig),
  }).eq("id", expenseId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);
  return NextResponse.json({ ok: true });
}

// DELETE /api/groups/[id]/expenses/[expenseId] - 支出削除
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; expenseId: string }> }) {
  const { id: groupId, expenseId } = await params;

  await supabaseAdmin.from("expenses").delete().eq("id", expenseId);
  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);

  return NextResponse.json({ ok: true });
}
