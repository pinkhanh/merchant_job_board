'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ApplyModal } from '@/components/ApplyModal';
import { Avatar } from '@/components/worker/ui/Avatar';

type JobDetail = {
  id: string;
  title: string;
  industry: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  schedule: { days: string[]; start: string; end: string };
  requirements: string | null;
  benefits: string[];
  description: string | null;
  isClosed: boolean;
  merchant: { brandName: string; logoUrl: string | null };
  jobPostStores: { store: { name: string; streetAddress: string; ward: string; district: string; city: string } }[];
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    fetch(`/api/worker/jobs/${id}`)
      .then((res) => res.json())
      .then(setJob);
  }, [id]);

  if (!job) return null;

  const store = job.jobPostStores[0]?.store;

  return (
    <div className="px-4 py-6 max-w-[1100px] mx-auto pb-24">
      <div className="flex items-center gap-2 mb-1">
        <Avatar variant={job.merchant.logoUrl ? 'image' : 'person'} src={job.merchant.logoUrl ?? undefined} alt={job.merchant.brandName} size={32} />
        <p className="text-sm text-worker-text-secondary">{job.merchant.brandName}</p>
      </div>
      <h1 className="text-2xl font-extrabold mb-3">{job.title}</h1>

      {job.isClosed && (
        <span className="inline-block bg-worker-text-disabled text-white text-xs rounded-worker-pill px-3 py-1 mb-3">
          Đã hết hạn nộp
        </span>
      )}

      <p className="text-worker-primary font-bold text-lg mb-2">
        {job.salaryMin || job.salaryMax
          ? `${(job.salaryMin ?? job.salaryMax)!.toLocaleString('vi-VN')} - ${(job.salaryMax ?? job.salaryMin)!.toLocaleString('vi-VN')}`
          : 'Thỏa thuận'}
      </p>

      <p className="text-sm text-worker-text-secondary mb-4">
        {job.schedule.days.join(', ')} · {job.schedule.start} - {job.schedule.end}
      </p>

      {store && (
        <p className="text-sm text-worker-text-secondary mb-4">
          {store.name} — {store.streetAddress}, {store.ward}, {store.district}, {store.city}
        </p>
      )}

      {job.description && <p className="mb-4 whitespace-pre-line">{job.description}</p>}
      {job.requirements && (
        <>
          <h2 className="font-bold mb-1">Yêu cầu</h2>
          <p className="mb-4 whitespace-pre-line">{job.requirements}</p>
        </>
      )}
      {job.benefits.length > 0 && (
        <>
          <h2 className="font-bold mb-1">Quyền lợi</h2>
          <ul className="list-disc pl-5 mb-4">
            {job.benefits.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-worker-border p-4">
        <button
          onClick={() => setShowApply(true)}
          disabled={job.isClosed}
          className="w-full bg-worker-primary disabled:bg-worker-text-disabled text-white rounded-worker-pill py-3 font-bold"
        >
          Ứng tuyển ngay
        </button>
      </div>

      {showApply && <ApplyModal job={job} onClose={() => setShowApply(false)} />}
    </div>
  );
}
