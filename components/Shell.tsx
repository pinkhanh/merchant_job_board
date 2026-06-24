'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

export function Shell({ navItems, children }: { navItems: NavItem[]; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="font-sf-rounded">
      <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center px-4 z-10">
        <img src="/logo-momo.png" alt="Merchant Job Board" className="w-8 h-8 rounded" />
        <span className="text-white font-semibold ml-3">Merchant Job Board</span>
      </header>
      <aside className="fixed left-0 top-14 bottom-0 w-[220px] bg-white border-r border-border">
        <nav className="pt-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-3 text-sm border-l-[3px] ${
                  active
                    ? 'border-primary bg-primary-surface text-primary font-semibold'
                    : 'border-transparent text-text-secondary hover:bg-primary-surface hover:text-primary'
                }`}
              >
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
