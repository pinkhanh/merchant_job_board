'use client';

import type { ReactNode } from 'react';

export type ProfileStore = {
  id: string;
  name: string;
  streetAddress?: string | null;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
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

  // Editable-mode only props (ignored when readOnly is true).
  onSave?: () => void;
  onSync?: () => void;
  onDescriptionChange?: (value: string) => void;
  onHotlineChange?: (value: string) => void;
  categoryInput?: string;
  onCategoryInputChange?: (value: string) => void;
  onAddCategory?: () => void;
  onRemoveCategory?: (category: string) => void;

  // Rendered below the store preview list once "Xem tất cả cửa hàng" is
  // expanded. In editable mode this is the StoreFilterBar + paginated
  // store-search list; in read-only mode the caller can simply render the
  // remaining already-fetched stores (no slot needed).
  expandedStoresSlot?: ReactNode;
};

const PREVIEW_STORE_COUNT = 3;

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
  onSave,
  onSync,
  onDescriptionChange,
  onHotlineChange,
  categoryInput,
  onCategoryInputChange,
  onAddCategory,
  onRemoveCategory,
  expandedStoresSlot,
}: MerchantProfileViewProps) {
  const storesByOldest = [...stores].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  const previewStores = storesByOldest.slice(0, PREVIEW_STORE_COUNT);
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
            <span className="bg-status-info-bg text-status-info-text text-[11px] font-semibold tracking-wide uppercase rounded-md px-3 py-1 inline-block self-start">
              Đồng bộ từ Business Page
            </span>
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
          {!readOnly && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onSave}
                className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={onSync}
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
          )}
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
          <button
            onClick={onSave}
            className="bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover self-start"
          >
            Chỉnh sửa
          </button>
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
            {expandedStoresSlot}
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
            {!readOnly && (
              <button
                type="button"
                disabled
                title="Chưa có liên kết Business Page"
                className="text-primary text-sm hover:underline opacity-60 cursor-not-allowed"
              >
                Đi đến Business Page
              </button>
            )}
          </div>

          <div className="bg-white border border-border rounded-lg shadow-card p-6">
            <h2 className="text-lg font-bold mb-1">Quản lý danh sách ngành nghề</h2>
            <p className="text-sm text-text-secondary mb-3">Thiết lập ngành nghề</p>
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
    </div>
  );
}
