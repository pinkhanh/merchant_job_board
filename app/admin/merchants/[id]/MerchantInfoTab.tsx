'use client';

import { useEffect, useState } from 'react';
import { MerchantProfileView, type ProfileStore } from '@/components/MerchantProfileView';
import { useToast } from '@/components/Toast';

const PREVIEW_STORE_COUNT = 3;

type MerchantDetail = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  industry: string;
  jobCategories: string[];
  stores: ProfileStore[];
};

type FormState = {
  brandName: string;
  industry: string;
  hotline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  jobCategories: string[];
  tagInput: string;
};

export default function MerchantInfoTab({
  merchantId,
  onBrandNameChange,
}: {
  merchantId: string;
  onBrandNameChange: (name: string) => void;
}) {
  const showToast = useToast();
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/merchants/${merchantId}`)
      .then((r) => r.json())
      .then((data: MerchantDetail) => setMerchant(data));
  }, [merchantId]);

  function startEdit() {
    if (!merchant) return;
    setForm({
      brandName: merchant.brandName,
      industry: merchant.industry,
      hotline: merchant.hotline ?? '',
      description: merchant.description ?? '',
      logoUrl: merchant.logoUrl ?? '',
      bannerUrl: merchant.bannerUrl ?? '',
      jobCategories: [...merchant.jobCategories],
      tagInput: '',
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
  }

  async function saveEdit() {
    if (!form) return;
    setSaving(true);
    const payload = {
      brandName: form.brandName,
      industry: form.industry,
      hotline: form.hotline || null,
      description: form.description || null,
      logoUrl: form.logoUrl || null,
      bannerUrl: form.bannerUrl || null,
      jobCategories: form.jobCategories,
    };
    const res = await fetch(`/api/admin/merchants/${merchantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setMerchant((m) => (m ? { ...m, ...payload } : m));
      onBrandNameChange(form.brandName);
      setEditing(false);
      setForm(null);
      showToast('success', 'Đã lưu thông tin merchant');
    } else {
      showToast('error', 'Lưu thất bại, vui lòng thử lại');
    }
  }

  function addTag() {
    if (!form) return;
    const tag = form.tagInput.trim();
    if (tag && !form.jobCategories.includes(tag)) {
      setForm({ ...form, jobCategories: [...form.jobCategories, tag], tagInput: '' });
    } else {
      setForm({ ...form, tagInput: '' });
    }
  }

  function removeTag(tag: string) {
    if (!form) return;
    setForm({ ...form, jobCategories: form.jobCategories.filter((t) => t !== tag) });
  }

  if (!merchant) return null;

  const stores = merchant.stores ?? [];

  if (editing && form) {
    return (
      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Chỉnh sửa thông tin</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Tên thương hiệu *
            </label>
            <input
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Ngành nghề *
            </label>
            <input
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Hotline
            </label>
            <input
              value={form.hotline}
              onChange={(e) => setForm({ ...form, hotline: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Logo URL
            </label>
            <input
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Banner URL
            </label>
            <input
              value={form.bannerUrl}
              onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Mô tả (tối đa 500 ký tự)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={4}
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Danh mục việc làm
            </label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
              {form.jobCategories.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 bg-primary-surface text-primary text-sm px-2 py-0.5 rounded-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-500 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              value={form.tagInput}
              onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Nhập và nhấn Enter hoặc dấu phẩy để thêm"
              className="border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-primary-surface"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={saveEdit}
            disabled={saving || !form.brandName.trim() || !form.industry.trim()}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={startEdit}
          className="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary-surface"
        >
          Chỉnh sửa
        </button>
      </div>
      <MerchantProfileView
        brandName={merchant.brandName}
        logoUrl={merchant.logoUrl}
        bannerUrl={merchant.bannerUrl}
        industry={merchant.industry}
        hotline={merchant.hotline}
        description={merchant.description}
        jobCategories={merchant.jobCategories}
        stores={stores}
        storeTotal={stores.length}
        readOnly
        expandedStoresSlot={
          !showAllStores ? (
            stores.length > PREVIEW_STORE_COUNT && (
              <button
                onClick={() => setShowAllStores(true)}
                className="text-primary text-sm hover:underline mt-3"
              >
                Xem tất cả cửa hàng
              </button>
            )
          ) : (
            <ul className="mt-4 bg-white border border-border rounded-lg divide-y divide-border">
              {stores.slice(PREVIEW_STORE_COUNT).map((s) => (
                <li key={s.id} className="px-4 py-3">
                  {s.name}
                </li>
              ))}
            </ul>
          )
        }
      />
    </div>
  );
}
