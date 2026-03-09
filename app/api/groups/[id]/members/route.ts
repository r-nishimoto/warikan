import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { nanoid } from "nanoid";

// POST /api/groups/[id]/members - メンバー追加
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const { name } = await req.json();

  // 重複チェック
  const { data: existing } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("group_id", groupId)
    .eq("name", name.trim())
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "名前が重複しています" }, { status: 409 });
  }

  const memberId = nanoid(6);
  await supabaseAdmin.from("members").insert({
    id: memberId,
    group_id: groupId,
    name: name.trim(),
    preferred_receiving_method: null,
  });
  await supabaseAdmin.from("groups").update({ updated_at: Date.now() }).eq("id", groupId);

  return NextResponse.json({ memberId });
}
