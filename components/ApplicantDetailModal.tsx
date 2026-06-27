'use client';
import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type AppHistory = {
  id: string;
  jobTitle: string;
  merchantName: string;
  appliedAt: string;
};

type Props = {
  phone: string;
  onClose: () => void;
  isAdmin?: boolean;
};

export function ApplicantDetailModal({ phone, onClose, isAdmin }: Props) {
  const [data, setData] = useState<{
    applicantName: string;
    phoneNumber: string;
    items: AppHistory[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = isAdmin
      ? `/api/admin/applications/by-phone?phone=${encodeURIComponent(phone)}`
      : `/api/applications/by-phone?phone=${encodeURIComponent(phone)}`;
    fetch(url)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [phone, isAdmin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            {loading ? (
              <p className="text-sm text-text-secondary">Đang tải...</p>
            ) : (
              <>
                <p className="font-semibold text-foreground">{data?.applicantName}</p>
                <p className="text-xs text-text-secondary">{data?.phoneNumber}</p>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-primary-surface">
            <XMarkIcon className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="overflow-auto max-h-80">
          {!loading && error && (
            <p className="px-6 py-4 text-sm text-red-500">Không tải được dữ liệu.</p>
          )}
          {!loading && data && (
            <table className="w-full text-sm">
              <thead className="bg-primary-surface">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-text-secondary font-medium">Vị trí</th>
                  {isAdmin && <th className="px-4 py-2 text-left text-xs text-text-secondary font-medium">Thương hiệu</th>}
                  <th className="px-4 py-2 text-left text-xs text-text-secondary font-medium">Thời gian nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-foreground">{item.jobTitle}</td>
                    {isAdmin && <td className="px-4 py-3 text-text-secondary">{item.merchantName}</td>}
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {new Date(item.appliedAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
