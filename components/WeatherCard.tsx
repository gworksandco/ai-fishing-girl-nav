'use client';

import type { ReactNode } from 'react';
import {
  Wind,
  Thermometer,
  Droplets,
  CloudRain,
  Compass,
  AlertTriangle,
  Loader2,
  Gauge,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { degreeToCompass, weatherCodeToLabel, type WeatherData } from '@/lib/weather';
import { WIND_ALERT_THRESHOLD, type SeaTemperatureInsight } from '@/lib/logic';

type Props = {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  seaTemperatureInsight?: SeaTemperatureInsight | null;
};

export default function WeatherCard({ weather, loading, error, seaTemperatureInsight }: Props) {
  const isWindAlert = !!weather && weather.windSpeed >= WIND_ALERT_THRESHOLD;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-ocean-900 sm:text-base">
        本日の海気象データ
        <span className="ml-2 text-xs font-normal text-gray-400">Open-Meteo</span>
      </h2>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          気象データを取得中…
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-3 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {weather && !loading && !error && (
        <>
          {isWindAlert && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-coral-500/10 px-3 py-2 text-sm font-semibold text-coral-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              強風注意：風速 {weather.windSpeed.toFixed(1)} m/s（{WIND_ALERT_THRESHOLD}m/s以上）
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            <StatTile
              icon={<Wind className={isWindAlert ? 'text-coral-500' : 'text-ocean-600'} />}
              label="風速"
              value={`${weather.windSpeed.toFixed(1)}`}
              unit="m/s"
              alert={isWindAlert}
            />
            <StatTile
              icon={<Compass className="text-ocean-600" />}
              label="風向き"
              value={degreeToCompass(weather.windDirection)}
              unit=""
            />
            <StatTile
              icon={<Thermometer className="text-ocean-600" />}
              label="気温"
              value={`${weather.temperature.toFixed(1)}`}
              unit="℃"
            />
            <StatTile
              icon={<Droplets className={seaTemperatureInsight?.favorable ? 'text-coral-500' : 'text-ocean-600'} />}
              label="水温"
              value={weather.seaTemperature != null ? `${weather.seaTemperature.toFixed(1)}` : '—'}
              unit="℃"
              alert={!!seaTemperatureInsight?.favorable}
            />
            <StatTile
              icon={<CloudRain className="text-ocean-600" />}
              label="降水確率"
              value={`${Math.round(weather.precipitationProbability)}`}
              unit="%"
            />
            <StatTile
              icon={<PressureTrendIcon trend={weather.pressureTrend} />}
              label="気圧"
              value={`${weather.pressure.toFixed(0)}`}
              unit="hPa"
              alert={weather.pressureTrend === 'falling'}
            />
          </div>
          {weather.pressureTrend === 'falling' && (
            <p className="mt-2 text-[11px] font-semibold text-coral-500">
              気圧下降中（3時間で{Math.abs(weather.pressureChange3h).toFixed(1)}hPa）：魚の活性が上がりやすいサインだよ
            </p>
          )}
          {seaTemperatureInsight && (
            <p
              className={`mt-2 text-[11px] font-semibold ${
                seaTemperatureInsight.favorable ? 'text-coral-500' : 'text-gray-400'
              }`}
            >
              {seaTemperatureInsight.text}
            </p>
          )}
          <p className="mt-3 text-xs text-gray-400">
            現在の空模様：{weatherCodeToLabel(weather.weatherCode)}
          </p>
          <p className="mt-1 text-[10px] text-gray-300">※水温はモデル推定値の目安です</p>
        </>
      )}
    </section>
  );
}

function PressureTrendIcon({ trend }: { trend: WeatherData['pressureTrend'] }) {
  if (trend === 'falling') return <TrendingDown className="text-coral-500" />;
  if (trend === 'rising') return <TrendingUp className="text-ocean-600" />;
  return <Gauge className="text-ocean-600" />;
}

function StatTile({
  icon,
  label,
  value,
  unit,
  alert,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-center ${
        alert ? 'bg-coral-500/10' : 'bg-ocean-50'
      }`}
    >
      <div className="mb-1 h-5 w-5">{icon}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${alert ? 'text-coral-600' : 'text-ocean-900'}`}>
        {value}
        <span className="ml-0.5 text-xs font-normal text-gray-400">{unit}</span>
      </div>
    </div>
  );
}
