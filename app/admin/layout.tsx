import { Shell } from '@/components/Shell';
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  NewspaperIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const ADMIN_NAV = [
  { href: '/admin', label: 'Tổng quan', icon: ChartBarIcon },
  { href: '/admin/merchants', label: 'Merchant', icon: BuildingOffice2Icon },
  { href: '/admin/jobs', label: 'Tin tuyển dụng', icon: NewspaperIcon },
  { href: '/admin/applicants', label: 'Ứng viên', icon: UsersIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell navItems={ADMIN_NAV}>{children}</Shell>;
}
