'use client';

import { AlertTriangle, Sparkles } from 'lucide-react';

type Props = {
  message: string;
  isAlert: boolean;
};

/**
 * AI釣りガール「ナミ」のナビゲーションヘッダー。
 * アバターは外部の重い画像を使わず、軽量なインラインSVGで表現。
 */
export default function NamiNavigator({ message, isAlert }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 p-4 text-white shadow-card sm:items-center sm:gap-4 sm:p-5">
      <NamiAvatar />
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-wide">AI釣りガール ナミ</span>
          {isAlert ? (
            <AlertTriangle className="h-4 w-4 text-yellow-300" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4 text-yellow-200" aria-hidden />
          )}
        </div>
        <div
          className={`relative rounded-xl rounded-tl-sm px-4 py-3 text-sm font-medium leading-relaxed sm:text-base ${
            isAlert ? 'bg-coral-500/90 text-white' : 'bg-white/95 text-ocean-900'
          }`}
        >
          {message}
        </div>
      </div>
    </div>
  );
}

/** 軽量SVGプレースホルダー・アバター（画像リクエスト0件） */
function NamiAvatar() {
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-16 w-16 shrink-0 rounded-full bg-white/20 sm:h-20 sm:w-20"
      aria-label="ナミのアバター"
      role="img"
    >
      <circle cx="40" cy="40" r="38" fill="#eefbff" />
      <circle cx="40" cy="34" r="16" fill="#ffd9c2" />
      {/* 髪 */}
      <path
        d="M22 30c0-12 8-20 18-20s18 8 18 20c-4-4-10-6-18-6s-14 2-18 6z"
        fill="#0aa9f2"
      />
      <path d="M20 34c0 6 2 11 5 14-2-6-2-12 1-17-3 0-5 1-6 3z" fill="#0aa9f2" />
      <path d="M60 34c0 6-2 11-5 14 2-6 2-12-1-17 3 0 5 1 6 3z" fill="#0aa9f2" />
      {/* 目 */}
      <circle cx="33" cy="34" r="2.2" fill="#075a86" />
      <circle cx="47" cy="34" r="2.2" fill="#075a86" />
      {/* 口 */}
      <path d="M35 41c2 2 8 2 10 0" stroke="#f0532c" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* 帽子つば */}
      <path d="M24 26c4-3 10-4 16-4s12 1 16 4" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6" />
      {/* 服 */}
      <path d="M14 78c2-14 12-22 26-22s24 8 26 22z" fill="#0086cc" />
    </svg>
  );
}
