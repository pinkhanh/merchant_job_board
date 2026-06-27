'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Brand = { id: string; brandName: string; logoUrl: string | null };

export default function SelectBrandPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selecting, setSelecting] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/merchant/brands').then(r => r.json()).then(data => setBrands(data.items ?? []));
  }, []);

  async function selectBrand(merchantId: string) {
    setSelecting(merchantId);
    await fetch('/api/auth/select-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId }),
    });
    router.push('/merchant/dashboard');
  }

  return (
    <div className="min-h-screen bg-primary-surface flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-foreground mb-6">Chọn thương hiệu quản lý</h1>
        <div className="space-y-3">
          {brands.map(brand => (
            <button
              key={brand.id}
              onClick={() => selectBrand(brand.id)}
              disabled={selecting !== null}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary-surface disabled:opacity-60 transition-colors"
            >
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.brandName} className="w-10 h-10 rounded object-cover" />
              ) : (
                <div className="w-10 h-10 rounded bg-primary-surface flex items-center justify-center text-primary font-bold">
                  {brand.brandName[0]}
                </div>
              )}
              <span className="font-medium text-foreground">{brand.brandName}</span>
              {selecting === brand.id && <span className="ml-auto text-xs text-text-secondary">Đang chọn...</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
