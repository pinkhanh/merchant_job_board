'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPinIcon, ChevronDownIcon, ArrowPathIcon, XMarkIcon, MagnifyingGlassIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

const CITIES: Record<string, string[]> = {
  'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh'],
  'Hà Nội': ['Hoàn Kiếm', 'Ba Đình', 'Cầu Giấy'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê'],
};

const ALL_PROVINCES = [
  'Hồ Chí Minh', 'Hà Nội', 'Vũng Tàu', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Huế',
  'An Giang', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định',
  'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Đắk Lắk', 'Khánh Hoà', 'Nghệ An',
];

type Sheet = 'main' | 'city';

export function WorkerHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<Sheet>('main');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [citySearch, setCitySearch] = useState('');
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentLabel = city ? `${district ? district + ', ' : ''}${city}` : 'Chọn khu vực';

  function openSheet() {
    setSheet('main');
    setOpen(true);
  }

  function closeSheet() {
    setOpen(false);
    setSheet('main');
    setCitySearch('');
  }

  function selectCity(c: string) {
    setCity(c);
    setDistrict('');
    setCitySearch('');
    setSheet('main');
  }

  function confirmLocation() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    router.push(`/jobs?${params.toString()}`);
    closeSheet();
  }

  function useMyLocation() {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(`/jobs?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}&radiusKm=5`);
        closeSheet();
      },
      () => setGeoError('Không thể lấy vị trí của bạn. Vui lòng chọn khu vực thủ công.')
    );
  }

  const filteredProvinces = citySearch
    ? ALL_PROVINCES.filter((p) => p.toLowerCase().includes(citySearch.toLowerCase()))
    : ALL_PROVINCES;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-worker-border flex items-center px-4 z-10">
        <img src="/logo-momo.png" alt="MoMo" className="w-8 h-8 rounded" />
        <span className="ml-2 font-bold text-base">MoMo</span>

        <div className="ml-auto">
          <button
            onClick={openSheet}
            className="flex items-center gap-1 bg-white border border-worker-border rounded-worker-pill px-3.5 py-2 text-sm font-medium"
          >
            <MapPinIcon className="w-4 h-4" />
            {currentLabel}
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeSheet}
        />
      )}

      {/* Bottom sheet - Chọn địa điểm */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          open && sheet === 'main' ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-worker-border">
          <span className="font-bold text-base">Chọn địa điểm</span>
          <button onClick={closeSheet} className="p-1">
            <XMarkIcon className="w-5 h-5 text-worker-text-secondary" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* City selector */}
          <div>
            <label className="text-xs text-worker-text-secondary mb-1 block">Tỉnh/ Thành phố</label>
            <button
              onClick={() => setSheet('city')}
              className="w-full border border-worker-border rounded-xl px-4 py-3 text-sm flex items-center justify-between text-left"
            >
              <span className={city ? 'text-gray-900' : 'text-worker-text-secondary'}>
                {city || 'Chọn tỉnh/ thành phố'}
              </span>
              <ChevronDownIcon className="w-4 h-4 text-worker-text-secondary shrink-0" />
            </button>
          </div>

          {/* District selector */}
          <div>
            <label className="text-xs text-worker-text-secondary mb-1 block">Quận/ Huyện</label>
            <div className="relative">
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!city}
                className="w-full border border-worker-border rounded-xl px-4 py-3 text-sm appearance-none bg-white disabled:text-worker-text-disabled"
              >
                <option value="">Chọn quận/ huyện</option>
                {(CITIES[city] ?? []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-worker-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={useMyLocation}
            className="text-worker-primary text-sm flex items-center gap-1.5"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Dùng vị trí của tôi
          </button>
          {geoError && <p className="text-xs text-worker-hot">{geoError}</p>}

          <button
            onClick={confirmLocation}
            className="w-full bg-worker-primary text-white rounded-worker-pill py-3 text-sm font-bold mt-2"
          >
            Tìm việc tại đây
          </button>
        </div>
      </div>

      {/* Bottom sheet - Chọn tỉnh/thành */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 transition-transform duration-300 ${
          open && sheet === 'city' ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center px-4 py-3 border-b border-worker-border shrink-0">
          <button onClick={() => setSheet('main')} className="p-1 -ml-1 mr-2">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-bold text-base flex-1 text-center">Chọn tỉnh/ thành</span>
          <button onClick={closeSheet} className="p-1 -mr-1">
            <XMarkIcon className="w-5 h-5 text-worker-text-secondary" />
          </button>
        </div>

        <div className="px-4 pt-3 shrink-0">
          <div className="relative mb-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-worker-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tỉnh/ thành"
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="w-full border border-worker-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-worker-primary"
            />
          </div>
        </div>

        <ul className="overflow-y-auto flex-1 pb-safe">
          {filteredProvinces.map((p) => (
            <li key={p}>
              <button
                onClick={() => selectCity(p)}
                className="w-full flex items-center justify-between px-4 py-4 text-sm text-left border-b border-gray-50 active:bg-gray-50"
              >
                <span className={p === city ? 'font-medium' : ''}>{p}</span>
                {p === city && (
                  <svg className="w-4 h-4 text-worker-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
