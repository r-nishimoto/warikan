import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { encodeReceivingMethod, ReceivingMethod } from "@/lib/types";

// PATCH /api/groups/[id]/members/[memberId] - 受取方法更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: groupId, memberId } = await params;
  const { method, customText } = await req.json();

  const encoded = encodeReceivingMethod(method as ReceivingMethod, customText);
  await supabaseAdmin.from("members").update({ preferred_receiving_method: encoded }).eq("id", memberId);
  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);

  return NextResponse.json({ ok: true });
}

// DELETE /api/groups/[id]/members/[memberId] - メンバー削除
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id: groupId, memberId } = await params;

  // 関連する支出を整理
  const { data: expenses } = await supabaseAdmin.from("expenses").select("*").eq("group_id", groupId);
  if (expenses) {
    for (const expense of expenses) {
      if (expense.paid_by === memberId) {
        await supabaseAdmin.from("expenses").delete().eq("id", expense.id);
      } else if (expense.split_among?.includes(memberId)) {
        const newSplitAmong = expense.split_among.filter((id: string) => id !== memberId);
        if (newSplitAmong.length === 0) {
          await supabaseAdmin.from("expenses").delete().eq("id", expense.id);
        } else {
          const rawAdj = expense.adjustments;
          let newAdjustments = rawAdj;
          if (Array.isArray(rawAdj)) {
            newAdjustments = rawAdj
              .map((adj: any) => ({ ...adj, memberIds: adj.memberIds.filter((id: string) => id !== memberId) }))
              .filter((adj: any) => adj.memberIds.length > 0);
            if (newAdjustments.length === 0) newAdjustments = null;
          } else if (rawAdj?.items) {
            const items = rawAdj.items
              .map((adj: any) => ({ ...adj, memberIds: adj.memberIds.filter((id: string) => id !== memberId) }))
              .filter((adj: any) => adj.memberIds.length > 0);
            newAdjustments = { ...rawAdj, items: items.length > 0 ? items : undefined };
            if (!newAdjustments.items && !newAdjustments.splitConfig) newAdjustments = null;
          }
          await supabaseAdmin.from("expenses").update({
            split_among: newSplitAmong,
            adjustments: newAdjustments,
          }).eq("id", expense.id);
        }
      }
    }
  }

  await supabaseAdmin.from("members").delete().eq("id", memberId);
  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);

  return NextResponse.json({ ok: true });
}
