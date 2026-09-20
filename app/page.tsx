'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Anchor } from 'lucide-react';
import AreaSelector from '@/components/AreaSelector';
import NamiNavigator from '@/components/NamiNavigator';
import LuckyColorCard from '@/components/LuckyColorCard';
import WeatherCard from '@/components/WeatherCard';
import HourlyForecast from '@/components/HourlyForecast';
import TideChart from '@/components/TideChart';
import CatchSection from '@/components/CatchSection';
import TackleAffiliate from '@/components/TackleAffiliate';
import { DEFAULT_AREA_ID, getAreaById } from '@/lib/areas';
import { fetchWeather, type WeatherData } from '@/lib/weather';
import {
  getNamiMessage,
  getFishingCondition,
  predictTargets,
  getSeaTemperatureInsight,
  WIND_ALERT_THRESHOLD,
} from '@/lib/logic';
import { pickRandomNamiPhoto } from '@/lib/namiPhotos';

export default function Home() {
  const [areaId, setAreaId] = useState(DEFAULT_AREA_ID);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 訪問のたびにナミの写真をランダムに変える。SSR/CSRの不一致を避けるため
  // 初期値はnullにし、マウント後（クライアント側）にだけ抽選する。
  const [namiPhoto, setNamiPhoto] = useState<string | null>(null);

  useEffect(() => {
    setNamiPhoto(pickRandomNamiPhoto());
  }, []);

  const area = getAreaById(areaId);
  const targets = predictTargets(area);

  const loadWeather = useCallback((lat: number, lon: number, showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setError(null);

    return fetchWeather(lat, lon)
      .then((data) => {
        setWeather(data);
      })
      .catch(() => {
        setError('気象データの取得に失敗しました。時間を置いて再度お試しください。');
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  }, []);

  useEffect(() => {
    setWeather(null);
    loadWeather(area.lat, area.lon, true);
  }, [area.lat, area.lon, loadWeather]);

  // スマホのホーム画面に追加した状態（PWA的な使い方）だと、OSがページを
  // 破棄せず裏で「一時停止」して再開することが多く、放置後に開き直しても
  // 気象データや新しいコードが古いまま表示されてしまう。
  // そこで、バックグラウンドから復帰したタイミングで:
  //   ・短時間の離脱 → 気象データだけ静かに再取得
  //   ・長時間（5分以上）の離脱 → ページごと再読み込み（新しいコードも反映）
  // という自動リフレッシュを行い、ユーザーが手動で再起動しなくて済むようにする。
  const RELOAD_AFTER_HIDDEN_MS = 5 * 60 * 1000;
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        return;
      }
      if (document.visibilityState !== 'visible' || hiddenAtRef.current === null) return;

      const hiddenDuration = Date.now() - hiddenAtRef.current;
      hiddenAtRef.current = null;

      if (hiddenDuration >= RELOAD_AFTER_HIDDEN_MS) {
        window.location.reload();
      } else {
        loadWeather(area.lat, area.lon, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [area.lat, area.lon, loadWeather]);

  const namiMessage = getNamiMessage(area, weather);
  const isAlert = !!weather && weather.windSpeed >= WIND_ALERT_THRESHOLD;
  const fishingCondition = getFishingCondition(weather);
  const seaTemperatureInsight = getSeaTemperatureInsight(area, weather);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-3 py-5 sm:gap-5 sm:px-6 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Anchor className="h-6 w-6 text-ocean-600" />
          <h1 className="text-base font-extrabold text-ocean-900 sm:text-xl">
            海気象＆釣果ナビ
            <span className="ml-1 hidden text-xs font-medium text-gray-400 sm:inline">
              全国対応 気象＆釣果ダッシュボード
            </span>
          </h1>
        </div>
      </header>

      <AreaSelector selectedAreaId={areaId} onChange={setAreaId} />

      <NamiNavigator message={namiMessage} isAlert={isAlert} photoUrl={namiPhoto} />

      <LuckyColorCard condition={fishingCondition} />

      <WeatherCard
        weather={weather}
        loading={loading}
        error={error}
        seaTemperatureInsight={seaTemperatureInsight}
      />

      <HourlyForecast weather={weather} />

      <TideChart area={area} weather={weather} namiPhotoUrl={namiPhoto} />

      <CatchSection area={area} targets={targets} weather={weather} />

      <TackleAffiliate targets={targets} />

      <footer className="mt-2 pb-4 text-center text-[11px] text-gray-400">
        気象データ提供: Open-Meteo.com ／ 本サイトはプロトタイプです。潮汐値は簡易シミュレーションです。
      </footer>
    </main>
  );
}
