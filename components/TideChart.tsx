'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Waves, ArrowUpCircle, ArrowDownCircle, Target } from 'lucide-react';
import type { FishingArea } from '@/lib/areas';
import type { WeatherData } from '@/lib/weather';
import {
  generateTideCurve,
  findTideExtremes,
  formatJstTime,
  getTidePhaseLabel,
  getPeakActivityHint,
} from '@/lib/logic';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Props = {
  area: FishingArea;
  weather: WeatherData | null;
};

export default function TideChart({ area, weather }: Props) {
  const { chartData, extremes, currentHour, tidePhase, peakActivityHint } = useMemo(() => {
    const points = generateTideCurve(area);
    const extremes = findTideExtremes(points);
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const tidePhase = getTidePhaseLabel(now);
    const peakActivityHint = getPeakActivityHint(area, weather, now);

    return {
      chartData: {
        labels: points.map((p) => `${String(Math.floor(p.hour)).padStart(2, '0')}:${p.hour % 1 === 0 ? '00' : '30'}`),
        datasets: [
          {
            label: '潮位 (簡易シミュレーション)',
            data: points.map((p) => p.level),
            borderColor: '#0aa9f2',
            backgroundColor: 'rgba(10,169,242,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      extremes,
      currentHour,
      tidePhase,
      peakActivityHint,
    };
  }, [area, weather]);

  const isBigTide = tidePhase === '大潮' || tidePhase === '中潮';

  return (
    <section className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-1 flex items-center justify-between gap-1.5 text-sm font-bold text-ocean-900 sm:text-base">
        <span className="flex items-center gap-1.5">
          <Waves className="h-4 w-4 text-ocean-600" />
          潮汐（タイドグラフ）
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            isBigTide ? 'bg-coral-500 text-white' : 'bg-ocean-100 text-ocean-700'
          }`}
        >
          今日は{tidePhase}
        </span>
      </h2>
      <p className="mb-3 text-[11px] text-gray-400">
        ※ 簡易シミュレーション値です。正確な潮汐は気象庁等の公式データをご確認ください。
      </p>

      <div className="h-40 sm:h-48">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `潮位: ${ctx.parsed.y}`,
                },
              },
            },
            scales: {
              x: {
                ticks: { maxTicksLimit: 8, color: '#94a3b8', font: { size: 10 } },
                grid: { display: false },
              },
              y: {
                ticks: { display: false },
                grid: { color: '#eef6fb' },
              },
            },
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {extremes.map((ex, i) => (
          <div
            key={i}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              ex.type === 'high' ? 'bg-ocean-100 text-ocean-700' : 'bg-orange-50 text-orange-600'
            }`}
          >
            {ex.type === 'high' ? (
              <ArrowUpCircle className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownCircle className="h-3.5 w-3.5" />
            )}
            {ex.type === 'high' ? '満潮' : '干潮'} {formatJstTime(ex.time)}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-coral-500/10 px-3 py-3">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-coral-500" />
        <p className="text-xs font-semibold leading-relaxed text-coral-600 sm:text-sm">
          {peakActivityHint}
        </p>
      </div>

      <p className="sr-only">現在時刻: {currentHour.toFixed(1)}時</p>
    </section>
  );
}
