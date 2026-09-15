import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI釣りガールナビ｜全国気象＆釣果ダッシュボード',
  description:
    'AI釣りガール「ナミ」が全国の海釣りエリアの気象・潮汐・釣果予測をナビゲート。維持費0円・爆速表示のプロトタイプ。',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen text-gray-800 antialiased">{children}</body>
    </html>
  );
}
