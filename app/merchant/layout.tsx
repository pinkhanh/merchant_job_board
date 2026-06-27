import { Shell } from '@/components/Shell';
import {
  Squares2x2Icon,
  PlusCircleIcon,
  QueueListIcon,
  UsersIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';
import { getSession } from '@/lib/auth/getSession';
import { getMerchantById } from '@/lib/services/adminMerchantService';

const MERCHANT_NAV = [
  { href: '/merchant/dashboard', label: 'Dashboard', icon: Squares2x2Icon },
  { href: '/merchant/jobs/new', label: 'Đăng tin tuyển dụng', icon: PlusCircleIcon },
  { href: '/merchant/jobs', label: 'Quản lý tin tuyển dụng', icon: QueueListIcon },
  { href: '/merchant/applicants', label: 'Ứng viên', icon: UsersIcon },
  { href: '/merchant/profile', label: 'Hồ sơ thương hiệu', icon: BuildingStorefrontIcon },
];

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  let brandInfo: { name: string; logoUrl?: string | null } | undefined;
  if (session?.merchantId) {
    const merchant = await getMerchantById(session.merchantId);
    if (merchant) brandInfo = { name: merchant.brandName, logoUrl: merchant.logoUrl };
  }
  return <Shell navItems={MERCHANT_NAV} brandInfo={brandInfo}>{children}</Shell>;
}
