// ============================================================================
// Open-Meteo API 連携（無料・APIキー不要）
// https://open-meteo.com/
// クライアントサイドから直接fetchするため、サーバー・DBは一切不要。
// ============================================================================

export type WeatherData = {
  temperature: number; // 気温 (℃)
  windSpeed: number; // 風速 (m/s)
  windDirection: number; // 風向き (度: 0=北, 90=東, 180=南, 270=西)
  precipitationProbability: number; // 降水確率 (%)
  weatherCode: number; // WMO Weather code
  sunrise: string; // 日の出時刻 (ISO, ローカルタイム)
  sunset: string; // 日の入り時刻 (ISO, ローカルタイム)
  fetchedAt: string; // 取得時刻 (ISO)
};

/** WMO Weather interpretation codes（簡易版） */
export function weatherCodeToLabel(code: number): string {
  if (code === 0) return '快晴';
  if (code <= 2) return '晴れ';
  if (code === 3) return 'くもり';
  if (code === 45 || code === 48) return '霧';
  if (code >= 51 && code <= 57) return '霧雨';
  if (code >= 61 && code <= 67) return '雨';
  if (code >= 71 && code <= 77) return '雪';
  if (code >= 80 && code <= 82) return 'にわか雨';
  if (code >= 95) return '雷雨';
  return '不明';
}

/** 16方位に変換 */
export function degreeToCompass(deg: number): string {
  const dirs = [
    '北', '北北東', '北東', '東北東',
    '東', '東南東', '南東', '南南東',
    '南', '南南西', '南西', '西南西',
    '西', '西北西', '北西', '北北西',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * 指定した緯度・経度の現在の海気象データを取得する。
 * - 風速は m/s 単位で取得（wind_speed_unit=ms）
 * - 降水確率は hourly から現在時刻に最も近い値を採用
 */
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,weather_code',
    hourly: 'precipitation_probability',
    daily: 'sunrise,sunset',
    wind_speed_unit: 'ms',
    timezone: 'Asia/Tokyo',
    forecast_days: '1',
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo APIエラー: ${res.status}`);
  }

  const json = await res.json();

  const current = json.current ?? {};
  const hourlyTimes: string[] = json.hourly?.time ?? [];
  const hourlyPop: number[] = json.hourly?.precipitation_probability ?? [];

  // 現在時刻に一番近いhourlyインデックスを探す
  let popIdx = 0;
  if (hourlyTimes.length > 0) {
    const now = Date.now();
    let minDiff = Infinity;
    hourlyTimes.forEach((t, i) => {
      const diff = Math.abs(new Date(t).getTime() - now);
      if (diff < minDiff) {
        minDiff = diff;
        popIdx = i;
      }
    });
  }

  const daily = json.daily ?? {};
  const sunrise: string = daily.sunrise?.[0] ?? '';
  const sunset: string = daily.sunset?.[0] ?? '';

  return {
    temperature: current.temperature_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    windDirection: current.wind_direction_10m ?? 0,
    precipitationProbability: hourlyPop[popIdx] ?? 0,
    weatherCode: current.weather_code ?? 0,
    sunrise,
    sunset,
    fetchedAt: current.time ?? new Date().toISOString(),
  };
}
