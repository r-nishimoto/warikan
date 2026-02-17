import lzstring from "lz-string";
import { Group } from "./types";

interface MinimalGroup {
  i: string;
  n: string;
  c: string;
  m: Array<{ i: string; n: string; rm?: string }>;
  e: Array<{
    i: string;
    d: string;
    a: number;
    p: string;
    pm?: string;
    ed?: string;
    s: string[];
    t: number;
    aj?: Array<{ m: string[]; a: number; mm?: string }>;
  }>;
  t: number;
}

export function encodeGroupForSharing(group: Group): string {
  const minimal: MinimalGroup = {
    i: group.id,
    n: group.name,
    c: group.currency,
    m: group.members.map((m) => ({ i: m.id, n: m.name, rm: m.preferredReceivingMethod })),
    e: group.expenses.map((e) => ({
      i: e.id,
      d: e.description,
      a: e.amount,
      p: e.paidBy,
      pm: e.paymentMethod,
      ed: e.expenseDate,
      s: e.splitAmong,
      t: e.date,
      aj: e.adjustments?.length ? e.adjustments.map((adj) => ({
        m: adj.memberIds,
        a: adj.amount,
        mm: adj.memo,
      })) : undefined,
    })),
    t: group.createdAt,
  };
  return lzstring.compressToEncodedURIComponent(JSON.stringify(minimal));
}

export function decodeGroupFromSharing(encoded: string): Group | null {
  try {
    const json = lzstring.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const minimal: MinimalGroup = JSON.parse(json);
    return {
      id: minimal.i,
      name: minimal.n,
      currency: minimal.c,
      members: minimal.m.map((m) => ({ id: m.i, name: m.n, preferredReceivingMethod: (m.rm as "paypay" | "cash" | "bank" | "any") || undefined })),
      expenses: minimal.e.map((e) => ({
        id: e.i,
        description: e.d,
        amount: e.a,
        paidBy: e.p,
        paymentMethod: (e.pm as "cash" | "card" | "paypay" | "quickpay" | "other") || "cash",
        expenseDate: e.ed,
        splitAmong: e.s,
        date: e.t,
        adjustments: e.aj?.map((adj) => ({
          memberIds: adj.m,
          amount: adj.a,
          memo: adj.mm,
        })) || undefined,
      })),
      completedSettlements: [],
      createdAt: minimal.t,
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export async function shareGroup(url: string, groupName: string) {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({
      title: `Waroya: ${groupName}`,
      text: `「${groupName}」の割り勘グループに参加しよう`,
      url,
    });
  } else if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
  }
}
