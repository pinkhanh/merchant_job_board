import { Shell } from '@/components/Shell';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan', iconName: 'ChartBar' },
  { href: '/admin/merchants', label: 'Merchant', iconName: 'BuildingOffice2' },
  { href: '/admin/jobs', label: 'Tin tuyển dụng', iconName: 'Newspaper' },
  { href: '/admin/jobs/new', label: 'Đăng tin mới', iconName: 'PlusCircle' },
  { href: '/admin/applicants', label: 'Ứng viên', iconName: 'Users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell navItems={ADMIN_NAV}>{children}</Shell>;
}
