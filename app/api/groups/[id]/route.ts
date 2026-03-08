import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { assembleGroup } from "@/lib/db-helpers";

// GET /api/groups/[id] - グループ全データ取得
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;

  const [groupRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
    supabaseAdmin.from("groups").select("*").eq("id", groupId).single(),
    supabaseAdmin.from("members").select("*").eq("group_id", groupId),
    supabaseAdmin.from("expenses").select("*").eq("group_id", groupId),
    supabaseAdmin.from("completed_settlements").select("settlement_key").eq("group_id", groupId),
  ]);

  if (groupRes.error || !groupRes.data) {
    return NextResponse.json({ error: "グループが見つかりません" }, { status: 404 });
  }

  const group = assembleGroup(
    groupRes.data,
    membersRes.data || [],
    expensesRes.data || [],
    settlementsRes.data || []
  );

  return NextResponse.json(group);
}

// PATCH /api/groups/[id] - グループ名更新
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const { name } = await req.json();

  await supabaseAdmin.from("groups").update({ name, updated_at: Date.now() }).eq("id", groupId);
  return NextResponse.json({ ok: true });
}

// DELETE /api/groups/[id] - グループ削除
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;

  await supabaseAdmin.from("groups").delete().eq("id", groupId);
  return NextResponse.json({ ok: true });
}
