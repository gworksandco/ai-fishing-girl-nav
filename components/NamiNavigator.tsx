'use client';

import { AlertTriangle, Sparkles } from 'lucide-react';

type Props = {
  message: string;
  isAlert: boolean;
};

/**
 * AI釣りガール「ナミ」のナビゲーションヘッダー。
 * アバターは1枚の軽量WebP画像（24KB程度、320x320）で表示。
 * public/nami-avatar.webp を差し替えれば見た目を更新できる。
 * 「今日のラッキーカラー」はLuckyColorCard（別カード）で表示する。
 */
export default function NamiNavigator({ message, isAlert }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-ocean-500 to-ocean-700 p-4 text-white shadow-card sm:items-center sm:gap-4 sm:p-5">
      <NamiAvatar />
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-sm font-bold tracking-wide">ナミ</span>
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

// 画像を差し替えるたびにこの数字を1つ上げること。
// CloudflareやブラウザのCDNキャッシュがファイル名そのままだと更新後も
// 古い画像を返し続けることがあるため、クエリ文字列でキャッシュを強制的に無効化する。
const AVATAR_VERSION = 3;

/** ナミのアバター画像（軽量WebP、public/nami-avatar.webp） */
function NamiAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/nami-avatar.webp?v=${AVATAR_VERSION}`}
      alt="ナミのアバター"
      width={80}
      height={80}
      className="h-16 w-16 shrink-0 rounded-full border-2 border-white/40 object-cover sm:h-20 sm:w-20"
    />
  );
}
