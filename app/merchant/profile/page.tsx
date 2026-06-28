'use client';

import { useEffect, useState, useRef } from 'react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { MerchantProfileView } from '@/components/MerchantProfileView';
import { useToast } from '@/components/Toast';

type Profile = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  industry?: string | null;
  jobCategories?: string[];
};

export default function MerchantProfilePage() {
  const showToast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const storeSearch = useStoreSearch();

  const originalRef = useRef<{ description: string | null; hotline: string | null } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  function loadProfile() {
    return fetch('/api/merchant/profile')
      .then((res) => res.json())
      .then((data: Profile) => {
        setProfile(data);
        originalRef.current = { description: data.description, hotline: data.hotline };
        setIsDirty(false);
      });
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function checkDirty(next: { description: string | null; hotline: string | null }) {
    if (!originalRef.current) return;
    setIsDirty(
      next.description !== originalRef.current.description ||
      next.hotline !== originalRef.current.hotline
    );
  }

  async function handleSave() {
    if (!profile) return;
    setIsSaving(true);
    try {
      await fetch('/api/merchant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: profile.description, hotline: profile.hotline }),
      });
      originalRef.current = { description: profile.description, hotline: profile.hotline };
      setIsDirty(false);
      showToast('success', 'Đã lưu thông tin thương hiệu');
    } catch {
      showToast('error', 'Lưu thất bại, vui lòng thử lại');
    } finally {
      setIsSaving(false);
    }
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

  if (!profile) return null;

  return (
    <MerchantProfileView
      brandName={profile.brandName}
      logoUrl={profile.logoUrl}
      bannerUrl={profile.bannerUrl}
      industry={profile.industry}
      hotline={profile.hotline}
      description={profile.description}
      jobCategories={profile.jobCategories}
      stores={storeSearch.items}
      storeTotal={storeSearch.total}
      readOnly={false}
      isDirty={isDirty}
      onSave={handleSave}
      isSaving={isSaving}
      onDescriptionChange={(value) => {
        const next = { ...profile, description: value };
        setProfile(next);
        checkDirty({ description: value, hotline: profile.hotline });
      }}
      onHotlineChange={(value) => {
        const next = { ...profile, hotline: value };
        setProfile(next);
        checkDirty({ description: profile.description, hotline: value });
      }}
      categoryInput={categoryInput}
      onCategoryInputChange={setCategoryInput}
      onAddCategory={handleAddCategory}
      onRemoveCategory={handleRemoveCategory}
      storeCity={storeSearch.city}
      onStoreCityChange={storeSearch.setCity}
      storeDistrict={storeSearch.district}
      onStoreDistrictChange={storeSearch.setDistrict}
      expandedStoresSlot={
        storeSearch.hasMore ? (
          <button onClick={storeSearch.loadMore} className="text-primary text-sm hover:underline mt-3">
            Xem thêm
          </button>
        ) : undefined
      }
    />
  );
}
