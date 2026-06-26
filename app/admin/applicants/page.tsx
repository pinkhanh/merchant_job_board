'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: string;
  applicantName: string;
  maskedPhone: string;
  importStatus: string;
  jobPost: { title: string; merchant: { brandName: string } };
};

type JobOption = { id: string; title: string };
type MerchantOption = { id: string; brandName: string };

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  return searchParams.toString();
}

export default function AdminApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<MerchantOption[]>([]);

  const [jobPostId, setJobPostId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');

  useEffect(() => {
    fetch('/api/admin/jobs')
      .then((res) => res.json())
      .then((jobs: JobOption[]) => setJobOptions(jobs));
    fetch('/api/admin/merchants')
      .then((res) => res.json())
      .then((merchants: MerchantOption[]) => setMerchantOptions(merchants));
  }, []);

  useEffect(() => {
    const query = buildQuery({ jobPostId, merchantId, appliedFrom, appliedTo });
    fetch(`/api/admin/applications${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then(setApplications);
  }, [jobPostId, merchantId, appliedFrom, appliedTo]);

  async function handleExport() {
    const query = buildQuery({ jobPostId, merchantId, appliedFrom, appliedTo });
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
      <div className="flex gap-2 mb-4 items-end flex-wrap">
        <label className="flex flex-col gap-1 text-xs font-medium flex-1 min-w-[160px]">
          Hồ sơ thương hiệu
          <select
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả thương hiệu</option>
            {merchantOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.brandName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium flex-1 min-w-[160px]">
          Tên vị trí
          <select
            value={jobPostId}
            onChange={(e) => setJobPostId(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Tất cả vị trí</option>
            {jobOptions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
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
            <th className="px-4 py-3 text-left">Thương hiệu</th>
            <th className="px-4 py-3 text-left">Vị trí</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3">{app.applicantName}</td>
              <td className="px-4 py-3 text-text-secondary">{app.maskedPhone}</td>
              <td className="px-4 py-3">{app.jobPost.merchant.brandName}</td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
