'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: string;
  applicantName: string;
  importStatus: string;
  jobPost: { title: string; merchant: { brandName: string } };
};

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return searchParams.toString();
}

export default function AdminApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobPostTitle, setJobPostTitle] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  useEffect(() => {
    const query = buildQuery({ jobPostTitle, appliedFrom, appliedTo });
    fetch(`/api/admin/applications${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then(setApplications);
  }, [jobPostTitle, appliedFrom, appliedTo]);

  async function handleExport() {
    const query = buildQuery({ jobPostTitle, appliedFrom, appliedTo });
    const res = await fetch(`/api/admin/applications/export${query ? `?${query}` : ''}`);
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
            onChange={(e) => setJobPostTitle(e.target.value)}
            placeholder="Tìm theo tên vị trí"
            className="border border-border rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Từ ngày
          <input
            type="date"
            value={appliedFrom}
            onChange={(e) => setAppliedFrom(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày
          <input
            type="date"
            value={appliedTo}
            onChange={(e) => setAppliedTo(e.target.value)}
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
            <th className="px-4 py-3 text-left">Merchant</th>
            <th className="px-4 py-3 text-left">Job</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3">{app.applicantName}</td>
              <td className="px-4 py-3 text-text-secondary">—</td>
              <td className="px-4 py-3">{app.jobPost.merchant.brandName}</td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
              <td className="px-4 py-3">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                    app.importStatus === 'new'
                      ? 'bg-status-info-bg text-status-info-text'
                      : 'bg-status-active-bg text-status-active-text'
                  }`}
                >
                  {app.importStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
