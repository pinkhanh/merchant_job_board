'use client';

import { useEffect, useState } from 'react';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { StoreFilterBar } from '@/components/StoreFilterBar';
import { MerchantProfileView } from '@/components/MerchantProfileView';

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
      onSave={handleSave}
      onSync={loadProfile}
      onDescriptionChange={(value) => setProfile({ ...profile, description: value })}
      onHotlineChange={(value) => setProfile({ ...profile, hotline: value })}
      categoryInput={categoryInput}
      onCategoryInputChange={setCategoryInput}
      onAddCategory={handleAddCategory}
      onRemoveCategory={handleRemoveCategory}
      expandedStoresSlot={
        !showAllStores ? (
          <button onClick={() => setShowAllStores(true)} className="text-primary text-sm hover:underline mt-3">
            Xem tất cả cửa hàng
          </button>
        ) : (
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
        )
      }
    />
  );
}
