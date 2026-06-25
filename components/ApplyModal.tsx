'use client';

import { useState, type FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Notification } from '@/components/worker/ui/Notification';
import { Callout } from '@/components/worker/ui/Callout';

type Job = {
  id: string;
  title: string;
  merchant: { brandName: string };
  jobPostStores: { store: { name: string } }[];
};

export function ApplyModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobPostId: job.id, applicantName: name, phoneNumber: phone }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? 'Đã có lỗi xảy ra, vui lòng thử lại.');
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-20">
      <div className="bg-white rounded-t-worker-md sm:rounded-worker-md w-full sm:w-[480px] shadow-worker-modal p-6">
        {success ? (
          <div className="text-center py-6">
            <Notification
              variant="success"
              title="Đã gửi hồ sơ!"
              message="Nhà tuyển dụng sẽ liên hệ qua số điện thoại bạn đã cung cấp."
            />
            <button onClick={onClose} className="text-worker-primary text-sm font-semibold mt-4">
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Ứng tuyển</h2>
              <button onClick={onClose} aria-label="Đóng">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-worker-text-secondary mb-1">Bạn đang ứng tuyển vào:</p>
            <div className="bg-worker-bg rounded-md p-3.5 mb-4">
              <p className="font-bold">{job.title}</p>
              <p className="text-sm text-worker-text-secondary">{job.merchant.brandName}</p>
              <p className="text-sm text-worker-text-secondary">{job.jobPostStores[0]?.store.name}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium flex flex-col gap-1">
                Họ và tên *
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border border-worker-border rounded-md px-3 py-2.5 text-sm"
                />
              </label>

              <label className="text-sm font-medium flex flex-col gap-1">
                Số điện thoại *
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="border border-worker-border rounded-md px-3 py-2.5 text-sm"
                />
              </label>

              {error && <Callout variant="error" message={error} />}

              <button type="submit" className="bg-worker-primary text-white rounded-worker-pill py-3 font-bold mt-1">
                Xác nhận ứng tuyển
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
