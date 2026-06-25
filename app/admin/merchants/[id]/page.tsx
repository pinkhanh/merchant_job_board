'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MerchantProfileView, type ProfileStore } from '@/components/MerchantProfileView';

type MerchantDetail = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  industry?: string | null;
  jobCategories?: string[];
  stores: ProfileStore[];
};

const PREVIEW_STORE_COUNT = 3;

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [showAllStores, setShowAllStores] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/merchants/${id}`)
      .then((res) => res.json())
      .then(setMerchant);
  }, [id]);

  if (!merchant) return null;

  const stores = merchant.stores ?? [];

  return (
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
            <button onClick={() => setShowAllStores(true)} className="text-primary text-sm hover:underline mt-3">
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
  );
}
