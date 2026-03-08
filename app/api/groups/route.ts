import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { nanoid } from "nanoid";

// POST /api/groups - グループ作成
export async function POST(req: NextRequest) {
  const { name, memberNames } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const groupId = nanoid(8);
  const now = Date.now();

  const { error } = await supabaseAdmin.from("groups").insert({
    id: groupId,
    name,
    currency: "JPY",
    created_at: now,
    updated_at: now,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const members: { id: string; name: string }[] = [];
  if (memberNames && memberNames.length > 0) {
    const memberRows = memberNames.map((mn: string) => {
      const memberId = nanoid(6);
      members.push({ id: memberId, name: mn });
      return { id: memberId, group_id: groupId, name: mn, preferred_receiving_method: null };
    });
    await supabaseAdmin.from("members").insert(memberRows);
  }

  return NextResponse.json({
    id: groupId,
    name,
    currency: "JPY",
    members: members.map((m) => ({ id: m.id, name: m.name })),
    expenses: [],
    completedSettlements: [],
    createdAt: now,
    updatedAt: now,
  });
}
