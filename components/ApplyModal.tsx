'use client';

import { useState, type FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Notification } from '@/components/worker/ui/Notification';
import { Callout } from '@/components/worker/ui/Callout';
import { Avatar } from '@/components/worker/ui/Avatar';

type Job = {
  id: string;
  title: string;
  merchant: { brandName: string; logoUrl: string | null };
  jobPostStores: { store: { name: string; streetAddress: string; district: string; city: string } }[];
};

export function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const store = job.jobPostStores[0]?.store;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{10}$/.test(phone)) {
      setError('Số điện thoại phải gồm đúng 10 chữ số.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPostId: job.id, applicantName: name, phoneNumber: phone }),
      });
      const body = await res.json();
      if (!res.ok) {
        const err = body.error;
        const msg = Array.isArray(err)
          ? (err[0]?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.')
          : (typeof err === 'string' ? err : 'Đã có lỗi xảy ra, vui lòng thử lại.');
        setError(msg);
        return;
      }
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20">
      <div className="bg-white rounded-worker-md w-full max-w-[480px] mx-4 shadow-worker-modal p-6">
        {success ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-normal">Ứng tuyển</h2>
              <button onClick={onClose} aria-label="Đóng">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col items-center text-center py-8">
              <Notification
                variant="success"
                title="Đã gửi hồ sơ!"
                message="Nhà tuyển dụng sẽ liên hệ qua số điện thoại bạn đã cung cấp."
              />
              <button onClick={onClose} className="mt-6 w-full bg-worker-primary text-white rounded-worker-pill py-3 text-sm font-normal">
                Đóng
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-normal">Ứng tuyển</h2>
              <button onClick={onClose} aria-label="Đóng">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-worker-bg rounded-worker-md p-3.5 mb-4 flex items-center gap-3">
              <Avatar
                variant={job.merchant.logoUrl ? 'image' : 'person'}
                src={job.merchant.logoUrl ?? undefined}
                alt={job.merchant.brandName}
                size={40}
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-snug">{job.title}</p>
                <p className="text-xs text-worker-text-secondary truncate">
                  {job.merchant.brandName}
                  {store ? ` · ${store.streetAddress}, ${store.district}` : ''}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-normal flex flex-col gap-1">
                Họ và tên *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  required
                  className="border border-worker-border rounded-md px-3 py-2.5 text-sm"
                />
              </label>

              <label className="text-sm font-normal flex flex-col gap-1">
                Số điện thoại *
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại"
                  required
                  className="border border-worker-border rounded-md px-3 py-2.5 text-sm"
                />
              </label>

              {error && <Callout variant="error" message={error} />}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-worker-primary text-white rounded-worker-pill py-3 font-normal text-base hover:bg-worker-primary-hover disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              >
                {isSubmitting ? 'Đang gửi...' : 'Ứng tuyển ngay'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
