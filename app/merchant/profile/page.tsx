'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { StoreFilterBar } from '@/components/StoreFilterBar';

type Profile = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  industry?: string | null;
  jobCategories?: string[];
};

// `useStoreSearch`'s `Store` type doesn't declare `createdAt`, but the
// underlying API returns the full Prisma row, so it's safe to read here for
// the "oldest store = headquarters" presentation convention below.
type StoreWithCreatedAt = {
  id: string;
  name: string;
  streetAddress?: string;
  ward?: string;
  district?: string;
  city?: string;
  createdAt?: string;
};

const PREVIEW_STORE_COUNT = 3;

export default function MerchantProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [showAllStores, setShowAllStores] = useState(false);
  const storeSearch = useStoreSearch();

  function loadProfile() {
    return fetch('/api/merchant/profile')
      .then((res) => res.json())
      .then(setProfile);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSave() {
    if (!profile) return;
    await fetch('/api/merchant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: profile.description, hotline: profile.hotline }),
    });
  }

  async function persistJobCategories(next: string[]) {
    setProfile((prev) => (prev ? { ...prev, jobCategories: next } : prev));
    await fetch('/api/merchant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobCategories: next }),
    });
  }

  function handleAddCategory() {
    const value = categoryInput.trim();
    if (!value || !profile) return;
    const current = profile.jobCategories ?? [];
    if (current.includes(value)) {
      setCategoryInput('');
      return;
    }
    setCategoryInput('');
    persistJobCategories([...current, value]);
  }

  function handleRemoveCategory(category: string) {
    if (!profile) return;
    const current = profile.jobCategories ?? [];
    persistJobCategories(current.filter((c) => c !== category));
  }

  const storesByOldest = useMemo<StoreWithCreatedAt[]>(() => {
    return [...storeSearch.items].sort((a, b) => {
      const aTime = (a as StoreWithCreatedAt).createdAt
        ? new Date((a as StoreWithCreatedAt).createdAt as string).getTime()
        : 0;
      const bTime = (b as StoreWithCreatedAt).createdAt
        ? new Date((b as StoreWithCreatedAt).createdAt as string).getTime()
        : 0;
      return aTime - bTime;
    });
  }, [storeSearch.items]);

  const previewStores = storesByOldest.slice(0, PREVIEW_STORE_COUNT);
  const headquartersStoreId = storesByOldest[0]?.id;

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-4">
      {/* Top brand card */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative flex-1">
            <div className="h-40 w-full bg-primary-surface flex items-center justify-center overflow-hidden">
              {profile.bannerUrl ? (
                <img
                  src={profile.bannerUrl}
                  alt="Ảnh bìa thương hiệu"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span data-testid="banner-placeholder" className="text-text-secondary text-sm">
                  Chưa có ảnh bìa
                </span>
              )}
            </div>
            <div className="absolute left-6 -bottom-8">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={`Logo ${profile.brandName}`}
                  className="h-16 w-16 rounded-full object-cover border-4 border-white shadow-card bg-white"
                />
              ) : (
                <div
                  data-testid="logo-placeholder"
                  className="h-16 w-16 rounded-full border-4 border-white shadow-card bg-border flex items-center justify-center text-text-secondary text-xs"
                >
                  Logo
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-6 pt-12 pb-6">
          <div className="flex flex-col gap-2">
            <span className="bg-status-info-bg text-status-info-text text-[11px] font-semibold tracking-wide uppercase rounded-md px-3 py-1 inline-block self-start">
              Đồng bộ từ Business Page
            </span>
            <h1 className="text-2xl font-bold">{profile.brandName}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {profile.industry && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">🏷️</span>
                  {profile.industry}
                </span>
              )}
              {profile.hotline && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">📞</span>
                  {profile.hotline}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSave}
              className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={loadProfile}
              className="border border-border rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-surface"
            >
              Đồng bộ lại
            </button>
            <button
              type="button"
              disabled
              title="Chưa có liên kết Business Page"
              className="border border-border rounded-md px-4 py-2 text-sm font-semibold text-text-secondary cursor-not-allowed opacity-60"
            >
              Xem Business Page
            </button>
          </div>
        </div>
      </div>

      {/* Edit card for description/hotline */}
      <div className="bg-white border border-border rounded-lg shadow-card p-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Mô tả thương hiệu
          <textarea
            value={profile.description ?? ''}
            onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Hotline
          <input
            value={profile.hotline ?? ''}
            onChange={(e) => setProfile({ ...profile, hotline: e.target.value })}
            className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </label>
        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover self-start"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-2">Thông tin thương hiệu</h2>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {profile.description || 'Chưa có mô tả thương hiệu.'}
            </p>
          </div>

          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-4">Danh sách cửa hàng ({storeSearch.total})</h2>
            <ul className="divide-y divide-border">
              {previewStores.map((s) => (
                <li key={s.id} className="py-3 flex items-center gap-2">
                  <span aria-hidden="true">🏬</span>
                  <span className="font-medium">{s.name}</span>
                  {s.id === headquartersStoreId && (
                    <span className="bg-status-info-bg text-status-info-text text-[11px] font-medium px-2 py-0.5 rounded-sm">
                      Trụ sở chính
                    </span>
                  )}
                  {(s.streetAddress || s.ward || s.district || s.city) && (
                    <span className="text-text-secondary text-sm">
                      {[s.streetAddress, s.ward, s.district, s.city].filter(Boolean).join(', ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!showAllStores && (
              <button
                onClick={() => setShowAllStores(true)}
                className="text-primary text-sm hover:underline mt-3"
              >
                Xem tất cả cửa hàng
              </button>
            )}

            {showAllStores && (
              <div className="mt-4 flex flex-col gap-4">
                <StoreFilterBar
                  keyword={storeSearch.keyword}
                  onKeywordChange={storeSearch.setKeyword}
                  city={storeSearch.city}
                  onCityChange={storeSearch.setCity}
                  district={storeSearch.district}
                  onDistrictChange={storeSearch.setDistrict}
                />
                <ul className="bg-white border border-border rounded-lg divide-y divide-border">
                  {storeSearch.items.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      {s.name}
                    </li>
                  ))}
                </ul>
                {storeSearch.hasMore && (
                  <button onClick={storeSearch.loadMore} className="text-primary text-sm hover:underline self-start">
                    Xem thêm
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right column (sidebar) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-2">Thông tin đồng bộ</h2>
            <p className="text-sm text-text-secondary mb-3">
              Thông tin thương hiệu được đồng bộ từ MoMo Business Page. Mọi thay đổi về tên, logo, ảnh bìa và ngành
              nghề nên được thực hiện trên Business Page để đảm bảo dữ liệu thống nhất.
            </p>
            <button
              type="button"
              disabled
              title="Chưa có liên kết Business Page"
              className="text-primary text-sm hover:underline opacity-60 cursor-not-allowed"
            >
              Đi đến Business Page
            </button>
          </div>

          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-1">Quản lý danh sách ngành nghề</h2>
            <p className="text-sm text-text-secondary mb-3">Thiết lập ngành nghề</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.jobCategories ?? []).map((category) => (
                <span
                  key={category}
                  className="bg-primary-surface text-primary text-xs font-medium rounded-pill px-3 py-1 flex items-center gap-1"
                >
                  {category}
                  <button
                    type="button"
                    aria-label={`Xoá ${category}`}
                    onClick={() => handleRemoveCategory(category)}
                    className="text-primary hover:text-primary-hover font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
              {(profile.jobCategories ?? []).length === 0 && (
                <span className="text-text-secondary text-sm">Chưa có ngành nghề nào.</span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="Thêm ngành nghề..."
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
