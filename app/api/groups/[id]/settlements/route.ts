import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// POST /api/groups/[id]/settlements - 清算トグル
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params;
  const { key } = await req.json();

  const { data: existing } = await supabaseAdmin
    .from("completed_settlements")
    .select("settlement_key")
    .eq("group_id", groupId)
    .eq("settlement_key", key)
    .single();

  if (existing) {
    await supabaseAdmin.from("completed_settlements").delete().eq("group_id", groupId).eq("settlement_key", key);
  } else {
    await supabaseAdmin.from("completed_settlements").insert({ group_id: groupId, settlement_key: key });
  }

  return NextResponse.json({ ok: true });
}
