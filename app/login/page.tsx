'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Brand = { id: string; brandName: string; logoUrl: string | null };

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selecting, setSelecting] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json();

    if (!res.ok) {
      setError(body.error ?? 'Đăng nhập thất bại');
      return;
    }
    if (body.requiresBrandSelection) {
      const brandsRes = await fetch('/api/merchant/brands');
      if (brandsRes.ok) {
        const data = await brandsRes.json();
        setBrands(data.items ?? []);
      } else {
        router.push('/merchant/select-brand');
      }
      return;
    }
    router.push(body.role === 'admin' ? '/admin/merchants' : '/merchant/dashboard');
  }

  async function selectBrand(merchantId: string) {
    setSelecting(merchantId);
    const res = await fetch('/api/auth/select-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId }),
    });
    if (!res.ok) {
      setSelecting(null);
      return;
    }
    router.push('/merchant/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-surface font-sf-rounded">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-modal p-8 w-[400px] flex flex-col gap-4 text-text-secondary"
      >
        <h1 className="text-lg font-bold text-center">Đăng nhập</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wide">
            Tên đăng nhập
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide">
            Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>

        {error && (
          <p role="alert" className="text-status-off-text text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="bg-primary text-white rounded-md py-2.5 font-semibold hover:bg-primary-hover"
        >
          Đăng nhập
        </button>
      </form>

      {/* Brand selection popup */}
      {brands.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-8">
            <h2 className="text-xl font-bold text-foreground mb-6">Chọn thương hiệu quản lý</h2>
            <div className="space-y-3">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => selectBrand(brand.id)}
                  disabled={selecting !== null}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary-surface disabled:opacity-60 transition-colors text-left"
                >
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.brandName} className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-primary-surface flex items-center justify-center text-primary font-bold shrink-0">
                      {brand.brandName[0]}
                    </div>
                  )}
                  <span className="font-medium text-foreground">{brand.brandName}</span>
                  {selecting === brand.id && (
                    <span className="ml-auto text-xs text-text-secondary">Đang chọn...</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
