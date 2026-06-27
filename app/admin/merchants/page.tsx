'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

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
      <h1 className="text-2xl font-bold mb-6">Quản lý Merchant</h1>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Thương hiệu</th>
            <th className="px-4 py-3 text-left">Số cửa hàng</th>
            <th className="px-4 py-3 text-left">Tổng tin đăng</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
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
                <button
                  onClick={() => toggleStatus(m.id, m.status)}
                  disabled={loadingId === m.id}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-sm disabled:opacity-60 ${
                    m.status === 'active'
                      ? 'bg-status-active-bg text-status-active-text'
                      : 'bg-status-off-bg text-status-off-text'
                  }`}
                >
                  {loadingId === m.id ? '...' : m.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
