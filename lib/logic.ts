import type { FishingArea, FishTarget } from './areas';
import type { WeatherData } from './weather';
import { weatherCodeToLabel } from './weather';

// ============================================================================
// ナミ（AI釣りガール）のセリフ生成ロジック
// ============================================================================

export const WIND_ALERT_THRESHOLD = 5; // m/s

export function getNamiMessage(area: FishingArea, weather: WeatherData | null): string {
  if (!weather) {
    return `${area.name}の気象データを読み込み中だよ、ちょっと待っててね！`;
  }

  const { windSpeed, precipitationProbability, weatherCode } = weather;

  if (windSpeed >= WIND_ALERT_THRESHOLD) {
    return `${area.name}は今日風が強くて危ないよ！（風速${windSpeed.toFixed(
      1
    )}m/s）無理せず安全第一でね！`;
  }

  if (precipitationProbability >= 70) {
    return `${area.name}は雨降りそう…降水確率${precipitationProbability}%だから、雨具の準備を忘れずにね！`;
  }

  if (weatherCode <= 2 && windSpeed < 3) {
    const tideHint = getTideTimingHint(area);
    return `${area.name}は絶好の釣り日和！${tideHint}`;
  }

  return `${area.name}の天気は${weatherCodeToLabel(
    weatherCode
  )}、風速${windSpeed.toFixed(1)}m/s。無理のない範囲で楽しんでね！`;
}

// ============================================================================
// 今週のおすすめターゲット予測（季節ロジック）
// ============================================================================

export function predictTargets(area: FishingArea, date: Date = new Date()): FishTarget[] {
  const month = date.getMonth() + 1;
  const inSeason = area.targets.filter((t) => t.months.includes(month));
  if (inSeason.length > 0) return inSeason;
  // シーズン外の場合は登録済みターゲットを全て返す（フォールバック）
  return area.targets;
}

// ============================================================================
// 潮汐（タイド）シミュレーション
// ----------------------------------------------------------------------------
// ※本プロトタイプでは、重い潮汐データベースやAPIキーが必要な外部サービスを
//   使わず、半日周潮（M2）+ 日周潮（K1）を模した簡易サインカーブで
//   「それらしい」潮位変化を生成している。実運用では気象庁 or 海保のAPIに
//   差し替え可能な設計。
// ============================================================================

export type TidePoint = { time: string; level: number; hour: number };
export type TideExtreme = { type: 'high' | 'low'; time: string; level: number };

/** 文字列から決定的な0-1の疑似乱数シードを作る（エリアごとに潮汐パターンを変化させるため） */
function seededFraction(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

export function generateTideCurve(area: FishingArea, date: Date = new Date()): TidePoint[] {
  const dayPhase = seededFraction(area.id) * Math.PI * 2;
  // 月齢っぽい満ち欠け（大潮/小潮）を年間通日から簡易算出
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const springNeapFactor = 0.65 + 0.35 * Math.sin((dayOfYear / 14.76) * Math.PI * 2);

  const points: TidePoint[] = [];
  for (let i = 0; i <= 48; i++) {
    const hour = i / 2; // 30分刻み
    // M2半日周潮（周期約12.42h）+ K1日周潮（周期約23.93h）
    const m2 = Math.sin((2 * Math.PI * hour) / 12.42 + dayPhase);
    const k1 = 0.35 * Math.sin((2 * Math.PI * hour) / 23.93 + dayPhase * 0.5);
    const level = 50 + springNeapFactor * 40 * m2 + k1 * 15;

    const t = new Date(date);
    t.setHours(0, 0, 0, 0);
    t.setMinutes(t.getMinutes() + hour * 60);

    points.push({
      time: t.toISOString(),
      level: Math.round(level * 10) / 10,
      hour,
    });
  }
  return points;
}

export function findTideExtremes(points: TidePoint[]): TideExtreme[] {
  const extremes: TideExtreme[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const next = points[i + 1];
    if (cur.level > prev.level && cur.level > next.level) {
      extremes.push({ type: 'high', time: cur.time, level: cur.level });
    } else if (cur.level < prev.level && cur.level < next.level) {
      extremes.push({ type: 'low', time: cur.time, level: cur.level });
    }
  }
  return extremes;
}

export function formatJstTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });
}

/**
 * 「上げ潮タイム」を具体的な時刻で示すヒント文を生成する。
 * 直近の満潮・干潮の時刻から、今が上げ潮／下げ潮のどちらで、
 * 次の山（満潮）または谷（干潮）が何時ごろかを分かりやすく返す。
 */
