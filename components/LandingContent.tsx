import Link from "next/link";

/* ─── 特長セクション用イラスト（SVG） ─── */

function IllustAdjust() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="w-full max-w-[240px] mx-auto">
      {/* バーチャート */}
      <rect x="40" y="100" width="28" height="40" rx="4" fill="#3b82f6" opacity="0.25" />
      <rect x="80" y="70" width="28" height="70" rx="4" fill="#3b82f6" opacity="0.4" />
      <rect x="120" y="50" width="28" height="90" rx="4" fill="#3b82f6" opacity="0.6" />
      <rect x="160" y="30" width="28" height="110" rx="4" fill="#3b82f6" opacity="0.8" />
      {/* 調整矢印 */}
      <path d="M54 95 L54 85" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <path d="M49 89 L54 83 L59 89" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M174 25 L174 18" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <path d="M169 22 L174 16 L179 22" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* ラベル */}
      <text x="54" y="152" textAnchor="middle" fontSize="9" fill="#71717a">A</text>
      <text x="94" y="152" textAnchor="middle" fontSize="9" fill="#71717a">B</text>
      <text x="134" y="152" textAnchor="middle" fontSize="9" fill="#71717a">C</text>
      <text x="174" y="152" textAnchor="middle" fontSize="9" fill="#71717a">D</text>
    </svg>
  );
}

function IllustSettle() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="w-full max-w-[240px] mx-auto">
      {/* 3人の円 */}
      <circle cx="70" cy="55" r="24" fill="#3b82f6" opacity="0.2" />
      <circle cx="170" cy="55" r="24" fill="#3b82f6" opacity="0.2" />
      <circle cx="120" cy="120" r="24" fill="#3b82f6" opacity="0.2" />
      {/* 人アイコン */}
      <circle cx="70" cy="49" r="7" fill="#60a5fa" />
      <path d="M58 68 a12 10 0 0 1 24 0" fill="#60a5fa" />
      <circle cx="170" cy="49" r="7" fill="#60a5fa" />
      <path d="M158 68 a12 10 0 0 1 24 0" fill="#60a5fa" />
      <circle cx="120" cy="114" r="7" fill="#60a5fa" />
      <path d="M108 133 a12 10 0 0 1 24 0" fill="#60a5fa" />
      {/* 矢印 (1本だけ = 最小回数) */}
      <line x1="96" y1="55" x2="143" y2="55" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 3" />
      <polygon points="143,51 150,55 143,59" fill="#3b82f6" />
      {/* ¥ラベル */}
      <rect x="108" y="40" width="24" height="16" rx="8" fill="#1d4ed8" />
      <text x="120" y="52" textAnchor="middle" fontSize="9" fontWeight="bold" fill="white">¥</text>
    </svg>
  );
}

function IllustShare() {
  return (
    <svg viewBox="0 0 240 160" fill="none" className="w-full max-w-[240px] mx-auto">
      {/* スマホフレーム */}
      <rect x="80" y="15" width="80" height="130" rx="12" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
      <rect x="86" y="25" width="68" height="110" rx="4" fill="#27272a" />
      {/* 画面内のURL風ライン */}
      <rect x="94" y="35" width="52" height="8" rx="4" fill="#3b82f6" opacity="0.3" />
      {/* シェアアイコン */}
      <circle cx="120" cy="70" r="12" fill="#3b82f6" opacity="0.2" />
      <path d="M120 64 L120 76" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
      <path d="M115 68 L120 63 L125 68" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* 飛び出す共有線 */}
      <line x1="160" y1="60" x2="195" y2="40" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
      <circle cx="200" cy="37" r="8" fill="#3b82f6" opacity="0.15" />
      <text x="200" y="40" textAnchor="middle" fontSize="8" fill="#60a5fa">A</text>
      <line x1="160" y1="80" x2="195" y2="80" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
      <circle cx="200" cy="80" r="8" fill="#3b82f6" opacity="0.15" />
      <text x="200" y="83" textAnchor="middle" fontSize="8" fill="#60a5fa">B</text>
      <line x1="160" y1="100" x2="195" y2="120" stroke="#3b82f6" strokeWidth="1.5" opacity="0.5" />
      <circle cx="200" cy="123" r="8" fill="#3b82f6" opacity="0.15" />
      <text x="200" y="126" textAnchor="middle" fontSize="8" fill="#60a5fa">C</text>
    </svg>
  );
}

