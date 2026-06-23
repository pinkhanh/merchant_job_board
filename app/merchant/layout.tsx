import { Shell } from '@/components/Shell';

const MERCHANT_NAV = [
  { href: '/merchant/dashboard', label: 'Dashboard' },
  { href: '/merchant/jobs/new', label: 'Đăng tin tuyển dụng' },
  { href: '/merchant/jobs', label: 'Quản lý tin tuyển dụng' },
  { href: '/merchant/applicants', label: 'Ứng viên' },
  { href: '/merchant/profile', label: 'Hồ sơ thương hiệu' },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return <Shell navItems={MERCHANT_NAV}>{children}</Shell>;
}
