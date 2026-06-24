'use client';

import { useEffect, useState } from 'react';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

type StoreFilterBarProps = {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  city: string;
  onCityChange: (city: string) => void;
  district: string;
  onDistrictChange: (district: string) => void;
};

export function StoreFilterBar({
  keyword,
  onKeywordChange,
  city,
  onCityChange,
  district,
  onDistrictChange,
}: StoreFilterBarProps) {
  const [keywordInput, setKeywordInput] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(() => onKeywordChange(keywordInput), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  return (
    <div className="flex gap-2 mb-4 items-end">
      <label className="flex flex-col gap-1 text-xs font-medium flex-1">
        Tìm kiếm
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="Tên hoặc địa chỉ cửa hàng"
          className="border border-border rounded-md px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Tỉnh/Thành Phố
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className="border border-border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          {Object.keys(VIETNAM_PROVINCES).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium">
        Quận/Huyện
        <select
          value={district}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={!city}
          className="border border-border rounded-md px-2 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          {(VIETNAM_PROVINCES[city] ?? []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
