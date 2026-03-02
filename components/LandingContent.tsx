import Link from "next/link";

const features = [
  {
    title: "柔軟な調整",
    description: "ノンアル・途中参加も1人ずつ調整OK",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    title: "最小回数で精算",
    description: "誰が誰にいくら？を自動計算",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 3h5v5" />
        <path d="M8 3H3v5" />
        <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
        <path d="m15 9 6-6" />
      </svg>
    ),
  },
  {
    title: "幹事にやさしい共有",
    description: "URLひとつでメンバーに共有",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
    ),
  },
];

const steps = [
  { number: "1", title: "グループ作成", description: "名前とメンバーを入力" },
  { number: "2", title: "立て替えを記録", description: "誰が何にいくら払った？" },
  { number: "3", title: "調整を追加", description: "ノンアルや途中参加を個別に調整" },
  { number: "4", title: "精算＆共有", description: "最適な精算方法を自動計算" },
];

const useCases = ["旅行", "飲み会", "ホームパーティ", "同窓会", "アウトドア", "シェアハウス"];

export function LandingContent() {
  return (
    <div className="space-y-10 mb-10">
      {/* Section A: 特徴ハイライト */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">特徴</h2>
        <div className="space-y-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3"
            >
              <div className="text-blue-400 flex-shrink-0 mt-0.5">{feature.icon}</div>
              <div>
                <div className="font-bold text-sm">{feature.title}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section B: 使い方 */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">使い方</h2>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.number} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-zinc-800 my-1" />
                )}
              </div>
              <div className={`pb-${i < steps.length - 1 ? "5" : "0"}`}>
                <div className="font-bold text-sm">{step.title}</div>
                <div className="text-zinc-500 text-xs mt-0.5">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section C: ユースケースタグ */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3">こんな時に</h2>
        <div className="flex flex-wrap gap-2">
          {useCases.map((tag) => (
            <span
              key={tag}
              className="bg-zinc-800/50 text-zinc-400 rounded-full px-3 py-1 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Section D: ボトムCTA */}
      <div className="text-center">
        <Link
          href="/new"
          className="block w-full text-center py-4 bg-blue-500 text-white rounded-xl font-medium text-base active:bg-blue-600"
        >
          さっそく使ってみる
        </Link>
        <p className="text-zinc-600 text-xs mt-2">登録不要・完全無料</p>
      </div>
    </div>
  );
}
