import { Shell } from '@/components/Shell';
import {
  Squares2x2Icon,
  PlusCircleIcon,
  QueueListIcon,
  UsersIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const MERCHANT_NAV = [
  { href: '/merchant/dashboard', label: 'Dashboard', icon: Squares2x2Icon },
  { href: '/merchant/jobs/new', label: 'Đăng tin tuyển dụng', icon: PlusCircleIcon },
  { href: '/merchant/jobs', label: 'Quản lý tin tuyển dụng', icon: QueueListIcon },
  { href: '/merchant/applicants', label: 'Ứng viên', icon: UsersIcon },
  { href: '/merchant/profile', label: 'Hồ sơ thương hiệu', icon: BuildingStorefrontIcon },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return <Shell navItems={MERCHANT_NAV}>{children}</Shell>;
}
