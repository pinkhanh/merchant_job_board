'use client';

import { useEffect, useState } from 'react';

type Profile = {
  brandName: string;
  description: string | null;
  hotline: string | null;
  stores: { id: string; name: string }[];
};

export default function MerchantProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch('/api/merchant/profile')
      .then((res) => res.json())
      .then(setProfile);
  }, []);

  async function handleSave() {
    if (!profile) return;
    await fetch('/api/merchant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: profile.description, hotline: profile.hotline }),
    });
  }

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="bg-status-info-bg text-status-info-text text-sm rounded-md px-4 py-2 inline-block">
        Đồng bộ từ MoMo Business Page
      </p>
      <h1 className="text-2xl font-bold">{profile.brandName}</h1>
      <div className="bg-white border border-border rounded-lg shadow-card p-8 flex flex-col gap-4">
        <textarea
          value={profile.description ?? ''}
          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
          className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <input
          value={profile.hotline ?? ''}
          onChange={(e) => setProfile({ ...profile, hotline: e.target.value })}
          className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
        />
        <button
          onClick={handleSave}
          className="bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover self-start"
        >
          Chỉnh sửa
        </button>
      </div>
      <h2 className="text-lg font-bold">Danh sách cửa hàng ({profile.stores.length})</h2>
      <ul className="bg-white border border-border rounded-lg shadow-card divide-y divide-border">
        {profile.stores.map((s) => (
          <li key={s.id} className="px-4 py-3">
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
