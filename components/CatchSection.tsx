'use client';

import { Fish, Twitter, ExternalLink, Droplets } from 'lucide-react';
import type { FishingArea, FishTarget } from '@/lib/areas';
import { buildXSearchUrl, TARGET_TEMP_RANGES } from '@/lib/logic';
import type { WeatherData } from '@/lib/weather';

type Props = {
  area: FishingArea;
  targets: FishTarget[];
  weather: WeatherData | null;
};

export default function CatchSection({ area, targets, weather }: Props) {
  const xSearchUrl = buildXSearchUrl(area.xQuery);
  const seaTemp = weather?.seaTemperature;

  const isTempFavorable = (name: string) => {
    if (seaTemp == null) return false;
    const range = TARGET_TEMP_RANGES[name];
    return !!range && seaTemp >= range.min && seaTemp <= range.max;
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ocean-900 sm:text-base">
        <Fish className="h-4 w-4 text-ocean-600" />
        今週のおすすめターゲット
      </h2>

      <div className="mb-2 flex flex-wrap gap-2">
        {targets.map((t) => {
          const favorable = isTempFavorable(t.name);
          return (
            <span
              key={t.name}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-white sm:text-sm ${
                favorable ? 'bg-coral-500' : 'bg-ocean-600'
              }`}
            >
              {t.name}
              {favorable && <Droplets className="h-3 w-3" aria-hidden />}
            </span>
          );
        })}
      </div>
      <p className="mb-4 text-[11px] text-gray-400">
        {seaTemp != null && targets.some((t) => isTempFavorable(t.name))
          ? '※マーク付きは今の水温にちょうど良い魚種だよ'
          : ' '}
      </p>

      <div className="rounded-xl border border-ocean-100 bg-ocean-50/60 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ocean-700 sm:text-sm">
          <Twitter className="h-4 w-4" />
          X（旧Twitter）広域リアルタイム釣果検索
        </div>
        <p className="mb-3 line-clamp-2 text-xs text-gray-500">検索条件: {area.xQuery}</p>
        {/*
          X（旧Twitter）は無料APIと埋め込みウィジェットへのアクセスを大幅に制限しているため、
          維持費0円の制約下では常時安定動作するライブ検索埋め込みを組み込まず、
          検索結果を新規タブで直接開くリンクボタンとして提供する。
        */}
        <a
          href={xSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ocean-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-ocean-700"
        >
          <Twitter className="h-4 w-4" />
          Xで最新の釣果を見る
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
