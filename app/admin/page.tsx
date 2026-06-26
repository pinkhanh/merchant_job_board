'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BuildingStorefrontIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type Counts = {
  totalMerchants: number;
  activeMerchants: number;
  liveJobs: number;
  totalApplications: number;
};

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard-counts')
      .then((res) => res.json())
      .then(setCounts);
  }, []);

  const stats = counts
    ? [
        {
          label: 'Tổng Merchant',
          value: counts.totalMerchants,
          sub: `${counts.activeMerchants} đang hoạt động`,
          icon: BuildingStorefrontIcon,
          color: 'text-primary',
          bg: 'bg-primary-surface',
          href: '/admin/merchants',
        },
        {
          label: 'Tin đang tuyển',
          value: counts.liveJobs,
          sub: 'Tin live trên nền tảng',
          icon: BriefcaseIcon,
          color: 'text-status-active-text',
          bg: 'bg-status-active-bg',
          href: '/admin/jobs',
        },
        {
          label: 'Tổng ứng viên',
          value: counts.totalApplications,
          sub: 'Từ tất cả tin tuyển dụng',
          icon: UserGroupIcon,
          color: 'text-status-info-text',
          bg: 'bg-status-info-bg',
          href: '/admin/applicants',
        },
        {
          label: 'Merchant hoạt động',
          value: counts.activeMerchants,
          sub: `/ ${counts.totalMerchants} tổng số`,
          icon: CheckCircleIcon,
          color: 'text-status-active-text',
          bg: 'bg-status-active-bg',
          href: '/admin/merchants',
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tổng quan</h1>

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
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">{s.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/merchants" className="inline-block bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover text-sm">
          Quản lý Merchant
        </Link>
        <Link href="/admin/jobs" className="inline-block border border-border text-text-secondary rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm">
          Tin tuyển dụng
        </Link>
        <Link href="/admin/applicants" className="inline-block border border-border text-text-secondary rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm">
          Ứng viên
        </Link>
      </div>
    </div>
  );
}
