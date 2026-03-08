import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST /api/import - 共有URLからグループをインポート
export async function POST(req: NextRequest) {
  const group = await req.json();
  if (!group || !group.id) return NextResponse.json({ error: "invalid data" }, { status: 400 });

  // グループがDBに既に存在するかチェック
  const { data: existing } = await supabaseAdmin
    .from("groups")
    .select("id")
    .eq("id", group.id)
    .single();

  if (!existing) {
    await supabaseAdmin.from("groups").insert({
      id: group.id,
      name: group.name,
      currency: group.currency,
      created_at: group.createdAt,
      updated_at: Date.now(),
    });

    if (group.members?.length > 0) {
      await supabaseAdmin.from("members").insert(
        group.members.map((m: any) => ({
          id: m.id,
          group_id: group.id,
          name: m.name,
          preferred_receiving_method: m.preferredReceivingMethod || null,
        }))
      );
    }

    if (group.expenses?.length > 0) {
      await supabaseAdmin.from("expenses").insert(
        group.expenses.map((e: any) => ({
          id: e.id,
          group_id: group.id,
          description: e.description,
          amount: e.amount,
          paid_by: e.paidBy,
          payment_method: e.paymentMethod,
          split_among: e.splitAmong,
          expense_date: e.expenseDate || null,
          date: e.date,
        }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}
