'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type JobDetail = {
  id: string;
  title: string;
  status: string;
  industry: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: string;
  deadline: string;
  description: string | null;
  createdAt: string;
  merchant: { brandName: string; logoUrl: string | null };
  jobPostStores: { store: { name: string; streetAddress: string; ward: string; district: string; city: string } }[];
};

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

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  part_time: 'Bán thời gian',
  full_time: 'Toàn thời gian',
  shift: 'Theo ca',
  seasonal: 'Thời vụ',
};

const SALARY_TYPE_LABEL: Record<string, string> = {
  hourly: 'Theo giờ',
  shift: 'Theo ca',
  monthly: 'Theo tháng',
  negotiable: 'Thỏa thuận',
};

function formatDeadline(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const card = 'bg-white border border-border rounded-lg shadow-card p-8';

export default function AdminJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/jobs/${id}`)
      .then((res) => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then((data) => { if (data) setJob(data); });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <p className="text-status-off-text">Không tìm thấy tin tuyển dụng.</p>
        <Link href="/admin/jobs" className="text-primary hover:underline text-sm mt-2 inline-block">← Quay lại danh sách</Link>
      </div>
    );
  }

  if (!job) return null;

  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${(job.salaryMin ?? job.salaryMax)!.toLocaleString('vi-VN')} - ${(job.salaryMax ?? job.salaryMin)!.toLocaleString('vi-VN')} đ`
      : 'Thỏa thuận';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/jobs" className="text-primary hover:underline text-sm">← Danh sách tin</Link>
      </div>

      <div className={card}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
            <p className="text-sm text-text-secondary">{job.merchant.brandName}</p>
          </div>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[job.status]}`}>
            {STATUS_LABEL[job.status] ?? job.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Ngành nghề</p>
            <p>{job.industry}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Loại hình làm việc</p>
            <p>{EMPLOYMENT_TYPE_LABEL[job.employmentType] ?? job.employmentType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Mức lương</p>
            <p>{salaryLabel} ({SALARY_TYPE_LABEL[job.salaryType] ?? job.salaryType})</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Hạn nộp hồ sơ</p>
            <p>{formatDeadline(job.deadline)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Ngày tạo</p>
            <p>{formatCreatedAt(job.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Số địa điểm</p>
            <p>{job.jobPostStores.length} cửa hàng</p>
          </div>
        </div>

        {job.jobPostStores.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Địa điểm làm việc</p>
            <ul className="flex flex-col gap-1">
              {job.jobPostStores.map(({ store }, i) => (
                <li key={i} className="text-sm">
                  {store.name} — {[store.streetAddress, store.ward, store.district, store.city].filter(Boolean).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {job.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Mô tả công việc</p>
            <p className="text-sm whitespace-pre-line border border-border rounded-md p-3">{job.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
