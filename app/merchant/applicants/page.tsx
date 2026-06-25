'use client';

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/lib/constants/pagination';

type Application = {
  id: string;
  applicantName: string;
  importStatus: 'new' | 'imported';
  jobPost: { title: string };
};

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return searchParams.toString();
}

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  const [jobPostTitle, setJobPostTitle] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  useEffect(() => {
    const query = buildQuery({ page: String(page), jobPostTitle, appliedFrom, appliedTo });
    fetch(`/api/applications?${query}`)
      .then((res) => res.json())
      .then((body) => {
        setApplications(body.items);
        setTotal(body.total);
      });
  }, [page, jobPostTitle, appliedFrom, appliedTo]);

  async function handleReveal(id: string) {
    const res = await fetch(`/api/applications/${id}/reveal-phone`, { method: 'POST' });
    const body = await res.json();
    setRevealed((r) => ({ ...r, [id]: body.phoneNumber }));
  }

  async function handleStatusChange(id: string, importStatus: 'new' | 'imported') {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importStatus }),
    });
    setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, importStatus } : a)));
  }

  function handleFilterChange(setter: (value: string) => void) {
    return (value: string) => {
      setPage(1);
      setter(value);
    };
  }

  async function handleExport() {
    const query = buildQuery({ jobPostTitle, appliedFrom, appliedTo });
    const res = await fetch(`/api/applications/export?${query}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ung-vien.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ứng viên</h1>
      <div className="flex gap-2 mb-4 items-end">
        <label className="flex flex-col gap-1 text-xs font-medium flex-1">
          Tên vị trí
          <input
            value={jobPostTitle}
            onChange={(e) => handleFilterChange(setJobPostTitle)(e.target.value)}
            placeholder="Tìm theo tên vị trí"
            className="border border-border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Từ ngày
          <input
            type="date"
            value={appliedFrom}
            onChange={(e) => handleFilterChange(setAppliedFrom)(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày
          <input
            type="date"
            value={appliedTo}
            onChange={(e) => handleFilterChange(setAppliedTo)(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm"
          />
        </label>
        <button
          onClick={handleExport}
          className="border border-border rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary-surface"
        >
          Xuất CSV
        </button>
      </div>
      <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
        <thead>
          <tr className="bg-primary text-white text-xs uppercase">
            <th className="px-4 py-3 text-left">Tên</th>
            <th className="px-4 py-3 text-left">SĐT</th>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3">{app.applicantName}</td>
              <td className="px-4 py-3">
                <span className="text-text-secondary">{revealed[app.id] ?? '09x••••89'}</span>
                {!revealed[app.id] && (
                  <button onClick={() => handleReveal(app.id)} className="ml-2 text-primary text-sm hover:underline">
                    Hiện SĐT
                  </button>
                )}
              </td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleStatusChange(app.id, app.importStatus === 'new' ? 'imported' : 'new')}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                    app.importStatus === 'new'
                      ? 'bg-status-info-bg text-status-info-text'
                      : 'bg-status-active-bg text-status-active-text'
                  }`}
                >
                  {app.importStatus === 'new' ? 'Mới' : 'Đã nhập'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="ứng viên" onPageChange={setPage} />
    </div>
  );
}