export function getTideTimingHint(area: FishingArea, date: Date = new Date()): string {
  const points = generateTideCurve(area, date);
  const extremes = findTideExtremes(points);

  if (extremes.length === 0) return '潮の動きをチェックして狙ってみてね！';

  const now = date.getTime();
  const upcoming = extremes.find((e) => new Date(e.time).getTime() > now);
  // 本日分に「これから来る山・谷」が無ければ、直近(末尾)のものを参考として使う
  const target = upcoming ?? extremes[extremes.length - 1];
  const timeStr = formatJstTime(target.time);

  if (target.type === 'high') {
    return `今は上げ潮！${timeStr}ごろの満潮に向けてが狙い目だよ！`;
  }
  return `今は下げ潮で、${timeStr}ごろが干潮の底。そこから上げ潮に変わるタイミングも狙い目だよ！`;
}

// ============================================================================
// ターゲット別おすすめ仕掛け（アフィリエイト導線用マスターデータ）
// ============================================================================

export type TackleRecommendation = {
  target: string;
  title: string;
  description: string;
  amazonKeyword: string;
  rakutenKeyword: string;
};

const TACKLE_MASTER: Record<string, Omit<TackleRecommendation, 'target'>> = {
  'アジ': {
    title: 'サビキ仕掛け 6本針セット',
    description: '堤防アジングの定番。コマセカゴ付きで初心者でも簡単に数釣りが狙える。',
    amazonKeyword: 'サビキ仕掛け 6本針',
    rakutenKeyword: 'サビキ仕掛けセット',
  },
  'タチウオ': {
    title: 'ワインド用ジグヘッド＆ワームセット',
    description: '夜釣りのタチウオ狙いに。ゆっくりフォールで食わせの間を作るのがコツ。',
    amazonKeyword: 'タチウオ ワインド ジグヘッド',
    rakutenKeyword: 'タチウオ ワームセット',
  },
  'アオリイカ': {
    title: 'エギ 3.5号 秋イカ対応セット',
    description: '秋の新子から親イカまで対応できる定番サイズ。カラーローテーションで反応をチェック。',
    amazonKeyword: 'エギ 3.5号 セット',
    rakutenKeyword: 'エギング エギ セット',
  },
  'メバル': {
    title: 'メバリング ジグ単セット（0.6-1.5g）',
    description: '常夜灯周りのライトゲームに最適。軽量ジグヘッドで自然な漂わせを演出。',
    amazonKeyword: 'メバリング ジグヘッド セット',
    rakutenKeyword: 'メバリング ワーム セット',
  },
  'サバ': {
    title: 'サビキ・カゴ釣りセット（サバ対応強化版）',
    description: '引きの強いサバに対応した太めハリス仕様。ファミリーフィッシングにも人気。',
    amazonKeyword: 'サビキ 仕掛け サバ用',
    rakutenKeyword: 'カゴ釣りセット サバ',
  },
  'カサゴ': {
    title: 'ロックフィッシュ用テキサスリグセット',
    description: '穴撃ち・根魚狙いの定番リグ。根掛かりに強いオフセットフック採用。',
    amazonKeyword: 'テキサスリグ ロックフィッシュ',
    rakutenKeyword: 'ロックフィッシュ 仕掛けセット',
  },
  'キハダマグロ': {
    title: 'オフショアジギングロッド対応メタルジグセット',
    description: '青物・マグロクラスに対応した高強度アシストフック付きジグ。',
    amazonKeyword: 'メタルジグ セット オフショア',
    rakutenKeyword: 'ジギング メタルジグ セット',
  },
  'キス': {
    title: '投げ釣り天秤＆キス仕掛けセット',
    description: '遠投で広範囲を探れる定番セット。砂浜・堤防どちらにも対応。',
    amazonKeyword: '投げ釣り キス仕掛け セット',
    rakutenKeyword: '天秤 キス仕掛け',
  },
  'チヌ': {
    title: 'ヘチ・落とし込み用チヌ針セット',
    description: '堤防際を丁寧に探るクロダイ狙いの定番スタイル。',
    amazonKeyword: 'チヌ針 セット ヘチ釣り',
    rakutenKeyword: 'クロダイ仕掛け セット',
  },
  'ヒラメ': {
    title: '泳がせ釣り・ワインド兼用タックルセット',
    description: '活き餌泳がせからルアーワインドまで対応できる万能セット。',
    amazonKeyword: 'ヒラメ 泳がせ 仕掛け',
    rakutenKeyword: 'ヒラメ ワインド セット',
  },
  'イサキ': {
    title: 'コマセ真鯛・イサキ兼用仕掛け',
    description: '船釣りでの中層狙いに最適な軽量コマセ仕掛け。',
    amazonKeyword: 'イサキ 仕掛け コマセ',
    rakutenKeyword: 'イサキ釣り仕掛けセット',
  },
  'マダイ': {
    title: 'タイラバセット（鯛ラバ）',
    description: '手軽に始められる鯛ラバ入門セット。巻くだけで誘える人気ジャンル。',
    amazonKeyword: 'タイラバ セット 初心者',
    rakutenKeyword: '鯛ラバ セット',
  },
  'カツオ': {
    title: 'カツオ一本釣り用ルアーセット',
    description: 'ナブラ撃ちに対応した高比重キャスティングルアー。',
    amazonKeyword: 'カツオ ルアー キャスティング',
    rakutenKeyword: 'カツオ 一本釣り ルアー',
  },
  'グレ': {
    title: 'フカセ釣り グレ針＆ウキセット',
    description: '磯からの本格フカセ釣りに。潮の流れを活かしたナチュラルな誘いが決め手。',
    amazonKeyword: 'フカセ釣り グレ仕掛け',
    rakutenKeyword: 'グレ釣り ウキセット',
  },
  'サワラ': {
    title: 'サゴシ・サワラ用ワイヤーリーダーセット',
    description: '鋭い歯対策のワイヤーリーダー付き。青物ルアーゲームの定番。',
    amazonKeyword: 'サワラ ワイヤーリーダー ルアー',
    rakutenKeyword: 'サゴシ 仕掛け セット',
  },
  'クロダイ': {
    title: 'ダンゴ釣り・クロダイ仕掛けセット',
    description: '紀州釣りスタイルの定番。集魚効果の高いダンゴエサ対応。',
    amazonKeyword: 'クロダイ ダンゴ釣り セット',
    rakutenKeyword: '紀州釣り 仕掛けセット',
  },
  'GT(ロウニンアジ)': {
    title: 'GTポッピング用ヘビータックルセット',
    description: '大型GTとの真っ向勝負に耐える高強度ライン＆フック仕様。',
    amazonKeyword: 'GT ポッピング ルアー ヘビー',
    rakutenKeyword: 'ロウニンアジ ルアーセット',
  },
  'ミーバイ': {
    title: '穴釣り・ミーバイ用エサ釣りセット',
    description: 'サンゴ礁の穴撃ちに最適な根魚定番スタイル。',
    amazonKeyword: 'ミーバイ 穴釣り 仕掛け',
    rakutenKeyword: '沖縄 根魚 仕掛けセット',
  },
  'ダツ': {
    title: 'ライトルアー・ダツ対応セット',
    description: '表層を素早く泳ぐダツ狙いにはミノー系ルアーが有効。',
    amazonKeyword: 'ダツ ルアー ミノー',
    rakutenKeyword: 'ライトゲーム ミノーセット',
  },
  'イカ(スルメイカ)': {
    title: '自動イカ釣り機対応 イカ角セット',
    description: '北海道の定番、スルメイカ狙いのプヤ・イカ角セット。',
    amazonKeyword: 'イカ角 セット スルメイカ',
    rakutenKeyword: 'イカ釣り 仕掛けセット',
  },
  'アキアジ(サケ)': {
    title: 'サーモン用ルアー・ウキ釣りセット',
    description: '秋の遡上シーズンに合わせたアキアジ狙いの定番セット。',
    amazonKeyword: 'アキアジ ルアー セット',
    rakutenKeyword: 'サケ釣り 仕掛けセット',
  },
};

const DEFAULT_TACKLE: Omit<TackleRecommendation, 'target'> = {
  title: '万能仕掛けスターターセット',
  description: '複数ターゲットに対応できる汎用仕掛け。まずはここから始めてみよう。',
  amazonKeyword: '海釣り 仕掛け セット 初心者',
  rakutenKeyword: '海釣り 仕掛けセット',
};

export function getTackleRecommendation(targetName: string): TackleRecommendation {
  const base = TACKLE_MASTER[targetName] ?? DEFAULT_TACKLE;
  return { target: targetName, ...base };
}

export function buildAmazonSearchUrl(keyword: string): string {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}&tag=YOUR_ASSOCIATE_ID-22`;
}

export function buildRakutenSearchUrl(keyword: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(
    keyword
  )}/?scid=af_pc_link_YOUR_AFFILIATE_ID`;
}

export function buildXSearchUrl(query: string): string {
  return `https://twitter.com/search?q=${encodeURIComponent(query)}&f=live`;
}
