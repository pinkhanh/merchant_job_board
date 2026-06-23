'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Counts = { live: number; paused: number; expired: number };

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch('/api/merchant/dashboard-counts')
      .then((res) => res.json())
      .then(setCounts);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {counts && (
        <div className="flex gap-4 mb-6">
          <div className="bg-white border border-border rounded-lg shadow-card p-5 flex-1">
            <p className="text-2xl font-bold text-primary">{counts.live}</p>
            <p className="text-sm text-text-secondary">Tin đang tuyển</p>
          </div>
          <div className="bg-white border border-border rounded-lg shadow-card p-5 flex-1">
            <p className="text-2xl font-bold text-status-pending-text">{counts.paused}</p>
            <p className="text-sm text-text-secondary">Tin tạm dừng</p>
          </div>
        </div>
      )}
      <Link
        href="/merchant/jobs/new"
        className="inline-block bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover"
      >
        Đăng tin mới
      </Link>
    </div>
  );
}
