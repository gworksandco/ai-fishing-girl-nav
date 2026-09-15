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
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ocean-700 sm:text-sm">
            <Twitter className="h-4 w-4" />
            X（旧Twitter）広域リアルタイム釣果検索
          </span>
          <a
            href={xSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-ocean-600 hover:underline"
          >
            開く <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="mb-2 line-clamp-2 text-xs text-gray-500">検索条件: {area.xQuery}</p>
        {/*
          本番実装では、ここに公式 Twitter Embedded Timeline / Search Widget
          （publish.twitter.com で発行した <blockquote class="twitter-timeline">）
          を差し込む想定のプレースホルダー枠。
        */}
        <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-ocean-200 bg-white text-center text-xs text-gray-400 sm:h-32">
          X検索埋め込みウィジェット表示枠
          <br />
          （公式Widget実装時にこの枠を置き換え）
        </div>
      </div>
    </section>
  );
}
