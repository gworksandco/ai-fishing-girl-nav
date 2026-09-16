'use client';

import { Clock } from 'lucide-react';
import type { WeatherData } from '@/lib/weather';
import { weatherCodeToLabel } from '@/lib/weather';

type Props = {
  weather: WeatherData | null;
};

/**
 * 現在時刻から数時間先までの気象予報を横スクロールで表示するカード。
 * 「今の天気」だけでなく、これから釣行する数時間の見通しを釣り人視点で確認できるようにする。
 */
export default function HourlyForecast({ weather }: Props) {
  if (!weather || weather.hourlyForecast.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ocean-900 sm:text-base">
        <Clock className="h-4 w-4 text-ocean-600" />
        数時間先の天気
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weather.hourlyForecast.map((h) => (
          <div
            key={h.time}
            className="flex min-w-[68px] flex-shrink-0 flex-col items-center gap-1 rounded-xl bg-ocean-50/60 px-2 py-3"
          >
            <span className="text-[11px] font-bold text-ocean-700">
              {new Date(h.time).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                timeZone: 'Asia/Tokyo',
              })}
            </span>
            <span className="text-[11px] text-gray-500">{weatherCodeToLabel(h.weatherCode)}</span>
            <span className="text-sm font-bold text-ocean-900">{Math.round(h.temperature)}°</span>
            <span className="text-[11px] text-sky-500">💧{h.precipitationProbability}%</span>
            <span className="text-[11px] text-gray-400">🌬{h.windSpeed.toFixed(1)}m/s</span>
          </div>
        ))}
      </div>
    </section>
  );
}
