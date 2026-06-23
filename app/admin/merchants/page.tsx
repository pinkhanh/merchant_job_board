'use client';

import { useEffect, useState } from 'react';

type Merchant = {
  id: string;
  brandName: string;
  status: 'active' | 'inactive';
  _count: { stores: number; jobPosts: number };
};

export default function AdminMerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  useEffect(() => {
    fetch('/api/admin/merchants')
      .then((res) => res.json())
      .then(setMerchants);
  }, []);

  async function toggleStatus(id: string, current: 'active' | 'inactive') {
    const next = current === 'active' ? 'inactive' : 'active';
    await fetch(`/api/admin/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setMerchants((list) => list.map((m) => (m.id === id ? { ...m, status: next } : m)));
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
              <td className="px-4 py-3 text-primary font-medium">{m.brandName}</td>
              <td className="px-4 py-3">{m._count.stores}</td>
              <td className="px-4 py-3">{m._count.jobPosts}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleStatus(m.id, m.status)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                    m.status === 'active'
                      ? 'bg-status-active-bg text-status-active-text'
                      : 'bg-status-off-bg text-status-off-text'
                  }`}
                >
                  {m.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
