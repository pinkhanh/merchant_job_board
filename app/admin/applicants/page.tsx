'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: string;
  applicantName: string;
  importStatus: string;
  jobPost: { title: string };
};

export default function AdminApplicantsPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    fetch('/api/admin/applications')
      .then((res) => res.json())
      .then(setApplications);
  }, []);

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
              <td className="px-4 py-3 text-text-secondary">—</td>
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
