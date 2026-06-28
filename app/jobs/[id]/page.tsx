'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApplyModal } from '@/components/ApplyModal';
import { Avatar } from '@/components/worker/ui/Avatar';
import {
  ArrowLeftIcon,
  ShareIcon,
  CalendarDaysIcon,
  MapPinIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

type JobDetail = {
  id: string;
  title: string;
  industry: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: string;
  schedule: { days: string[]; start: string; end: string };
  requirements: string | null;
  benefits: string[];
  description: string | null;
  isClosed: boolean;
  deadline: string;
  experienceRequired: string | null;
  merchant: { brandName: string; logoUrl: string | null };
  jobPostStores: { store: { name: string; streetAddress: string; ward: string; district: string; city: string } }[];
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  part_time: 'Bán thời gian',
  full_time: 'Toàn thời gian',
  shift: 'Theo ca',
  seasonal: 'Thời vụ',
};

const DAY_LABELS: Record<string, string> = {
  mon: 'T2', tue: 'T3', wed: 'T4', thu: 'T5', fri: 'T6', sat: 'T7', sun: 'CN',
};

function formatSchedule(schedule: { days: string[]; start: string; end: string }) {
  const days = schedule.days.map((d) => DAY_LABELS[d] ?? d).join(', ');
  return `${days} · ${schedule.start} – ${schedule.end}`;
}

function formatDeadline(deadline: string) {
  const d = new Date(deadline);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatSalary(min: number | null, max: number | null, salaryType: string) {
  const suffix: Record<string, string> = {
    hourly: '/giờ', shift: '/ca', monthly: '/tháng', negotiable: '',
  };
  if (!min && !max) return 'Thỏa thuận';
  const s = suffix[salaryType] ?? '';
  if (min && max) return `${min.toLocaleString('vi-VN')} – ${max.toLocaleString('vi-VN')}đ${s}`;
  return `${(min ?? max)!.toLocaleString('vi-VN')}đ${s}`;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    fetch(`/api/worker/jobs/${id}`)
      .then((res) => res.json())
      .then(setJob);
  }, [id]);

  if (!job) return null;

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => router.back()} className="p-1 -ml-1" aria-label="Quay lại">
          <ArrowLeftIcon className="w-5 h-5 text-worker-text-secondary" />
        </button>
        <button
          onClick={() => navigator.share?.({ title: job.title, url: window.location.href })}
          className="p-1 -mr-1"
          aria-label="Chia sẻ"
        >
          <ShareIcon className="w-5 h-5 text-worker-text-secondary" />
        </button>
      </div>

      <div className="flex flex-col items-center px-4 pt-2 pb-5">
        <Avatar
          variant={job.merchant.logoUrl ? 'image' : 'person'}
          src={job.merchant.logoUrl ?? undefined}
          alt={job.merchant.brandName}
          size={72}
        />
        <p className="text-sm text-worker-text-secondary mt-3">{job.merchant.brandName}</p>
        <h1 className="text-xl font-extrabold mt-1 text-center">{job.title}</h1>

        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span className="text-worker-primary font-bold text-base">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
          </span>
          <span className="bg-worker-accent text-worker-primary text-xs font-semibold px-2.5 py-0.5 rounded-worker-pill">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
          </span>
          {job.isClosed && (
            <span className="bg-worker-text-disabled text-white text-xs font-semibold px-2.5 py-0.5 rounded-worker-pill">
              Hết hạn
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 mb-6">
        <div className="bg-white rounded-worker-md shadow-worker-card p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-worker-text-secondary">
            <CalendarDaysIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">Lịch làm việc</span>
          </div>
          <p className="text-xs font-semibold text-worker-primary leading-snug">
            {formatSchedule(job.schedule)}
          </p>
        </div>

        <div className="bg-white rounded-worker-md shadow-worker-card p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-worker-text-secondary">
            <MapPinIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">Địa chỉ</span>
          </div>
          <p className="text-xs font-semibold leading-snug">
            {job.jobPostStores.length > 1
              ? `${job.jobPostStores.length} địa điểm`
              : job.jobPostStores[0]?.store
              ? `${job.jobPostStores[0].store.district}, ${job.jobPostStores[0].store.city}`
              : '–'}
          </p>
        </div>

        <div className="bg-white rounded-worker-md shadow-worker-card p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-worker-text-secondary">
            <ClockIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">Hạn nộp hồ sơ</span>
          </div>
          <p className="text-xs font-semibold">{formatDeadline(job.deadline)}</p>
        </div>

        <div className="bg-white rounded-worker-md shadow-worker-card p-3.5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-worker-text-secondary">
            <StarIcon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-medium">Kinh nghiệm</span>
          </div>
          <p className="text-xs font-semibold">
            {job.experienceRequired ?? 'Không yêu cầu'}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-5">
        {job.description && (
          <section>
            <h2 className="font-bold text-sm mb-2">Mô tả công việc</h2>
            <p className="text-sm text-worker-text-secondary whitespace-pre-line leading-relaxed">{job.description}</p>
          </section>
        )}

        {job.requirements && (
          <section>
            <h2 className="font-bold text-sm mb-2">Yêu cầu</h2>
            <p className="text-sm text-worker-text-secondary whitespace-pre-line leading-relaxed">{job.requirements}</p>
          </section>
        )}

        {job.benefits.length > 0 && (
          <section>
            <h2 className="font-bold text-sm mb-2">Quyền lợi</h2>
            <ul className="space-y-1.5">
              {job.benefits.map((b) => (
                <li key={b} className="text-sm text-worker-text-secondary flex gap-2">
                  <span className="text-worker-primary mt-0.5">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.jobPostStores.length > 0 && (
          <section>
            <h2 className="font-bold text-sm mb-2">Địa điểm làm việc</h2>
            {job.jobPostStores.map(({ store }, i) => (
              <p key={i} className="text-sm text-worker-text-secondary mb-1">
                {store.name} — {[store.streetAddress, store.ward, store.district, store.city].filter(Boolean).join(', ')}
              </p>
            ))}
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-worker-border p-4">
        <button
          onClick={() => setShowApply(true)}
          disabled={job.isClosed}
          className="w-full bg-worker-primary disabled:bg-worker-text-disabled text-white rounded-worker-pill py-3 font-bold text-sm"
        >
          Ứng tuyển ngay
        </button>
      </div>

      {showApply && <ApplyModal job={job} onClose={() => setShowApply(false)} />}
    </div>
  );
}
