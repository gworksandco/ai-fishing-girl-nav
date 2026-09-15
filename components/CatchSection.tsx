'use client';

import { Fish, Twitter, ExternalLink } from 'lucide-react';
import type { FishingArea, FishTarget } from '@/lib/areas';
import { buildXSearchUrl } from '@/lib/logic';

type Props = {
  area: FishingArea;
  targets: FishTarget[];
};

export default function CatchSection({ area, targets }: Props) {
  const xSearchUrl = buildXSearchUrl(area.xQuery);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ocean-900 sm:text-base">
        <Fish className="h-4 w-4 text-ocean-600" />
        今週のおすすめターゲット
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {targets.map((t) => (
          <span
            key={t.name}
            className="rounded-full bg-ocean-600 px-3 py-1.5 text-xs font-bold text-white sm:text-sm"
          >
            {t.name}
          </span>
        ))}
      </div>

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
