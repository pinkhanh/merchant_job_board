'use client';

import { useEffect, useState } from 'react';
import { ApplicantDetailModal } from '@/components/ApplicantDetailModal';

type Application = {
  id: string;
  applicantName: string;
  maskedPhone: string;
  phoneNumber: string;
  importStatus: string;
  appliedAt: string;
  jobPost: {
    title: string;
    merchant: { brandName: string };
    jobPostStores: { store: { name: string } }[];
  };
};

type JobOption = { id: string; title: string };
type MerchantOption = { id: string; brandName: string };

type ExportLog = {
  id: string;
  fileName: string;
  exportedAt: string;
  applicantCount: number;
};

function formatExportDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const [jobPostId, setJobPostId] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetch('/api/admin/jobs')
      .then((res) => res.json())
      .then((jobs: JobOption[]) => setJobOptions(jobs));
    fetch('/api/admin/merchants')
      .then((res) => res.json())
      .then((merchants: MerchantOption[]) => setMerchantOptions(merchants));
  }, []);

  useEffect(() => {
    fetch('/api/admin/applications/export-logs')
      .then((r) => r.json())
      .then(setExportLogs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = buildQuery({ jobPostId, merchantId, appliedFrom, appliedTo, applicantName, phoneNumber });
    fetch(`/api/admin/applications${query ? `?${query}` : ''}`)
      .then((res) => res.json())
      .then(setApplications);
  }, [jobPostId, merchantId, appliedFrom, appliedTo, applicantName, phoneNumber]);

  async function handleExport() {
    const query = buildQuery({ jobPostId, merchantId, appliedFrom, appliedTo, applicantName, phoneNumber });
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
            className="border border-border rounded-md px-3 py-2 text-sm bg-white"
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
            className="border border-border rounded-md px-3 py-2 text-sm bg-white"
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
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày
          <input
            type="date"
            value={appliedTo}
            onChange={(e) => setAppliedTo(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <input
          type="text"
          placeholder="Tìm theo tên"
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
        />
        <input
          type="text"
          placeholder="Tìm theo SĐT"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
        />
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
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Thời gian nộp</th>
            <th className="px-4 py-3 text-left">Vị trí</th>
            <th className="px-4 py-3 text-left">Địa điểm</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3 text-sm">
                  <button
                    className="font-medium text-primary hover:underline text-left"
                    onClick={() => setSelectedPhone(app.phoneNumber)}
                  >
                    {app.applicantName}
                  </button>
                </td>
              <td className="px-4 py-3 text-text-secondary">{app.maskedPhone}</td>
              <td className="px-4 py-3">{app.jobPost.merchant.brandName}</td>
              <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                {new Date(app.appliedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
              <td className="px-4 py-3 text-text-secondary text-sm">
                {app.jobPost.jobPostStores.length > 1
                  ? `${app.jobPost.jobPostStores.length} cửa hàng`
                  : app.jobPost.jobPostStores[0]?.store.name ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedPhone && (
        <ApplicantDetailModal
          phone={selectedPhone}
          onClose={() => setSelectedPhone(null)}
          isAdmin
        />
      )}
      {exportLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Lịch sử xuất CSV</h2>
          <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
            <thead>
              <tr className="bg-primary text-white text-xs uppercase">
                <th className="px-4 py-3 text-left">Tên file</th>
                <th className="px-4 py-3 text-left">Ngày xuất</th>
                <th className="px-4 py-3 text-left">Số ứng viên</th>
              </tr>
            </thead>
            <tbody>
              {exportLogs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-primary-surface">
                  <td className="px-4 py-3 text-sm font-medium">{log.fileName}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{formatExportDate(log.exportedAt)}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{log.applicantCount} ứng viên</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
