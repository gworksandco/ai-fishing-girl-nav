/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages（静的ホスティング）で配信するための完全静的エクスポート設定。
  // サーバーサイド機能（API Routes, ISR等）は使用しない。
  output: 'export',
  // 画像最適化はサーバーレス環境では使えないため無効化（軽量画像 or SVGのみ使用する前提）。
  images: {
    unoptimized: true,
  },
  // Cloudflare Pages は末尾スラッシュ付きの静的パスと相性が良いため有効化。
  trailingSlash: true,
  reactStrictMode: true,
};

module.exports = nextConfig;
