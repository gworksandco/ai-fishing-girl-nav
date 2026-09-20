import type { FishingArea, FishTarget } from './areas';
import type { WeatherData } from './weather';
import { weatherCodeToLabel } from './weather';

// ============================================================================
// ナミ（AI釣りガール）のセリフ生成ロジック
// ============================================================================

export const WIND_ALERT_THRESHOLD = 5; // m/s

/**
 * 気圧トレンドのヒント。「気圧が下がるタイミングは魚の活性が上がりやすい」
 * という釣り人の間でよく言われる経験則をコメントにする。
 */
function getPressureHint(weather: WeatherData): string {
  if (weather.pressureTrend === 'falling') {
    return `気圧が3時間で${Math.abs(weather.pressureChange3h).toFixed(
      1
    )}hPa下降中！魚の活性が上がりやすいタイミングかも！`;
  }
  if (weather.pressureTrend === 'rising') {
    return '気圧は上昇中。やや渋い展開になりやすいから、粘り強くいこう！';
  }
  return '';
}

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

  // 潮のねらい目タイミング・気圧トレンドは、危険な強風時以外は常に伝える
  const tideHint = getTideTimingHint(area);
  const pressureHint = getPressureHint(weather);
  const detailHint = pressureHint ? `${tideHint}${pressureHint}` : tideHint;

  if (precipitationProbability >= 70) {
    return `${area.name}は雨降りそう…降水確率${precipitationProbability}%だから、雨具の準備を忘れずにね！${detailHint}`;
  }

  if (weatherCode <= 2 && windSpeed < 3) {
    return `${area.name}は絶好の釣り日和！${detailHint}`;
  }

  return `${area.name}の天気は${weatherCodeToLabel(
    weatherCode
  )}、風速${windSpeed.toFixed(1)}m/s。${detailHint}`;
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
// ナミの「ラッキーカラー」＆ルアー提案ロジック
// ----------------------------------------------------------------------------
// 時間帯（日の出・日の入りからの朝夕マズメ判定）と天候（降水確率・天気コード）
// から、以下3パターンのいずれかを決定的に判定する。
//   1. 夜間 or 濁り潮想定（降水確率高） → 夜光・チャート系
//   2. 朝マズメ／夕マズメ（日の出・日の入り前後1時間） → 赤金・ピンク系
//   3. 昼間の澄み潮想定（晴れ） → ナチュラル・シルバー系
// 優先順位はマズメ（もっとも限定的な時間帯）を最優先で判定する。
// ============================================================================

export type FishingConditionKey = 'night_glow' | 'mazume' | 'clear_day';

export type FishingCondition = {
  key: FishingConditionKey;
  label: string;
  luckyColors: string[];
  namiLine: string;
  lureName: string;
  lureSearchKeyword: string;
};

const MAZUME_WINDOW_MINUTES = 60; // 日の出・日の入り前後1時間

const FISHING_CONDITIONS: Record<FishingConditionKey, FishingCondition> = {
  night_glow: {
    key: 'night_glow',
    label: '夜間・濁り潮コンディション',
    luckyColors: ['チャート（蛍光黄緑）', 'グロー（夜光）'],
    namiLine:
      '夜や濁り潮の時はアピール力抜群の夜光カラーが圧倒的勝利！チャートグローが勝負色だよ！',
    lureName: '夜光ジグヘッド＋蛍光ワーム',
    lureSearchKeyword: '夜光 ジグヘッド 蛍光ワーム グロー',
  },
  clear_day: {
    key: 'clear_day',
    label: '日中・澄み潮コンディション',
    luckyColors: ['ナチュラル（シルバー・リアルイワシ）', 'クリア'],
    namiLine:
      'お日様ギラギラで海が澄んでるよ！見切られにくいリアルなシルバー系で自然に見せよう！',
    lureName: 'シルバー系メタルジグ / クリアワーム',
    lureSearchKeyword: 'シルバー メタルジグ クリアワーム',
  },
  mazume: {
    key: 'mazume',
    label: '朝マズメ・夕マズメ（チャンスタイム）',
    luckyColors: ['アカキン（赤金）', 'ピンク'],
    namiLine:
      '魚の活性が一番上がるチャンスタイム！視界に強烈アピールする赤金で一撃を狙ってね！',
    lureName: '赤金カラーのブレードジグ / 1.5インチピンクワーム',
    lureSearchKeyword: '赤金 ブレードジグ ピンクワーム 1.5インチ',
  },
};

function minutesBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60000;
}

/**
 * 気象データ（天気コード・降水確率・日の出/日の入り時刻）と現在時刻から、
 * ナミの「ラッキーカラー」判定ロジックの結果を返す。
 * weather が未取得（読み込み中）の場合は null を返す。
 */
export function getFishingCondition(
  weather: WeatherData | null,
  date: Date = new Date()
): FishingCondition | null {
  if (!weather || !weather.sunrise || !weather.sunset) return null;

  const sunrise = new Date(weather.sunrise);
  const sunset = new Date(weather.sunset);

  // 1. 朝マズメ／夕マズメ判定（もっとも限定的な時間帯なので最優先）
  const isDawnMazume = minutesBetween(date, sunrise) <= MAZUME_WINDOW_MINUTES;
  const isDuskMazume = minutesBetween(date, sunset) <= MAZUME_WINDOW_MINUTES;
  if (isDawnMazume || isDuskMazume) {
    return FISHING_CONDITIONS.mazume;
  }

  // 2. 夜間（日の出前・日の入り後） or 濁り潮想定（降水確率が高い）
  const isNight = date.getTime() < sunrise.getTime() || date.getTime() > sunset.getTime();
  const isTurbid = weather.precipitationProbability >= 50;
  if (isNight || isTurbid) {
    return FISHING_CONDITIONS.night_glow;
  }

  // 3. 上記以外＝日中の澄み潮想定
  return FISHING_CONDITIONS.clear_day;
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

/**
 * 月齢っぽい満ち欠け（大潮/小潮）を年間通日から簡易算出する係数（0.3〜1.0）。
 * 実際の月齢とは連動していないが、約14.76日周期で大潮・小潮を繰り返す
 * という潮汐の基本パターンを模している。エリアには依存しない（実際の
 * 大潮・小潮は地域共通の天文現象のため）。
 */
function getSpringNeapFactor(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  return 0.65 + 0.35 * Math.sin((dayOfYear / 14.76) * Math.PI * 2);
}

export type TidePhaseName = '大潮' | '中潮' | '小潮' | '長潮' | '若潮';

/** 潮回り（大潮〜若潮）のラベルを返す。簡易シミュレーションに基づく目安。 */
export function getTidePhaseLabel(date: Date = new Date()): TidePhaseName {
  const factor = getSpringNeapFactor(date);
  if (factor >= 0.9) return '大潮';
  if (factor >= 0.75) return '中潮';
  if (factor >= 0.55) return '小潮';
  if (factor >= 0.4) return '長潮';
  return '若潮';
}

export function generateTideCurve(area: FishingArea, date: Date = new Date()): TidePoint[] {
  const dayPhase = seededFraction(area.id) * Math.PI * 2;
  const springNeapFactor = getSpringNeapFactor(date);

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
  const phase = getTidePhaseLabel(date);

  if (extremes.length === 0) return `今日は${phase}。潮の動きをチェックして狙ってみてね！`;

  const now = date.getTime();
  const upcoming = extremes.find((e) => new Date(e.time).getTime() > now);
  // 本日分に「これから来る山・谷」が無ければ、直近(末尾)のものを参考として使う
  const target = upcoming ?? extremes[extremes.length - 1];
  const timeStr = formatJstTime(target.time);

  if (target.type === 'high') {
    return `今日は${phase}！今は上げ潮！${timeStr}ごろの満潮に向けてが狙い目だよ！`;
  }
  return `今日は${phase}。今は下げ潮で、${timeStr}ごろが干潮の底。そこから上げ潮に変わるタイミングも狙い目だよ！`;
}

// ============================================================================
// 本日のねらい目タイム（潮の動き × マズメ × 気圧 の総合判定）
// ----------------------------------------------------------------------------
// 「潮がよく動く時間帯」「朝夕マズメ」を軸にスコアリングし、本日これからの
// 時間の中で最もスコアが高い30分ポイントを「ねらい目」として提示する。
// 気圧トレンドは特定の時間帯に紐づく情報ではないため、補足コメントとして添える。
// ============================================================================

export type PeakActivityWindow = {
  startTime: string; // ISO
  endTime: string; // ISO
  reasons: string[]; // 例: ['夕マズメ', '潮がよく動く時間帯']
};

const TIDE_FLOW_SCORE_UNIT = 1; // 30分あたりの潮位変化量1につき加算するスコア
const MAZUME_SCORE_BONUS = 5; // マズメ帯への加点（潮の動きより優先させたい）
const TIDE_FLOW_NOTABLE_THRESHOLD = 2; // これ以上の潮位変化で「よく動く」とみなす

export function getPeakActivityWindow(
  area: FishingArea,
  weather: WeatherData | null,
  date: Date = new Date()
): PeakActivityWindow | null {
  const points = generateTideCurve(area, date);
  const future = points.filter((p) => new Date(p.time).getTime() >= date.getTime());
  if (future.length < 2) return null;

  const sunrise = weather?.sunrise ? new Date(weather.sunrise) : null;
  const sunset = weather?.sunset ? new Date(weather.sunset) : null;

  let best: { point: TidePoint; score: number; reasons: string[] } | null = null;

  for (let i = 0; i < future.length - 1; i++) {
    const point = future[i];
    const next = future[i + 1];
    const flow = Math.abs(next.level - point.level);
    const t = new Date(point.time).getTime();

    let score = flow * TIDE_FLOW_SCORE_UNIT;
    const reasons: string[] = [];
    if (flow >= TIDE_FLOW_NOTABLE_THRESHOLD) reasons.push('潮がよく動く時間帯');

    if (sunrise && minutesBetween(new Date(t), sunrise) <= MAZUME_WINDOW_MINUTES) {
      score += MAZUME_SCORE_BONUS;
      reasons.push('朝マズメ');
    }
    if (sunset && minutesBetween(new Date(t), sunset) <= MAZUME_WINDOW_MINUTES) {
      score += MAZUME_SCORE_BONUS;
      reasons.push('夕マズメ');
    }

    if (!best || score > best.score) {
      best = { point, score, reasons };
    }
  }

  if (!best) return null;

  const centerMs = new Date(best.point.time).getTime();
  return {
    startTime: new Date(centerMs - 30 * 60000).toISOString(),
    endTime: new Date(centerMs + 30 * 60000).toISOString(),
    reasons: best.reasons.length > 0 ? best.reasons : ['潮の動き'],
  };
}

/** 「本日のねらい目タイム」をまとめて一文で表示するためのヒント文。 */
export function getPeakActivityHint(
  area: FishingArea,
  weather: WeatherData | null,
  date: Date = new Date()
): string {
  const window = getPeakActivityWindow(area, weather, date);
  if (!window) return '本日はこれ以上のねらい目タイムはなさそうだよ。潮の動きをチェックしてみてね！';

  const startStr = formatJstTime(window.startTime);
  const endStr = formatJstTime(window.endTime);
  const reasonStr = window.reasons.join('×');

  let text = `本日のねらい目は ${startStr}〜${endStr}（${reasonStr}）！`;
  if (weather?.pressureTrend === 'falling') {
    text += ' 気圧も下降中で、活性アップも期待できるよ！';
  }
  return text;
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

// 楽天アフィリエイトの「アフィリエイトID」。
// 楽天アフィリエイト（https://affiliate.rakuten.co.jp/）で発行したテキストリンクの
// href（https://hb.afl.rakuten.co.jp/ichiba/【ここ】/?pc=...）から取得した値。
const RAKUTEN_AFFILIATE_ID = '57966afe.3e7e1374.57966aff.e3c4c8de';

export function buildRakutenSearchUrl(keyword: string): string {
  const searchUrl = `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;

  if (!RAKUTEN_AFFILIATE_ID) {
    return searchUrl;
  }

  const encodedTarget = encodeURIComponent(searchUrl);
  return `https://hb.afl.rakuten.co.jp/ichiba/${RAKUTEN_AFFILIATE_ID}/?pc=${encodedTarget}&m=${encodedTarget}`;
}

export function buildXSearchUrl(query: string): string {
  return `https://twitter.com/search?q=${encodeURIComponent(query)}&f=live`;
}
