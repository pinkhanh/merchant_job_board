'use client';

import { useEffect, useState } from 'react';
import { Pagination } from '@/components/Pagination';
import { PAGE_SIZE } from '@/lib/constants/pagination';

type Application = {
  id: string;
  applicantName: string;
  phoneNumber: string;
  appliedAt: string;
  jobPost: { title: string };
};

type JobOption = { id: string; title: string };

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

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 2) + '••••••' + phone.slice(8);
}

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
  const [jobOptions, setJobOptions] = useState<JobOption[]>([]);

  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);

  const [jobPostId, setJobPostId] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((body) => setJobOptions(body.items ?? []));
  }, []);

  useEffect(() => {
    fetch('/api/applications/export-logs')
      .then((r) => r.json())
      .then(setExportLogs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const query = buildQuery({ page: String(page), jobPostId, appliedFrom, appliedTo, applicantName, phoneNumber });
    fetch(`/api/applications?${query}`)
      .then((res) => res.json())
      .then((body) => {
        setApplications(body.items);
        setTotal(body.total);
      });
  }, [page, jobPostId, appliedFrom, appliedTo, applicantName, phoneNumber]);

  async function handleReveal(id: string) {
    const res = await fetch(`/api/applications/${id}/reveal-phone`, { method: 'POST' });
    const body = await res.json();
    setRevealed((r) => ({ ...r, [id]: body.phoneNumber }));
  }

  function handleFilterChange(setter: (value: string) => void) {
    return (value: string) => {
      setPage(1);
      setter(value);
    };
  }

  async function handleExport() {
    const query = buildQuery({ jobPostId, appliedFrom, appliedTo, applicantName, phoneNumber });
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
          <select
            value={jobPostId}
            onChange={(e) => handleFilterChange(setJobPostId)(e.target.value)}
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
            onChange={(e) => handleFilterChange(setAppliedFrom)(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          Đến ngày
          <input
            type="date"
            value={appliedTo}
            onChange={(e) => handleFilterChange(setAppliedTo)(e.target.value)}
            className="border border-border rounded-md px-2 py-2 text-sm bg-white"
          />
        </label>
        <input
          type="text"
          placeholder="Tìm theo tên"
          value={applicantName}
          onChange={(e) => handleFilterChange(setApplicantName)(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-white text-sm"
        />
        <input
          type="text"
          placeholder="Tìm theo SĐT"
          value={phoneNumber}
          onChange={(e) => handleFilterChange(setPhoneNumber)(e.target.value)}
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
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Thời gian nộp</th>
            <th className="px-4 py-3 text-left">Vị trí</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="border-b border-border hover:bg-primary-surface">
              <td className="px-4 py-3">{app.applicantName}</td>
              <td className="px-4 py-3">
                <span className="text-text-secondary">
                  {revealed[app.id] ?? maskPhone(app.phoneNumber)}
                </span>
                {!revealed[app.id] && (
                  <button onClick={() => handleReveal(app.id)} className="ml-2 text-primary text-sm hover:underline">
                    Hiện SĐT
                  </button>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                {new Date(app.appliedAt).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                })}
              </td>
              <td className="px-4 py-3">{app.jobPost.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} itemLabel="ứng viên" onPageChange={setPage} />
    </div>
  );
}
