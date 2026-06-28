'use client';

import { useState, type ReactNode } from 'react';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

export type ProfileStore = {
  id: string;
  name: string;
  streetAddress?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
  openingHours?: string | object | null;
  createdAt?: string;
};

export type MerchantProfileViewProps = {
  brandName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  industry?: string | null;
  hotline?: string | null;
  description?: string | null;
  jobCategories?: string[];
  stores: ProfileStore[];
  storeTotal: number;
  readOnly: boolean;
  isDirty?: boolean;

  // Editable-mode only props (ignored when readOnly is true).
  onSave?: () => void;
  isSaving?: boolean;
  onDescriptionChange?: (value: string) => void;
  onHotlineChange?: (value: string) => void;
  categoryInput?: string;
  onCategoryInputChange?: (value: string) => void;
  onAddCategory?: () => void;
  onRemoveCategory?: (category: string) => void;

  // Store filter callbacks (editable mode)
  storeCity?: string;
  onStoreCityChange?: (city: string) => void;
  storeDistrict?: string;
  onStoreDistrictChange?: (district: string) => void;

  expandedStoresSlot?: ReactNode;
};

export function MerchantProfileView({
  brandName,
  logoUrl,
  bannerUrl,
  industry,
  hotline,
  description,
  jobCategories,
  stores,
  storeTotal,
  readOnly,
  isDirty,
  onSave,
  isSaving,
  onDescriptionChange,
  onHotlineChange,
  categoryInput,
  onCategoryInputChange,
  onAddCategory,
  onRemoveCategory,
  storeCity,
  onStoreCityChange,
  storeDistrict,
  onStoreDistrictChange,
  expandedStoresSlot,
}: MerchantProfileViewProps) {
  const storesByOldest = [...stores].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  const headquartersStoreId = storesByOldest[0]?.id;

  return (
    <div className="flex flex-col gap-4">
      {/* Top brand card */}
      <div className="bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative flex-1">
            <div className="h-40 w-full bg-primary-surface flex items-center justify-center overflow-hidden">
              {bannerUrl ? (
                <img src={bannerUrl} alt="Ảnh bìa thương hiệu" className="h-full w-full object-cover" />
              ) : (
                <span data-testid="banner-placeholder" className="text-text-secondary text-sm">
                  Chưa có ảnh bìa
                </span>
              )}
            </div>
            <div className="absolute left-6 -bottom-8">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`Logo ${brandName}`}
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
            <h1 className="text-2xl font-bold">{brandName}</h1>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {industry && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">🏷️</span>
                  {industry}
                </span>
              )}
              {hotline && (
                <span className="flex items-center gap-1">
                  <span aria-hidden="true">📞</span>
                  {hotline}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit card for description/hotline (editable mode only) */}
      {!readOnly && (
        <div className="bg-white border border-border rounded-lg shadow-card p-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Mô tả thương hiệu
            <textarea
              value={description ?? ''}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Hotline
            <input
              value={hotline ?? ''}
              onChange={(e) => onHotlineChange?.(e.target.value)}
              className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-2">Thông tin thương hiệu</h2>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">
              {description || 'Chưa có mô tả thương hiệu.'}
            </p>
          </div>

          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-4">Danh sách cửa hàng ({storeTotal})</h2>

            {/* Province/District filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <label className="flex flex-col gap-1 text-xs font-medium">
                Tỉnh/Thành Phố
                <select
                  value={storeCity ?? ''}
                  onChange={(e) => onStoreCityChange?.(e.target.value)}
                  className="border border-border rounded-md px-2 py-2 text-sm bg-white"
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
                  value={storeDistrict ?? ''}
                  onChange={(e) => onStoreDistrictChange?.(e.target.value)}
                  disabled={!storeCity}
                  className="border border-border rounded-md px-2 py-2 text-sm bg-white disabled:opacity-60"
                >
                  <option value="">Tất cả</option>
                  {(VIETNAM_PROVINCES[storeCity ?? ''] ?? []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
            </div>

            <ul className="divide-y divide-border">
              {storesByOldest.map((store) => (
                <li key={store.id} className="py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{store.name}</span>
                    {store.id === headquartersStoreId && (
                      <span className="bg-status-info-bg text-status-info-text text-[11px] font-medium px-2 py-0.5 rounded-sm">
                        Trụ sở chính
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5">
                    {[store.streetAddress, store.ward, store.district, store.city].filter(Boolean).join(', ')}
                  </p>
                  {typeof store.openingHours === 'string' && store.openingHours && (
                    <p className="text-sm text-text-secondary mt-0.5">
                      Giờ làm việc: {store.openingHours}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            {expandedStoresSlot}
          </div>
        </div>

        {/* Right column (sidebar) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-4">Quản lý danh sách ngành nghề</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(jobCategories ?? []).map((category) =>
                readOnly ? (
                  <span
                    key={category}
                    className="bg-primary-surface text-primary text-xs font-medium rounded-pill px-3 py-1"
                  >
                    {category}
                  </span>
                ) : (
                  <span
                    key={category}
                    className="bg-primary-surface text-primary text-xs font-medium rounded-pill px-3 py-1 flex items-center gap-1"
                  >
                    {category}
                    <button
                      type="button"
                      aria-label={`Xoá ${category}`}
                      onClick={() => onRemoveCategory?.(category)}
                      className="text-primary hover:text-primary-hover font-bold"
                    >
                      ×
                    </button>
                  </span>
                )
              )}
              {(jobCategories ?? []).length === 0 && (
                <span className="text-text-secondary text-sm">Chưa có ngành nghề nào.</span>
              )}
            </div>
            {!readOnly && (
              <div className="flex gap-2">
                <input
                  value={categoryInput ?? ''}
                  onChange={(e) => onCategoryInputChange?.(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onAddCategory?.();
                    }
                  }}
                  placeholder="Thêm ngành nghề..."
                  className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={onAddCategory}
                  className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover"
                >
                  Thêm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {readOnly && (
        <p className="text-xs italic text-text-secondary">
          Bạn đang xem thông tin công khai của thương hiệu.
        </p>
      )}

      {/* Sticky save button — only visible when there are unsaved changes */}
      {!readOnly && isDirty && (
        <div className="fixed bottom-6 right-8 z-20">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="bg-primary text-white rounded-md px-6 py-2.5 text-sm font-semibold hover:bg-primary-hover shadow-modal disabled:opacity-60"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      )}
    </div>
  );
}
