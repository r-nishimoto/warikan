"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { decodeGroupFromSharing } from "@/lib/sharing";
import { useStore } from "@/lib/store";

export default function SharedPage() {
  const { data } = useParams<{ data: string }>();
  const router = useRouter();
  const { importGroup } = useStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!data) {
      setError(true);
      return;
    }
    const group = decodeGroupFromSharing(decodeURIComponent(data));
    if (!group) {
      setError(true);
      return;
    }
    importGroup(group);
    router.replace(`/group/${group.id}`);
  }, [data, importGroup, router]);

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
