'use client';

import { MapPin } from 'lucide-react';
import { groupAreasByPrefecture, type FishingArea } from '@/lib/areas';

type Props = {
  selectedAreaId: string;
  onChange: (areaId: string) => void;
};

export default function AreaSelector({ selectedAreaId, onChange }: Props) {
  const grouped = groupAreasByPrefecture();

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 shadow-card backdrop-blur">
      <MapPin className="h-5 w-5 shrink-0 text-ocean-600" aria-hidden />
      <label htmlFor="area-select" className="sr-only">
        釣りエリアを選択
      </label>
      <select
        id="area-select"
        value={selectedAreaId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-[200px] cursor-pointer appearance-none bg-transparent py-1 text-sm font-semibold text-ocean-900 outline-none sm:text-base"
      >
        {Object.entries(grouped).map(([pref, areas]: [string, FishingArea[]]) => (
          <optgroup key={pref} label={pref}>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
