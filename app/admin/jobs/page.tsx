'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { ActionsDropdown } from '@/components/ActionsDropdown';

type JobPost = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  employmentType: string;
  merchant: { brandName: string };
  jobPostStores: { store: { name: string } }[];
};

function formatDeadline(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function AdminJobsPage() {
  const showToast = useToast();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
  const [filterCreatedTo, setFilterCreatedTo] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const [merchantOptions, setMerchantOptions] = useState<{ id: string; brandName: string }[]>([]);
  const [filterMerchantId, setFilterMerchantId] = useState('');

  useEffect(() => {
    fetch('/api/admin/merchants').then((r) => r.json()).then(setMerchantOptions);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterMerchantId) params.set('merchantId', filterMerchantId);
    if (filterEmploymentType) params.set('employmentType', filterEmploymentType);
    if (filterCreatedFrom) params.set('createdFrom', filterCreatedFrom);
    if (filterCreatedTo) params.set('createdTo', filterCreatedTo);
    const queryString = params.toString();
    fetch(`/api/admin/jobs${queryString ? `?${queryString}` : ''}`)
      .then((r) => r.json())
      .then(setJobPosts);
  }, [filterMerchantId, filterEmploymentType, filterCreatedFrom, filterCreatedTo]);

  async function handlePause(id: string) {
    const reason = reasonDraft[id];
    if (!reason) {
      showToast('error', 'Vui lòng nhập lý do tạm dừng');
      return;
    }
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/jobs/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', reason }),
      });
      if (res.ok) {
        showToast('success', 'Đã tạm dừng tin tuyển dụng');
        setJobPosts((posts) => posts.map((p) => (p.id === id ? { ...p, status: 'paused' } : p)));
      } else {
        showToast('error', 'Tạm dừng thất bại, vui lòng thử lại');
      }
    } catch {
      showToast('error', 'Tạm dừng thất bại, vui lòng thử lại');
    } finally {
      setLoadingId(null);
    }
  }

  const STATUS_BADGE: Record<string, string> = {
    live: 'bg-status-active-bg text-status-active-text',
    paused: 'bg-status-pending-bg text-status-pending-text',
    expired: 'bg-status-off-bg text-status-off-text',
    draft: 'bg-gray-100 text-text-secondary',
  };

  const STATUS_LABEL: Record<string, string> = {
    live: 'Đang tuyển',
    paused: 'Tạm dừng',
    expired: 'Hết hạn',
    draft: 'Bản nháp',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tin tuyển dụng</h1>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Thương hiệu
          <select
            value={filterMerchantId}
            onChange={(e) => setFilterMerchantId(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          >
            <option value="">Tất cả</option>
            {merchantOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brandName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Loại hình
          <select
            value={filterEmploymentType}
            onChange={(e) => setFilterEmploymentType(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          >
            <option value="">Tất cả</option>
            <option value="part_time">Bán thời gian</option>
            <option value="full_time">Toàn thời gian</option>
            <option value="shift">Theo ca</option>
            <option value="seasonal">Thời vụ</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Từ ngày tạo
          <input
            type="date"
            lang="vi"
            placeholder="dd/mm/yyyy"
            value={filterCreatedFrom}
            onChange={(e) => setFilterCreatedFrom(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày tạo
          <input
            type="date"
            lang="vi"
            placeholder="dd/mm/yyyy"
            value={filterCreatedTo}
            onChange={(e) => setFilterCreatedTo(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <Link
          href="/admin/jobs/new"
          className="bg-primary text-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary-hover self-end"
        >
          + Đăng tin mới
        </Link>
      </div>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên vị trí</th>
            <th className="px-4 py-3 text-left">Merchant</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hạn nộp</th>
            <th className="px-4 py-3 text-left">Địa điểm</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobPosts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 font-medium">
                <Link href={`/admin/jobs/${post.id}`} className="text-primary hover:underline">{post.title}</Link>
              </td>
              <td className="px-4 py-3">{post.merchant.brandName}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{formatDeadline(post.deadline)}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">
                {post.jobPostStores.length > 1
                  ? `${post.jobPostStores.length} cửa hàng`
                  : post.jobPostStores[0]?.store.name ?? '—'}
              </td>
              <td className="px-4 py-3 flex gap-2 items-center">
                {post.status !== 'paused' && (
                  <input
                    placeholder="Lý do tạm dừng"
                    value={reasonDraft[post.id] ?? ''}
                    onChange={(e) => setReasonDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                    className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 bg-white"
                  />
                )}
                <ActionsDropdown
                  isLoading={loadingId === post.id}
                  items={[
                    ...(post.status !== 'paused'
                      ? [{ label: 'Tạm dừng', onClick: () => handlePause(post.id) }]
                      : []),
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
