'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPinIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const CITIES: Record<string, string[]> = {
  'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh'],
  'Hà Nội': ['Hoàn Kiếm', 'Ba Đình', 'Cầu Giấy'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê'],
};

export function WorkerHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentLabel = city ? `${district ? district + ', ' : ''}${city}` : 'Chọn khu vực';

  function confirmManualLocation() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    router.push(`/jobs?${params.toString()}`);
    setOpen(false);
  }

  function useMyLocation() {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(`/jobs?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusKm=5`);
        setOpen(false);
      },
      () => setGeoError('Không thể lấy vị trí của bạn. Vui lòng chọn khu vực thủ công.')
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-worker-border flex items-center px-4 z-10">
      <img src="/logo-momo.png" alt="MoMo" className="w-8 h-8 rounded" />
      <span className="ml-2 font-bold text-base">MoMo</span>

      <div className="ml-auto relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 bg-white border border-worker-border rounded-worker-pill px-3.5 py-2 text-sm font-medium"
        >
          <MapPinIcon className="w-4 h-4" />
          {currentLabel}
          <ChevronDownIcon className="w-4 h-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-[280px] bg-white shadow-worker-modal rounded-worker-md p-4 flex flex-col gap-3">
            <label className="text-xs font-medium flex flex-col gap-1">
              Tỉnh/Thành Phố
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setDistrict('');
                }}
                className="border border-worker-border rounded-md px-2 py-1.5 text-sm"
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {Object.keys(CITIES).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium flex flex-col gap-1">
              Quận/Huyện
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!city}
                className="border border-worker-border rounded-md px-2 py-1.5 text-sm"
              >
                <option value="">Chọn quận/huyện</option>
                {(CITIES[city] ?? []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>

            <button onClick={useMyLocation} className="text-worker-primary text-sm text-left flex items-center gap-1">
              <ArrowPathIcon className="w-4 h-4" />
              Dùng vị trí của tôi
            </button>
            {geoError && <p className="text-xs text-worker-hot">{geoError}</p>}

            <button
              onClick={confirmManualLocation}
              className="bg-worker-primary text-white rounded-worker-pill py-2.5 text-sm font-bold"
            >
              Tìm việc tại đây
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
