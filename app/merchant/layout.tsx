import { Shell } from '@/components/Shell';
import { getSession } from '@/lib/auth/getSession';
import { getMerchantById } from '@/lib/services/adminMerchantService';

const MERCHANT_NAV = [
  { href: '/merchant/dashboard', label: 'Dashboard', iconName: 'Squares2X2' },
  { href: '/merchant/jobs/new', label: 'Đăng tin tuyển dụng', iconName: 'PlusCircle' },
  { href: '/merchant/jobs', label: 'Quản lý tin tuyển dụng', iconName: 'QueueList' },
  { href: '/merchant/applicants', label: 'Ứng viên', iconName: 'Users' },
  { href: '/merchant/profile', label: 'Hồ sơ thương hiệu', iconName: 'BuildingStorefront' },
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
