"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { decodeGroupFromSharing } from "@/lib/sharing";
import { supabase } from "@/lib/supabase";
import { addLocalGroupId } from "@/lib/useGroup";

export default function SharedPage() {
  const { data } = useParams<{ data: string }>();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!data) {
      setError(true);
      return;
    }

    const importToSupabase = async () => {
      const group = decodeGroupFromSharing(decodeURIComponent(data));
      if (!group) {
        setError(true);
        return;
      }

      // グループがDBに既に存在するかチェック
      const { data: existing } = await supabase
        .from("groups")
        .select("id")
        .eq("id", group.id)
        .single();

      if (!existing) {
        // グループを新規作成
        await supabase.from("groups").insert({
          id: group.id,
          name: group.name,
          currency: group.currency,
          created_at: group.createdAt,
          updated_at: Date.now(),
        });

        // メンバーを挿入
        if (group.members.length > 0) {
          await supabase.from("members").insert(
            group.members.map((m) => ({
              id: m.id,
              group_id: group.id,
              name: m.name,
              preferred_receiving_method: m.preferredReceivingMethod || null,
            }))
          );
        }

        // 支出を挿入
        if (group.expenses.length > 0) {
          await supabase.from("expenses").insert(
            group.expenses.map((e) => ({
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

      // ローカルレジストリに追加
      addLocalGroupId(group.id);

      // グループページへリダイレクト
      router.replace(`/group/${group.id}`);
    };

    importToSupabase();
  }, [data, router]);

  if (error) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-gray-400 mb-4">
          共有リンクが無効です
        </p>
        <a href="/" className="text-blue-500">
          ホームに戻る
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 text-center py-20">
      <p className="text-gray-400">グループを読み込んでいます...</p>
    </div>
  );
}
