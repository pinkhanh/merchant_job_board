'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/lib/constants/pagination';
import { useToast } from '@/components/Toast';
import { ActionsDropdown } from '@/components/ActionsDropdown';

type JobPost = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  employmentType: string;
  jobPostStores: { store: { name: string } }[];
};

function formatDeadline(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function ManageJobPostsPage() {
  const showToast = useToast();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [filterEmploymentType, setFilterEmploymentType] = useState('');
  const [filterStoreId, setFilterStoreId] = useState('');
  const [filterJobCategory, setFilterJobCategory] = useState('');
  const [storeOptions, setStoreOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/merchant/stores?page=1')
      .then((r) => r.json())
      .then((b) => setStoreOptions(b.items ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (createdFrom) params.set('createdFrom', createdFrom);
    if (createdTo) params.set('createdTo', createdTo);
    if (filterEmploymentType) params.set('employmentType', filterEmploymentType);
    if (filterStoreId) params.set('storeId', filterStoreId);
    if (filterJobCategory) params.set('jobCategory', filterJobCategory);
    fetch(`/api/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((body) => {
        setJobPosts(body.items);
        setTotal(body.total);
      });
  }, [page, createdFrom, createdTo, filterEmploymentType, filterStoreId, filterJobCategory]);

  async function handleAction(id: string, action: 'pause' | 'reactivate' | 'delete') {
    const ACTION_LABELS: Record<string, string> = {
      pause: 'Tạm dừng tin thành công',
      reactivate: 'Kích hoạt tin thành công',
      delete: 'Đã xoá tin tuyển dụng',
    };
    setLoadingId(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        showToast('success', ACTION_LABELS[action] ?? 'Thao tác thành công');
        setJobPosts((posts) =>
          action === 'delete'
            ? posts.filter((p) => p.id !== id)
            : posts.map((p) =>
                p.id === id ? { ...p, status: action === 'pause' ? 'paused' : 'live' } : p
              )
        );
      } else {
        showToast('error', 'Thao tác thất bại, vui lòng thử lại');
      }
    } catch {
      showToast('error', 'Thao tác thất bại, vui lòng thử lại');
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
      <h1 className="text-2xl font-bold mb-6">Quản lý tin tuyển dụng</h1>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <label className="flex flex-col gap-1 text-xs font-medium">
          Từ ngày tạo
          <input
            type="date"
            lang="vi"
            placeholder="dd/mm/yyyy"
            value={createdFrom}
            onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày tạo
          <input
            type="date"
            lang="vi"
            placeholder="dd/mm/yyyy"
            value={createdTo}
            onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Loại hình
          <select
            value={filterEmploymentType}
            onChange={(e) => { setFilterEmploymentType(e.target.value); setPage(1); }}
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
          Cửa hàng
          <select
            value={filterStoreId}
            onChange={(e) => { setFilterStoreId(e.target.value); setPage(1); }}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          >
            <option value="">Tất cả cửa hàng</option>
            {storeOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
      </div>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên vị trí</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Địa điểm</th>
            <th className="px-4 py-3 text-left">Hạn nộp</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobPosts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-primary font-medium">
                <Link href={`/merchant/jobs/${post.id}`} className="hover:underline">
                  {post.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary text-sm">
                {(post.jobPostStores ?? []).length > 1
                  ? `${post.jobPostStores.length} cửa hàng`
                  : post.jobPostStores?.[0]?.store.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-text-secondary">{formatDeadline(post.deadline)}</td>
              <td className="px-4 py-3">
                <ActionsDropdown
                  isLoading={loadingId === post.id}
                  items={[
                    ...(post.status === 'live'
                      ? [{ label: 'Tạm dừng', onClick: () => handleAction(post.id, 'pause') }]
                      : []),
                    ...(post.status === 'paused'
                      ? [{ label: 'Kích hoạt lại', onClick: () => handleAction(post.id, 'reactivate') }]
                      : []),
                    { label: 'Xoá', onClick: () => handleAction(post.id, 'delete'), variant: 'danger' as const },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="tin" onPageChange={setPage} />
    </div>
  );
}