/* ─── 使い方セクション用：スマホモックアップ ─── */

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[220px]">
      {/* 背景カラーフレーム */}
      <div className="absolute inset-0 bg-blue-500/20 rounded-[28px] -m-2" />
      {/* スマホ外枠 */}
      <div className="relative bg-zinc-900 rounded-[24px] border-2 border-zinc-700 overflow-hidden shadow-lg shadow-blue-500/10">
        {/* ノッチ */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-16 h-1 rounded-full bg-zinc-700" />
        </div>
        {/* 画面コンテンツ */}
        <div className="px-3 pb-4 space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── メインコンポーネント ─── */

const useCases = ["旅行", "飲み会", "ホームパーティ", "同窓会", "アウトドア", "シェアハウス"];

export function LandingContent() {
  return (
    <div className="space-y-16">

      {/* ── 特長その1 ── */}
      <section className="bg-zinc-900/60 rounded-2xl p-6 text-center">
        <span className="text-blue-400 text-xs font-bold tracking-wider">特長 01</span>
        <h3 className="text-xl font-bold mt-2 leading-snug">
          ノンアル・途中参加も<br />1人ずつ柔軟に調整
        </h3>
        <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
          均等割りだけじゃない。<br />
          メンバーごとの割引・追加を自由に設定できます。
        </p>
        <div className="mt-6">
          <IllustAdjust />
        </div>
      </section>

      {/* ── 特長その2 ── */}
      <section className="bg-zinc-900/60 rounded-2xl p-6 text-center">
        <span className="text-blue-400 text-xs font-bold tracking-wider">特長 02</span>
        <h3 className="text-xl font-bold mt-2 leading-snug">
          最小回数で精算を<br />自動計算
        </h3>
        <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
          誰が誰にいくら渡せばいいか、<br />
          最適な組み合わせをリアルタイムで算出。
        </p>
        <div className="mt-6">
          <IllustSettle />
        </div>
      </section>

      {/* ── 特長その3 ── */}
      <section className="bg-zinc-900/60 rounded-2xl p-6 text-center">
        <span className="text-blue-400 text-xs font-bold tracking-wider">特長 03</span>
        <h3 className="text-xl font-bold mt-2 leading-snug">
          URLひとつで<br />メンバーに共有
        </h3>
        <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
          アプリ不要、登録不要。<br />
          LINEやSNSでリンクを送るだけ。
        </p>
        <div className="mt-6">
          <IllustShare />
        </div>
      </section>

      {/* ── こんな時に ── */}
      <section className="text-center">
        <h3 className="text-lg font-bold mb-4">
          旅行以外にも様々なシーンで活躍
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {useCases.map((tag) => (
            <span
              key={tag}
              className="border border-zinc-700 text-zinc-400 rounded-full px-4 py-1.5 text-sm"
            >
              # {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── 使い方 ── */}
      <section className="text-center">
        <h3 className="text-lg font-bold mb-8">
          1分でわかるWaroyaの使い方
        </h3>

        {/* Step 1 */}
        <div className="mb-10">
          <p className="text-base font-bold mb-4">1. グループを作成する</p>
          <PhoneMockup>
            <div className="text-[10px] text-zinc-500">グループ名</div>
            <div className="bg-zinc-800 rounded-lg px-2 py-1.5 text-xs font-bold">同期で北海道旅行！</div>
            <div className="text-[10px] text-zinc-500 mt-1">メンバー</div>
            <div className="flex flex-wrap gap-1">
              {["あおい", "レン", "ハルト", "なぎ"].map((n) => (
                <span key={n} className="bg-zinc-800 rounded-full px-2 py-0.5 text-[10px] text-zinc-300">{n} ×</span>
              ))}
            </div>
            <div className="bg-blue-500 rounded-lg py-1.5 text-xs text-white text-center font-medium mt-2">グループを作成</div>
          </PhoneMockup>
          <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
            イベント名とメンバーを入力するだけ。<br />
            会員登録は不要です。
          </p>
        </div>

        {/* Step 2 */}
        <div className="mb-10">
          <p className="text-base font-bold mb-4">2. 立て替えを記録する</p>
          <PhoneMockup>
            <div className="flex items-center gap-1">
              <span className="bg-blue-500/20 text-blue-400 rounded-full px-2 py-0.5 text-[10px]">あおい</span>
              <span className="text-[10px] text-zinc-500">が</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {["あおい", "レン", "ハルト", "なぎ"].map((n) => (
                <span key={n} className="bg-blue-500/20 border border-blue-500/40 rounded px-1.5 py-0.5 text-[9px] text-blue-300">{n}</span>
              ))}
            </div>
            <div className="bg-zinc-800 rounded-lg px-2 py-1.5 text-xs mt-1">レンタカー代</div>
            <div className="bg-zinc-800 rounded-lg px-2 py-1.5 text-xs font-bold mt-1">¥9,800</div>
            <div className="bg-blue-500 rounded-lg py-1.5 text-xs text-white text-center font-medium mt-2">登録</div>
          </PhoneMockup>
          <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
            誰が何に何円払ったかを記録。<br />
            メンバー全員が登録できるので幹事の負担を軽減。
          </p>
        </div>

        {/* Step 3 */}
        <div className="mb-10">
          <p className="text-base font-bold mb-4">3. 調整して精算する</p>
          <PhoneMockup>
            <div className="text-[10px] text-zinc-500 font-bold">精算方法</div>
            <div className="space-y-1.5 mt-1">
              <div className="bg-zinc-800 rounded-lg px-2 py-2 flex items-center justify-between">
                <span className="text-[10px]"><span className="text-blue-400">レン</span> → <span className="text-emerald-400">あおい</span></span>
                <span className="text-[11px] font-bold">¥3,200</span>
              </div>
              <div className="bg-zinc-800 rounded-lg px-2 py-2 flex items-center justify-between">
                <span className="text-[10px]"><span className="text-blue-400">ハルト</span> → <span className="text-emerald-400">あおい</span></span>
                <span className="text-[11px] font-bold">¥1,800</span>
              </div>
              <div className="bg-zinc-800 rounded-lg px-2 py-2 flex items-center justify-between">
                <span className="text-[10px]"><span className="text-blue-400">なぎ</span> → <span className="text-emerald-400">レン</span></span>
                <span className="text-[11px] font-bold">¥900</span>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <div className="flex-1 bg-zinc-800 rounded-lg py-1.5 text-[10px] text-center text-zinc-400">コピー</div>
              <div className="flex-1 bg-emerald-600 rounded-lg py-1.5 text-[10px] text-center text-white">LINE共有</div>
            </div>
          </PhoneMockup>
          <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
            最適な精算方法を自動で計算。<br />
            結果はLINEやURLでかんたんに共有できます。
          </p>
        </div>
      </section>

      {/* ── ボトムCTA ── */}
      <section className="text-center pb-4">
        <h3 className="text-xl font-bold mb-2">さっそく始めてみよう</h3>
        <p className="text-zinc-500 text-sm mb-6">登録不要・完全無料</p>
        <Link
          href="/new"
          className="block w-full text-center py-4 bg-blue-500 text-white rounded-xl font-medium text-base active:bg-blue-600"
        >
          グループを作成する
        </Link>
      </section>
    </div>
  );
}
