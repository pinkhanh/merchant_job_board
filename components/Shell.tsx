'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  NewspaperIcon,
  UsersIcon,
  Squares2X2Icon,
  PlusCircleIcon,
  QueueListIcon,
  BuildingStorefrontIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ChartBar: ChartBarIcon,
  BuildingOffice2: BuildingOffice2Icon,
  Newspaper: NewspaperIcon,
  Users: UsersIcon,
  Squares2X2: Squares2X2Icon,
  PlusCircle: PlusCircleIcon,
  QueueList: QueueListIcon,
  BuildingStorefront: BuildingStorefrontIcon,
};

type NavItem = {
  href: string;
  label: string;
  iconName?: string;
};

type BrandInfo = { name: string; logoUrl?: string | null };
type Brand = { id: string; brandName: string; logoUrl: string | null };

export function Shell({
  navItems,
  children,
  brandInfo,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
  brandInfo?: BrandInfo;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    if (brandInfo) {
      fetch('/api/merchant/my-brands')
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.items && data.items.length > 1) setBrands(data.items);
        })
        .catch(() => {});
    }
  }, [brandInfo]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  async function switchBrand(merchantId: string) {
    setSwitching(merchantId);
    const res = await fetch('/api/auth/select-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId }),
    });
    if (res.ok) {
      window.location.href = '/merchant/dashboard';
    } else {
      setSwitching(null);
    }
  }

  return (
    <div className="font-sf-rounded">
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-10">
        <img src="/logo-momo.png" alt="Merchant Job Board" className="w-8 h-8 rounded" />
        <span className="text-white font-semibold ml-3">Merchant Job Board</span>

        <div className="ml-auto relative">
          <button
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Tài khoản"
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.5h19.6v-2.5c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[160px] bg-white rounded-md shadow-modal py-1 text-text-secondary">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-primary-surface"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>
      <aside className="fixed left-0 top-14 bottom-0 w-[220px] bg-white border-r border-border flex flex-col">
        {brandInfo && (
          <div data-testid="brand-info" className="border-b border-border">
            {brands.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setBrandMenuOpen((o) => !o)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-primary-surface transition-colors"
                >
                  {brandInfo.logoUrl ? (
                    <img
                      src={brandInfo.logoUrl}
                      alt={brandInfo.name}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-primary-surface flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {brandInfo.name[0]}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-foreground leading-tight truncate flex-1 text-left">{brandInfo.name}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-text-secondary shrink-0 transition-transform ${brandMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {brandMenuOpen && (
                  <div className="absolute left-0 right-0 top-full bg-white border border-border rounded-b-lg shadow-modal z-10 py-1">
                    {brands.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => switchBrand(b.id)}
                        disabled={switching !== null}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-surface text-left disabled:opacity-60"
                      >
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.brandName} className="w-7 h-7 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-primary-surface flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {b.brandName[0]}
                          </div>
                        )}
                        <span className="text-sm text-foreground truncate">{b.brandName}</span>
                        {switching === b.id && <span className="ml-auto text-xs text-text-secondary">...</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-4">
                {brandInfo.logoUrl ? (
                  <img
                    src={brandInfo.logoUrl}
                    alt={brandInfo.name}
                    className="w-8 h-8 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-primary-surface flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {brandInfo.name[0]}
                  </div>
                )}
                <span className="text-sm font-semibold text-foreground leading-tight truncate">{brandInfo.name}</span>
              </div>
            )}
          </div>
        )}
        <nav className="pt-4 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.iconName ? ICON_MAP[item.iconName] : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm border-l-[3px] ${
                  active
                    ? 'border-primary bg-primary-surface text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:bg-primary-surface hover:text-primary'
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="ml-[220px] mt-14 p-8 bg-primary-surface min-h-[calc(100vh-56px)] text-text-secondary">{children}</main>
    </div>
  );
}
