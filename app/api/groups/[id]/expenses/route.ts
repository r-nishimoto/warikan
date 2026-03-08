import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { encodeAdjustmentsColumn } from "@/lib/db-helpers";
import { nanoid } from "nanoid";

// POST /api/groups/[id]/expenses - 支出追加
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const expense = await req.json();

  const expenseId = nanoid(8);
  const { error } = await supabaseAdmin.from("expenses").insert({
    id: expenseId,
    group_id: groupId,
    description: expense.description,
    amount: expense.amount,
    paid_by: expense.paidBy,
    payment_method: expense.paymentMethod,
    split_among: expense.splitAmong,
    expense_date: expense.expenseDate || null,
    date: expense.date,
    adjustments: encodeAdjustmentsColumn(expense.adjustments, expense.splitConfig),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);
  return NextResponse.json({ expenseId });
}

// DELETE /api/groups/[id]/expenses - 全支出リセット
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;

  await supabaseAdmin.from("expenses").delete().eq("group_id", groupId);
  await supabaseAdmin.from("completed_settlements").delete().eq("group_id", groupId);
  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);

  return NextResponse.json({ ok: true });
}
