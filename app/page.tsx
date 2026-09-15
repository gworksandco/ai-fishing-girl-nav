'use client';

import { useEffect, useState } from 'react';
import { Anchor } from 'lucide-react';
import AreaSelector from '@/components/AreaSelector';
import NamiNavigator from '@/components/NamiNavigator';
import WeatherCard from '@/components/WeatherCard';
import TideChart from '@/components/TideChart';
import CatchSection from '@/components/CatchSection';
import TackleAffiliate from '@/components/TackleAffiliate';
import { DEFAULT_AREA_ID, getAreaById } from '@/lib/areas';
import { fetchWeather, type WeatherData } from '@/lib/weather';
import { getNamiMessage, predictTargets, WIND_ALERT_THRESHOLD } from '@/lib/logic';

export default function Home() {
  const [areaId, setAreaId] = useState(DEFAULT_AREA_ID);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const area = getAreaById(areaId);
  const targets = predictTargets(area);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setWeather(null);

    fetchWeather(area.lat, area.lon)
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setError('気象データの取得に失敗しました。時間を置いて再度お試しください。');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [area.lat, area.lon]);

  const namiMessage = getNamiMessage(area, weather);
  const isAlert = !!weather && weather.windSpeed >= WIND_ALERT_THRESHOLD;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 py-5 sm:gap-5 sm:px-6 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Anchor className="h-6 w-6 text-ocean-600" />
          <h1 className="text-base font-extrabold text-ocean-900 sm:text-xl">
            AI釣りガールナビ
            <span className="ml-1 hidden text-xs font-medium text-gray-400 sm:inline">
              全国対応 気象＆釣果ダッシュボード
            </span>
          </h1>
        </div>
      </header>

      <AreaSelector selectedAreaId={areaId} onChange={setAreaId} />

      <NamiNavigator message={namiMessage} isAlert={isAlert} />

      <WeatherCard weather={weather} loading={loading} error={error} />

      <TideChart area={area} />

      <CatchSection area={area} targets={targets} />

      <TackleAffiliate targets={targets} />

      <footer className="mt-2 pb-4 text-center text-[11px] text-gray-400">
        気象データ提供: Open-Meteo.com ／ 本サイトはプロトタイプです。潮汐値は簡易シミュレーションです。
      </footer>
    </main>
  );
}
