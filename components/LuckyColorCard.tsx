'use client';

import { Sparkles, Loader2, ExternalLink } from 'lucide-react';
import type { FishingCondition } from '@/lib/logic';
import { buildAmazonSearchUrl, buildRakutenSearchUrl } from '@/lib/logic';

type Props = {
  condition: FishingCondition | null;
};

/**
 * 【注目】ナミの本日の一言 ＆ 今日のラッキーカラーカード。
 * 時間帯（朝夕マズメ／夜間）と天候（降水確率・天気）から判定した
 * コンディションに応じて、ラッキーカラーとおすすめルアーを表示する。
 */
export default function LuckyColorCard({ condition }: Props) {
  return (
    <section className="rounded-2xl border-2 border-coral-500/30 bg-gradient-to-br from-coral-500/10 via-white to-ocean-50 p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-coral-600 sm:text-base">
        <Sparkles className="h-4 w-4" />
        【注目】ナミの本日の一言＆ラッキーカラー
      </h2>

      {!condition ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          コンディションを判定中…
        </div>
      ) : (
        <>
          <p className="mb-3 rounded-xl bg-white/80 px-4 py-3 text-sm font-medium leading-relaxed text-ocean-900 sm:text-base">
            {condition.namiLine}
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            {condition.luckyColors.map((color) => (
              <span
                key={color}
                className="rounded-full bg-coral-500 px-3 py-1.5 text-xs font-bold text-white sm:text-sm"
              >
                🎨 {color}
              </span>
            ))}
          </div>

          <div className="rounded-xl bg-white/80 p-3">
            <p className="mb-2 text-xs text-gray-500">
              おすすめルアー・仕掛け：
              <span className="ml-1 font-bold text-ocean-900">{condition.lureName}</span>
            </p>
            <div className="flex gap-2">
              <a
                href={buildAmazonSearchUrl(condition.lureSearchKeyword)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#ff9900] px-2 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                Amazonで見る <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={buildRakutenSearchUrl(condition.lureSearchKeyword)}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#bf0000] px-2 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                楽天で見る <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
