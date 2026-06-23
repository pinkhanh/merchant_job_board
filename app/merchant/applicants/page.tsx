'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: string;
  applicantName: string;
  importStatus: 'new' | 'imported';
  jobPost: { title: string };
};

export default function ApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/applications')
      .then((res) => res.json())
      .then(setApplications);
  }, []);

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ứng viên</h1>
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
    </div>
  );
}
