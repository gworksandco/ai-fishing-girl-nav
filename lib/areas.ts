// ============================================================================
// 全国釣りエリア・マスターデータ
// ----------------------------------------------------------------------------
// 新しいエリアを追加したい場合は、この配列に1オブジェクト追加するだけでOK。
// ドロップダウン・気象取得・タイドグラフ・X検索埋め込みが全て自動で連動する。
// ============================================================================

export type FishTarget = {
  /** ターゲット名（例: アジ） */
  name: string;
  /** 主な狙い目シーズン（1〜12月） */
  months: number[];
};

export type FishingArea = {
  /** 一意なID（URLやstateのkeyに使用） */
  id: string;
  /** 表示名 */
  name: string;
  /** 都道府県 */
  prefecture: string;
  /** 緯度 */
  lat: number;
  /** 経度 */
  lon: number;
  /** X（旧Twitter）検索用クエリ（#タグ OR 検索） */
  xQuery: string;
  /** このエリアで狙える代表的なターゲット（季節ロジックに使用） */
  targets: FishTarget[];
};

export const FISHING_AREAS: FishingArea[] = [
  {
    id: 'chita',
    name: '知多半島エリア',
    prefecture: '愛知県',
    lat: 34.69,
    lon: 136.95,
    xQuery: '#知多半島 釣果 OR #南知多 釣果 OR #豊浜港 OR #新舞子',
    targets: [
      { name: 'アジ', months: [4, 5, 6, 9, 10, 11] },
      { name: 'タチウオ', months: [8, 9, 10, 11] },
      { name: 'アオリイカ', months: [4, 5, 6, 10, 11, 12] },
      { name: 'メバル', months: [1, 2, 3, 12] },
    ],
  },
  {
    id: 'numazu',
    name: '沼津・駿河湾エリア',
    prefecture: '静岡県',
    lat: 35.1,
    lon: 138.86,
    xQuery: '#沼津 釣果 OR #駿河湾 釣果 OR #静浦港',
    targets: [
      { name: 'アジ', months: [3, 4, 5, 6, 10, 11] },
      { name: 'サバ', months: [6, 7, 8, 9] },
      { name: 'カサゴ', months: [1, 2, 3, 11, 12] },
      { name: 'キハダマグロ', months: [7, 8, 9] },
    ],
  },
  {
    id: 'itoshima',
    name: '糸島・福岡エリア',
    prefecture: '福岡県',
    lat: 33.56,
    lon: 130.19,
    xQuery: '#糸島 釣果 OR #福岡 釣果 OR #野北漁港',
    targets: [
      { name: 'アオリイカ', months: [5, 6, 10, 11, 12] },
      { name: 'キス', months: [5, 6, 7, 8, 9] },
      { name: 'チヌ', months: [3, 4, 5, 9, 10, 11] },
      { name: 'ヒラメ', months: [10, 11, 12, 1] },
    ],
  },
  {
    id: 'boso',
    name: '房総・館山エリア',
    prefecture: '千葉県',
    lat: 34.99,
    lon: 139.87,
    xQuery: '#館山 釣果 OR #房総 釣果 OR #洲崎',
    targets: [
      { name: 'イサキ', months: [5, 6, 7, 8] },
      { name: 'マダイ', months: [3, 4, 5, 11, 12] },
      { name: 'カツオ', months: [5, 6, 7] },
    ],
  },
  {
    id: 'wakayama',
    name: '和歌山・紀北エリア',
    prefecture: '和歌山県',
    lat: 34.23,
    lon: 135.17,
    xQuery: '#和歌山 釣果 OR #紀北 釣果 OR #加太',
    targets: [
      { name: 'マダイ', months: [3, 4, 5, 6, 11] },
      { name: 'アオリイカ', months: [4, 5, 6, 10, 11] },
      { name: 'グレ', months: [11, 12, 1, 2, 3] },
    ],
  },
  {
    id: 'niigata',
    name: '新潟・佐渡エリア',
    prefecture: '新潟県',
    lat: 37.9,
    lon: 139.02,
    xQuery: '#新潟 釣果 OR #佐渡 釣果 OR #新潟東港',
    targets: [
      { name: 'サワラ', months: [9, 10, 11] },
      { name: 'クロダイ', months: [6, 7, 8, 9] },
      { name: 'アオリイカ', months: [9, 10, 11] },
    ],
  },
  {
    id: 'okinawa',
    name: '沖縄・那覇エリア',
    prefecture: '沖縄県',
    lat: 26.21,
    lon: 127.68,
    xQuery: '#沖縄 釣り OR #那覇 釣果 OR #GT釣り',
    targets: [
      { name: 'GT(ロウニンアジ)', months: [4, 5, 6, 7, 8, 9] },
      { name: 'ミーバイ', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      { name: 'ダツ', months: [3, 4, 5, 10, 11] },
    ],
  },
  {
    id: 'hokkaido-hakodate',
    name: '函館エリア',
    prefecture: '北海道',
    lat: 41.77,
    lon: 140.73,
    xQuery: '#函館 釣果 OR #北海道 釣り OR #函館港',
    targets: [
      { name: 'イカ(スルメイカ)', months: [7, 8, 9, 10] },
      { name: 'ヒラメ', months: [6, 7, 8, 9] },
      { name: 'アキアジ(サケ)', months: [9, 10] },
    ],
  },
];

export const DEFAULT_AREA_ID = FISHING_AREAS[0].id;

export function getAreaById(id: string): FishingArea {
  return FISHING_AREAS.find((a) => a.id === id) ?? FISHING_AREAS[0];
}

/** 都道府県ごとにグルーピング（ドロップダウンのoptgroup用） */
export function groupAreasByPrefecture(): Record<string, FishingArea[]> {
  return FISHING_AREAS.reduce<Record<string, FishingArea[]>>((acc, area) => {
    if (!acc[area.prefecture]) acc[area.prefecture] = [];
    acc[area.prefecture].push(area);
    return acc;
  }, {});
}
