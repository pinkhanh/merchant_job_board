import { Shell } from '@/components/Shell';

const ADMIN_NAV = [
  { href: '/admin/merchants', label: 'Merchant' },
  { href: '/admin/jobs', label: 'Tin tuyển dụng' },
  { href: '/admin/applicants', label: 'Ứng viên' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell navItems={ADMIN_NAV}>{children}</Shell>;
}
