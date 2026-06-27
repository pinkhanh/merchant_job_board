'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function AdminMerchantsNewPage() {
  const router = useRouter();
  const showToast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    brandName: '',
    industry: '',
    description: '',
    hotline: '',
    logoUrl: '',
    bannerUrl: '',
    username: '',
    password: '',
  });

  function setField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('success', 'Đã tạo merchant thành công');
        router.push('/admin/merchants');
      } else {
        const body = await res.json();
        showToast('error', body.error ?? 'Tạo merchant thất bại');
      }
    } catch {
      showToast('error', 'Tạo merchant thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = 'border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 w-full bg-white';

  return (
    <div className="max-w-[640px]">
      <h1 className="text-2xl font-bold mb-6">Tạo merchant mới</h1>
      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg shadow-card p-8 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="brandName" className="text-xs font-semibold uppercase tracking-wide">
            Tên thương hiệu <span className="text-status-off-text">*</span>
          </label>
          <input id="brandName" required value={form.brandName} onChange={setField('brandName')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="industry" className="text-xs font-semibold uppercase tracking-wide">
            Ngành <span className="text-status-off-text">*</span>
          </label>
          <select id="industry" required value={form.industry} onChange={setField('industry')} className={inputClass}>
            <option value="">Chọn ngành</option>
            <option value="F&B">F&B</option>
            <option value="Retail">Retail</option>
            <option value="Delivery">Delivery</option>
            <option value="Customer Service">Customer Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-xs font-semibold uppercase tracking-wide">Mô tả thương hiệu</label>
          <textarea id="description" value={form.description} onChange={setField('description')} rows={3} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="hotline" className="text-xs font-semibold uppercase tracking-wide">Hotline</label>
          <input id="hotline" value={form.hotline} onChange={setField('hotline')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="logoUrl" className="text-xs font-semibold uppercase tracking-wide">URL Logo</label>
          <input id="logoUrl" type="url" value={form.logoUrl} onChange={setField('logoUrl')} placeholder="https://..." className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="bannerUrl" className="text-xs font-semibold uppercase tracking-wide">URL Banner</label>
          <input id="bannerUrl" type="url" value={form.bannerUrl} onChange={setField('bannerUrl')} placeholder="https://..." className={inputClass} />
        </div>

        <div className="h-px bg-border" />
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Tài khoản quản lý đầu tiên</p>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide">
            Tên đăng nhập <span className="text-status-off-text">*</span>
          </label>
          <input id="username" required minLength={3} value={form.username} onChange={setField('username')} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide">
            Mật khẩu <span className="text-status-off-text">*</span>
          </label>
          <input id="password" type="password" required minLength={8} value={form.password} onChange={setField('password')} className={inputClass} />
        </div>

        <div className="flex gap-2 justify-end mt-2">
          <button type="button" onClick={() => router.back()} className="border border-border rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-primary-surface">
            Huỷ
          </button>
          <button type="submit" disabled={isSubmitting} className="bg-primary text-white rounded-md px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-60">
            {isSubmitting ? 'Đang tạo...' : 'Tạo merchant'}
          </button>
        </div>
      </form>
    </div>
  );
}
