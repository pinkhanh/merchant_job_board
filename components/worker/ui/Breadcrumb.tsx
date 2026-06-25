import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/outline';

type BreadcrumbItem = { label: string; href?: string };

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm text-worker-text-secondary">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {i === 0 && <HomeIcon className="w-4 h-4" />}
              {!isLast && item.href ? (
                <Link href={item.href} className="hover:text-worker-primary">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              {!isLast && <span>›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
