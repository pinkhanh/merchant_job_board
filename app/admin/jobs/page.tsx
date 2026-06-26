'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

type JobPost = { id: string; title: string; status: string; merchant: { brandName: string } };

export default function AdminJobsPage() {
  const showToast = useToast();
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/jobs')
      .then((res) => res.json())
      .then(setJobPosts);
  }, []);

  async function handlePause(id: string) {
    const reason = reasonDraft[id];
    if (!reason) {
      showToast('error', 'Vui lòng nhập lý do tạm dừng');
      return;
    }
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
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên vị trí</th>
            <th className="px-4 py-3 text-left">Merchant</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobPosts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-primary font-medium">{post.title}</td>
              <td className="px-4 py-3">{post.merchant.brandName}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
              </td>
              <td className="px-4 py-3 flex gap-2">
                <input
                  placeholder="Lý do tạm dừng"
                  value={reasonDraft[post.id] ?? ''}
                  onChange={(e) => setReasonDraft((d) => ({ ...d, [post.id]: e.target.value }))}
                  className="border border-border rounded-md px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
                <button
                  onClick={() => handlePause(post.id)}
                  className="bg-status-off-text text-white rounded-md px-3 py-1.5 text-sm font-semibold"
                >
                  Tạm dừng
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
