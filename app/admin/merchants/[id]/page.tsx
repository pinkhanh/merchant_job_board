'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import MerchantInfoTab from './MerchantInfoTab';
import AccountsTab from './AccountsTab';

type MerchantHeader = {
  brandName: string;
  status: 'active' | 'inactive';
};

export default function AdminMerchantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const tab = searchParams.get('tab') ?? 'info';

  const [merchant, setMerchant] = useState<MerchantHeader | null>(null);

  useEffect(() => {
    fetch(`/api/admin/merchants/${id}`)
      .then((r) => r.json())
      .then((data) => setMerchant({ brandName: data.brandName, status: data.status }));
  }, [id]);

  async function toggleStatus() {
    if (!merchant) return;
    const next = merchant.status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/admin/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setMerchant((m) => (m ? { ...m, status: next } : m));
      showToast('success', next === 'active' ? 'Đã kích hoạt merchant' : 'Đã tạm ngưng merchant');
    } else {
      showToast('error', 'Cập nhật thất bại, vui lòng thử lại');
    }
  }

  if (!merchant) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/merchants')}
            className="text-sm text-primary hover:underline"
          >
            ← Quay lại
          </button>
          <h1 className="text-2xl font-bold">{merchant.brandName}</h1>
        </div>
        <button
          onClick={toggleStatus}
          className={`text-[11px] font-medium px-3 py-1 rounded-sm ${
            merchant.status === 'active'
              ? 'bg-status-active-bg text-status-active-text'
              : 'bg-status-off-bg text-status-off-text'
          }`}
        >
          {merchant.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
        </button>
      </div>

      <div className="flex border-b border-border mb-6">
        {(['info', 'accounts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => router.replace(`/admin/merchants/${id}?tab=${t}`)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-primary'
            }`}
          >
            {t === 'info' ? 'Thông tin chung' : 'Tài khoản'}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <MerchantInfoTab
          merchantId={id}
          onBrandNameChange={(name) => setMerchant((m) => (m ? { ...m, brandName: name } : m))}
        />
      ) : (
        <AccountsTab merchantId={id} />
      )}
    </div>
  );
}
