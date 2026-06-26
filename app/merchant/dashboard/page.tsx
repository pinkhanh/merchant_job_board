'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BriefcaseIcon,
  PauseCircleIcon,
  ClockIcon,
  UserGroupIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

type Counts = { live: number; paused: number; expired: number; totalApplicants: number };

export default function DashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch('/api/merchant/dashboard-counts')
      .then((res) => res.json())
      .then(setCounts);
  }, []);

  const stats = counts
    ? [
        {
          label: 'Tin đang tuyển',
          value: counts.live,
          icon: BriefcaseIcon,
          color: 'text-status-active-text',
          bg: 'bg-status-active-bg',
          href: '/merchant/jobs',
        },
        {
          label: 'Tin tạm dừng',
          value: counts.paused,
          icon: PauseCircleIcon,
          color: 'text-status-pending-text',
          bg: 'bg-status-pending-bg',
          href: '/merchant/jobs',
        },
        {
          label: 'Tin hết hạn',
          value: counts.expired,
          icon: ClockIcon,
          color: 'text-text-secondary',
          bg: 'bg-gray-100',
          href: '/merchant/jobs',
        },
        {
          label: 'Tổng ứng viên',
          value: counts.totalApplicants,
          icon: UserGroupIcon,
          color: 'text-primary',
          bg: 'bg-primary-surface',
          href: '/merchant/applicants',
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/merchant/jobs/new"
          className="inline-flex items-center gap-2 bg-primary text-white rounded-md px-4 py-2 font-semibold hover:bg-primary-hover text-sm"
        >
          <PlusCircleIcon className="w-4 h-4" />
          Đăng tin mới
        </Link>
      </div>

      {counts === null ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-border rounded-lg shadow-card p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {stats.map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white border border-border rounded-lg shadow-card p-5 flex items-start gap-4 hover:border-primary transition-colors"
            >
              <div className={`${s.bg} p-2.5 rounded-lg shrink-0`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
                <p className="text-sm text-text-secondary mt-0.5">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href="/merchant/jobs" className="inline-block border border-border text-text-secondary rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm">
          Quản lý tin đăng
        </Link>
        <Link href="/merchant/applicants" className="inline-block border border-border text-text-secondary rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm">
          Xem ứng viên
        </Link>
        <Link href="/merchant/profile" className="inline-block border border-border text-text-secondary rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm">
          Hồ sơ thương hiệu
        </Link>
      </div>
    </div>
  );
}
