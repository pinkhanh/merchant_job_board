'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@/components/worker/ui/Spinner';

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
  jobPostStores: { store: { name: string; streetAddress: string; ward: string; district: string; city: string } }[];
};

type Applicant = {
  id: string;
  applicantName: string;
  importStatus: 'new' | 'imported';
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
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

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  part_time: 'Bán thời gian',
  shift: 'Theo ca',
  seasonal: 'Thời vụ',
};

const SALARY_TYPE_LABEL: Record<string, string> = {
  hourly: 'Theo giờ',
  shift: 'Theo ca',
  monthly: 'Theo tháng',
  negotiable: 'Thỏa thuận',
};

const IMPORT_STATUS_LABEL: Record<string, string> = {
  new: 'Mới',
  imported: 'Đã nhập',
};

const card = 'bg-white border border-border rounded-lg shadow-card p-8';

export default function MerchantJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [isPausing, setIsPausing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [jobStatus, setJobStatus] = useState('');

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data);
        setJobStatus(data.status);
      });
  }, [id]);

  async function handlePause() {
    setIsPausing(true);
    try {
      const newStatus = jobStatus === 'live' ? 'paused' : 'live';
      const res = await fetch(`/api/merchant/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setJobStatus(newStatus);
      else alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    } finally {
      setIsPausing(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Xác nhận xóa tin tuyển dụng này?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/merchant/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/merchant/jobs');
      else alert('Không thể xóa tin. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  }

  useEffect(() => {
    fetch(`/api/applications?jobPostId=${id}`)
      .then((res) => res.json())
      .then((body) => setApplicants(body.items ?? []));
  }, [id]);

  async function handleReveal(applicantId: string) {
    const res = await fetch(`/api/applications/${applicantId}/reveal-phone`, { method: 'POST' });
    const body = await res.json();
    setRevealed((r) => ({ ...r, [applicantId]: body.phoneNumber }));
  }

  if (!job) return null;

  const salaryLabel =
    job.salaryMin || job.salaryMax
      ? `${(job.salaryMin ?? job.salaryMax)!.toLocaleString('vi-VN')} - ${(job.salaryMax ?? job.salaryMin)!.toLocaleString('vi-VN')}`
      : 'Thỏa thuận';

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${STATUS_BADGE[job.status]}`}>
            {STATUS_LABEL[job.status] ?? job.status}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4 justify-end">
          <button
            onClick={handlePause}
            disabled={isPausing}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-primary-surface disabled:opacity-60 flex items-center gap-2"
          >
            {isPausing && <Spinner />}
            {jobStatus === 'live' ? 'Tạm dừng' : 'Tiếp tục đăng'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2"
          >
            {isDeleting && <Spinner />}
            Xóa
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Loại hình làm việc</p>
            <p>{EMPLOYMENT_TYPE_LABEL[job.employmentType] ?? job.employmentType}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Mức lương</p>
            <p>
              {salaryLabel} ({SALARY_TYPE_LABEL[job.salaryType] ?? job.salaryType})
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Hạn nộp hồ sơ</p>
            <p>{job.deadline ? fmtDate(job.deadline) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Cửa hàng</p>
            {job.jobPostStores.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {job.jobPostStores.map(({ store }) => (
                  <li key={store.name}>
                    {store.name} — {store.streetAddress}, {store.ward}, {store.district}, {store.city}
                  </li>
                ))}
              </ul>
            ) : (
              <p>—</p>
            )}
          </div>
        </div>

        {job.description && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">Mô tả công việc</p>
            <p className="whitespace-pre-line text-sm">{job.description}</p>
          </>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-4">Ứng viên đã ứng tuyển</h2>
        <table className="w-full bg-white border border-border rounded-lg shadow-card overflow-hidden">
          <thead>
            <tr className="bg-primary text-white text-xs uppercase">
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">SĐT</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr key={applicant.id} className="border-b border-border hover:bg-primary-surface">
                <td className="px-4 py-3">{applicant.applicantName}</td>
                <td className="px-4 py-3">
                  <span className="text-text-secondary">{revealed[applicant.id] ?? '09x••••89'}</span>
                  {!revealed[applicant.id] && (
                    <button
                      onClick={() => handleReveal(applicant.id)}
                      className="ml-2 text-primary text-sm hover:underline"
                    >
                      Hiện SĐT
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                      applicant.importStatus === 'new'
                        ? 'bg-status-info-bg text-status-info-text'
                        : 'bg-status-active-bg text-status-active-text'
                    }`}
                  >
                    {IMPORT_STATUS_LABEL[applicant.importStatus] ?? applicant.importStatus}
                  </span>
                </td>
              </tr>
            ))}
            {applicants.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-text-secondary" colSpan={3}>
                  Chưa có ứng viên nào ứng tuyển vào vị trí này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
