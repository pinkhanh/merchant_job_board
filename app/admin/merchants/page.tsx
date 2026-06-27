'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { ActionsDropdown } from '@/components/ActionsDropdown';

type Merchant = {
  id: string;
  brandName: string;
  status: 'active' | 'inactive';
  _count: { stores: number; jobPosts: number };
};

export default function AdminMerchantsPage() {
  const showToast = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/merchants')
      .then((res) => res.json())
      .then(setMerchants);
  }, []);

  async function toggleStatus(id: string, current: 'active' | 'inactive') {
    const next = current === 'active' ? 'inactive' : 'active';
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/merchants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        showToast('success', next === 'active' ? 'Đã kích hoạt merchant' : 'Đã tạm ngưng merchant');
        setMerchants((list) => list.map((m) => (m.id === id ? { ...m, status: next } : m)));
      } else {
        showToast('error', 'Cập nhật thất bại, vui lòng thử lại');
      }
    } catch {
      showToast('error', 'Cập nhật thất bại, vui lòng thử lại');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Merchant</h1>
        <Link href="/admin/merchants/new" className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover">
          + Tạo merchant mới
        </Link>
      </div>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Thương hiệu</th>
            <th className="px-4 py-3 text-left">Số cửa hàng</th>
            <th className="px-4 py-3 text-left">Tổng tin đăng</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {merchants.map((m) => (
            <tr key={m.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-primary font-medium">
                <Link href={`/admin/merchants/${m.id}`} className="hover:underline">
                  {m.brandName}
                </Link>
              </td>
              <td className="px-4 py-3">{m._count.stores}</td>
              <td className="px-4 py-3">{m._count.jobPosts}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                  m.status === 'active'
                    ? 'bg-status-active-bg text-status-active-text'
                    : 'bg-status-off-bg text-status-off-text'
                }`}>
                  {m.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </span>
              </td>
              <td className="px-4 py-3">
                <ActionsDropdown
                  isLoading={loadingId === m.id}
                  items={[
                    {
                      label: m.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt',
                      onClick: () => toggleStatus(m.id, m.status),
                      variant: m.status === 'active' ? 'danger' : 'default',
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
