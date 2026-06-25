'use client';

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/lib/constants/pagination';

type JobPost = { id: string; title: string; status: string; deadline: string };

export default function ManageJobPostsPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/jobs?page=${page}`)
      .then((res) => res.json())
      .then((body) => {
        setJobPosts(body.items);
        setTotal(body.total);
      });
  }, [page]);

  async function handleAction(id: string, action: 'pause' | 'reactivate' | 'delete') {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setJobPosts((posts) => posts.filter((p) => p.id !== id || action !== 'delete'));
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
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên vị trí</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hạn nộp</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {jobPosts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-primary font-medium">{post.title}</td>
              <td className="px-4 py-3">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[post.status]}`}>
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
              </td>
              <td className="px-4 py-3 text-text-secondary">{post.deadline}</td>
              <td className="px-4 py-3 flex gap-2">
                {post.status === 'live' && (
                  <button onClick={() => handleAction(post.id, 'pause')} className="text-primary text-sm hover:underline">
                    Tạm dừng
                  </button>
                )}
                {post.status === 'paused' && (
                  <button onClick={() => handleAction(post.id, 'reactivate')} className="text-primary text-sm hover:underline">
                    Kích hoạt lại
                  </button>
                )}
                <button onClick={() => handleAction(post.id, 'delete')} className="text-status-off-text text-sm hover:underline">
                  Xoá
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="tin" onPageChange={setPage} />
    </div>
  );
}
