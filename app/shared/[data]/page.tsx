"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { decodeGroupFromSharing } from "@/lib/sharing";
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

    const importGroup = async () => {
      const group = decodeGroupFromSharing(decodeURIComponent(data));
      if (!group) {
        setError(true);
        return;
      }

      // API Route経由でインポート
      await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(group),
      });

      addLocalGroupId(group.id);
      router.replace(`/group/${group.id}`);
    };

    importGroup();
  }, [data, router]);

  if (error) {
    return (
      <div className="p-6 text-center py-20">
        <p className="text-on-surface-secondary mb-4">
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
      <p className="text-on-surface-secondary">グループを読み込んでいます...</p>
    </div>
  );
}
