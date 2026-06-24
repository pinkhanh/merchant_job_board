'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    router.push(body.role === 'admin' ? '/admin/merchants' : '/merchant/dashboard');
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
    </div>
  );
}
