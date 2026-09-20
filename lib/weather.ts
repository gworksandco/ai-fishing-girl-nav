// ============================================================================
// Open-Meteo API 連携（無料・APIキー不要）
// https://open-meteo.com/
// クライアントサイドから直接fetchするため、サーバー・DBは一切不要。
// ============================================================================

export type HourlyForecastPoint = {
  time: string; // ISO, ローカルタイム
  temperature: number; // 気温 (℃)
  windSpeed: number; // 風速 (m/s)
  precipitationProbability: number; // 降水確率 (%)
  weatherCode: number; // WMO Weather code
};

export type PressureTrend = 'falling' | 'rising' | 'stable';

export type WeatherData = {
  temperature: number; // 気温 (℃)
  windSpeed: number; // 風速 (m/s)
  windDirection: number; // 風向き (度: 0=北, 90=東, 180=南, 270=西)
  precipitationProbability: number; // 降水確率 (%)
  weatherCode: number; // WMO Weather code
  sunrise: string; // 日の出時刻 (ISO, ローカルタイム)
  sunset: string; // 日の入り時刻 (ISO, ローカルタイム)
  pressure: number; // 海面気圧 (hPa)
  pressureChange3h: number; // 3時間前からの気圧変化 (hPa、負なら下降中)
  pressureTrend: PressureTrend; // 気圧が下降中の方が魚の活性が上がるとされる（経験則）
  hourlyForecast: HourlyForecastPoint[]; // 現在時刻から数時間先までの予報（釣行計画用）
  seaTemperature: number | null; // 海面水温 (℃、モデル推定値)。取得失敗時はnull
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
const MARINE_API_BASE = 'https://marine-api.open-meteo.com/v1/marine';

/**
 * 指定した緯度・経度の現在の海気象データを取得する。
 * - 風速は m/s 単位で取得（wind_speed_unit=ms）
 * - 降水確率は hourly から現在時刻に最も近い値を採用
 */
const HOURLY_FORECAST_HOURS = 6; // 数時間先の予報として表示する時間数
const PRESSURE_TREND_WINDOW_HOURS = 3; // 気圧トレンドを見る過去の時間幅
const PRESSURE_TREND_THRESHOLD_HPA = 1.0; // このhPa以上の変化があればトレンドありと判定

/**
 * Open-Meteo Marine Weather API（無料・APIキー不要）から海面水温を取得する。
 * 内湾・漁港など狭い場所ではモデル解像度の関係で実際の水温とズレることがあるため、
 * あくまで目安値。取得に失敗しても本体の気象データ表示は止めたくないので、
 * エラー時は例外を投げずnullを返す。
 */
async function fetchSeaTemperature(lat: number, lon: number): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'sea_surface_temperature',
      timezone: 'Asia/Tokyo',
    });
    const res = await fetch(`${MARINE_API_BASE}?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const json = await res.json();
    const temp = json.current?.sea_surface_temperature;
    return typeof temp === 'number' ? Math.round(temp * 10) / 10 : null;
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,wind_speed_10m,wind_direction_10m,weather_code,pressure_msl',
    hourly: 'temperature_2m,precipitation_probability,wind_speed_10m,weather_code,pressure_msl',
    daily: 'sunrise,sunset',
    wind_speed_unit: 'ms',
    timezone: 'Asia/Tokyo',
    // 気圧トレンド判定のために直近の実績値も取得する
    past_days: '1',
    // 深夜近くに見ても数時間先まで予報が切れないよう2日分取得する
    forecast_days: '2',
  });

  // 海面水温は別APIなので、本体の気象データ取得と並行して走らせておく
  const seaTemperaturePromise = fetchSeaTemperature(lat, lon);

  const res = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo APIエラー: ${res.status}`);
  }

  const json = await res.json();

  const current = json.current ?? {};
  const hourlyTimes: string[] = json.hourly?.time ?? [];
  const hourlyTemp: number[] = json.hourly?.temperature_2m ?? [];
  const hourlyPop: number[] = json.hourly?.precipitation_probability ?? [];
  const hourlyWind: number[] = json.hourly?.wind_speed_10m ?? [];
  const hourlyCode: number[] = json.hourly?.weather_code ?? [];
  const hourlyPressure: number[] = json.hourly?.pressure_msl ?? [];

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

  const hourlyForecast: HourlyForecastPoint[] = hourlyTimes
    .slice(popIdx, popIdx + HOURLY_FORECAST_HOURS)
    .map((t, i) => {
      const idx = popIdx + i;
      return {
        time: t,
        temperature: hourlyTemp[idx] ?? 0,
        windSpeed: hourlyWind[idx] ?? 0,
        precipitationProbability: hourlyPop[idx] ?? 0,
        weatherCode: hourlyCode[idx] ?? 0,
      };
    });

  const daily = json.daily ?? {};
  const sunrise: string = daily.sunrise?.[0] ?? '';
  const sunset: string = daily.sunset?.[0] ?? '';

  // 気圧トレンド判定（過去days=1を含めて取得しているので、popIdxより前を参照できる）
  const currentPressure = current.pressure_msl ?? hourlyPressure[popIdx] ?? 0;
  const pastIdx = Math.max(0, popIdx - PRESSURE_TREND_WINDOW_HOURS);
  const pastPressure = hourlyPressure[pastIdx] ?? currentPressure;
  const pressureChange3h = Math.round((currentPressure - pastPressure) * 10) / 10;

  let pressureTrend: PressureTrend = 'stable';
  if (pressureChange3h <= -PRESSURE_TREND_THRESHOLD_HPA) {
    pressureTrend = 'falling';
  } else if (pressureChange3h >= PRESSURE_TREND_THRESHOLD_HPA) {
    pressureTrend = 'rising';
  }

  const seaTemperature = await seaTemperaturePromise;

  return {
    temperature: current.temperature_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    windDirection: current.wind_direction_10m ?? 0,
    precipitationProbability: hourlyPop[popIdx] ?? 0,
    weatherCode: current.weather_code ?? 0,
    sunrise,
    sunset,
    pressure: Math.round(currentPressure * 10) / 10,
    pressureChange3h,
    pressureTrend,
    hourlyForecast,
    seaTemperature,
    fetchedAt: current.time ?? new Date().toISOString(),
  };
}
