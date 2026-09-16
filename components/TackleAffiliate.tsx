'use client';

import { ShoppingBag, ExternalLink } from 'lucide-react';
import type { FishTarget } from '@/lib/areas';
import { getTackleRecommendation, buildAmazonSearchUrl, buildRakutenSearchUrl } from '@/lib/logic';

type Props = {
  targets: FishTarget[];
};

export default function TackleAffiliate({ targets }: Props) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ocean-900 sm:text-base">
        <ShoppingBag className="h-4 w-4 text-ocean-600" />
        ナミのおすすめ仕掛け・タックル
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {targets.slice(0, 4).map((t) => {
          const rec = getTackleRecommendation(t.name);
          return (
            <div
              key={t.name}
              className="flex flex-col rounded-xl border border-gray-100 p-3 shadow-sm"
            >
              <span className="mb-1 inline-block w-fit rounded bg-ocean-50 px-2 py-0.5 text-[11px] font-bold text-ocean-600">
                {rec.target} 向け
              </span>
              <h3 className="mb-1 text-sm font-bold text-ocean-900">{rec.title}</h3>
              <p className="mb-3 flex-1 text-xs leading-relaxed text-gray-500">
                {rec.description}
              </p>
              <div className="flex gap-2">
                <a
                  href={buildAmazonSearchUrl(rec.amazonKeyword)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#ff9900] px-2 py-2 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Amazonで見る <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={buildRakutenSearchUrl(rec.rakutenKeyword)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#bf0000] px-2 py-2 text-xs font-bold text-white transition hover:opacity-90"
                >
                  楽天で見る <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-gray-400">
        ※本サイトの商品リンクにはアフィリエイトプログラムを利用しています。
      </p>
    </section>
  );
}
