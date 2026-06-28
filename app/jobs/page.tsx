'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { Spinner } from '@/components/worker/ui/Spinner';
import { Avatar } from '@/components/worker/ui/Avatar';
import { ShowMore } from '@/components/worker/ui/ShowMore';

type JobPost = {
  id: string;
  title: string;
  employmentType: 'part_time' | 'shift' | 'seasonal' | 'full_time';
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: string;
  createdAt: string;
  merchant: { brandName: string; logoUrl: string | null };
  jobPostStores: { store: { name: string; district: string; city: string } }[];
};

type Counts = {
  employmentType: Record<string, number>;
  industry: Record<string, number>;
  merchant: { id: string; brandName: string; logoUrl: string | null; count: number }[];
  minSalary: { threshold: number; count: number }[];
};

const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  part_time: 'Bán thời gian',
  full_time: 'Toàn thời gian',
  shift: 'Theo ca',
  seasonal: 'Thời vụ',
};

const CITIES: Record<string, string[]> = {
  'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Chánh', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Thủ Đức'],
  'Hà Nội': ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Long Biên', 'Cầu Giấy', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm'],
  'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'],
  'Cần Thơ': ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
  'Hải Phòng': ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An'],
};

const ALL_PROVINCES = Object.keys(CITIES).concat(['Vũng Tàu', 'Huế', 'An Giang', 'Bình Dương', 'Đồng Nai', 'Khánh Hoà', 'Nghệ An']);

function formatSalary(min: number | null, max: number | null, salaryType: string) {
  const suffix: Record<string, string> = {
    hourly: '/giờ',
    shift: '/ca',
    monthly: '/tháng',
    negotiable: '',
  };
  if (!min && !max) return 'Thỏa thuận';
  const s = suffix[salaryType] ?? '';
  if (min && max)
    return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')}đ${s}`;
  return `${(min ?? max)!.toLocaleString('vi-VN')}đ${s}`;
}

function FilterPillSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const active = value !== '';
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none border rounded-worker-pill pl-3.5 pr-8 py-2 text-sm cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
          active
            ? 'border-worker-primary text-worker-primary font-medium'
            : 'border-worker-border text-worker-text-secondary'
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
          active ? 'text-worker-primary' : 'text-worker-text-secondary'
        }`}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={null}>
      <JobsPageContent />
    </Suspense>
  );
}

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramCity = searchParams.get('city') ?? '';
  const paramDistrict = searchParams.get('district') ?? '';

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>({ employmentType: {}, industry: {}, merchant: [], minSalary: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [city, setCity] = useState(paramCity);
  const [district, setDistrict] = useState(paramDistrict);
  const [employmentType, setEmploymentType] = useState(
    searchParams.get('employmentType')?.split(',').filter(Boolean)[0] ?? ''
  );
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') ?? '');
  const [merchantId, setMerchantId] = useState(searchParams.get('merchantId') ?? '');

  // Sync location when header navigates
  useEffect(() => { setCity(paramCity); }, [paramCity]);
  useEffect(() => { setDistrict(paramDistrict); }, [paramDistrict]);

  const hasActiveFilters = !!employmentType || !!minSalary || !!merchantId || !!city;

  function queryString(forPage: number) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (district) params.set('district', district);
    if (searchParams.get('lat')) params.set('lat', searchParams.get('lat')!);
    if (searchParams.get('lng')) params.set('lng', searchParams.get('lng')!);
    if (searchParams.get('radiusKm')) params.set('radiusKm', searchParams.get('radiusKm')!);
    if (employmentType) params.set('employmentType', employmentType);
    if (minSalary) params.set('minSalary', minSalary);
    if (merchantId) params.set('merchantId', merchantId);
    params.set('page', String(forPage));
    return params.toString();
  }

  async function load(forPage: number, append: boolean) {
    if (!append) setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/worker/jobs?${queryString(forPage)}`);
      if (!res.ok) throw new Error('fetch failed');
      const body = await res.json();
      setJobs((prev) => (append ? [...prev, ...body.jobs] : body.jobs));
      setTotal(body.total);
      setCounts(body.counts);
      setPage(forPage);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams.toString() === '') {
      const saved = window.localStorage.getItem('workerJobFilters');
      if (saved) {
        const parsed = new URLSearchParams(saved);
        setEmploymentType(parsed.get('employmentType')?.split(',').filter(Boolean)[0] ?? '');
        setMinSalary(parsed.get('minSalary') ?? '');
        setMerchantId(parsed.get('merchantId') ?? '');
      }
    }
    load(1, false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('workerJobFilters', queryString(1));
    load(1, false);
  }, [employmentType, minSalary, merchantId, city, district]);

  function clearAllFilters() {
    setEmploymentType('');
    setMinSalary('');
    setMerchantId('');
    setCity('');
    setDistrict('');
    router.push('/jobs');
  }

  return (
    <div className="px-4 py-6 max-w-[1200px] mx-auto">
      {/* Hero */}
      <div className="text-center mb-5">
        <h1 className="text-2xl font-normal mb-1 text-worker-primary">
          Tìm việc làm cùng MoMo
        </h1>
        <p className="text-sm text-worker-text-secondary">
          Hàng loạt việc làm tại các thương hiệu cùng MoMo
        </p>
      </div>

      {/* Merchant circles */}
      {counts.merchant.length > 0 && (
        <div className="flex gap-5 overflow-x-auto pb-3 mb-5 justify-center flex-wrap">
          {counts.merchant.map((m) => (
            <button
              key={m.id}
              onClick={() => setMerchantId(m.id === merchantId ? '' : m.id)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <span className={m.id === merchantId ? 'rounded-full ring-2 ring-worker-primary ring-offset-1' : ''}>
                <Avatar
                  variant={m.logoUrl ? 'image' : 'person'}
                  src={m.logoUrl ?? undefined}
                  alt={m.brandName}
                  size={56}
                />
              </span>
              <span className="text-xs text-worker-text-secondary max-w-[64px] text-center leading-tight">
                {m.brandName}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filter bar — 1 row */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Tỉnh/Thành phố */}
        <FilterPillSelect
          value={city}
          onChange={(v) => { setCity(v); setDistrict(''); }}
          options={[
            { value: '', label: 'Tỉnh/ Thành phố' },
            ...ALL_PROVINCES.map((p) => ({ value: p, label: p })),
          ]}
        />

        {/* Quận/Huyện */}
        <FilterPillSelect
          value={district}
          onChange={setDistrict}
          disabled={!city || !CITIES[city]}
          options={[
            { value: '', label: 'Quận/ Huyện' },
            ...(CITIES[city] ?? []).map((d) => ({ value: d, label: d })),
          ]}
        />

        {/* Loại hình làm việc */}
        <FilterPillSelect
          value={employmentType}
          onChange={setEmploymentType}
          options={[
            { value: '', label: 'Loại hình làm việc' },
            ...EMPLOYMENT_TYPES.map((t) => ({
              value: t.value,
              label: counts.employmentType[t.value]
                ? `${t.label} (${counts.employmentType[t.value]})`
                : t.label,
            })),
          ]}
        />

        {/* Mức lương */}
        <FilterPillSelect
          value={minSalary}
          onChange={setMinSalary}
          options={[
            { value: '', label: 'Mức lương' },
            ...counts.minSalary.map((b) => ({
              value: String(b.threshold),
              label: `≥ ${b.threshold.toLocaleString('vi-VN')}đ`,
            })),
          ]}
        />

        {/* Bỏ chọn tất cả — ngay sau filter cuối */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="shrink-0 text-sm text-worker-primary font-medium border border-worker-primary rounded-worker-pill px-3.5 py-2 whitespace-nowrap"
          >
            Bỏ chọn tất cả
          </button>
        )}
      </div>

      {/* Job count */}
      <p className="text-sm font-normal text-worker-text-secondary mb-4 min-h-[20px]">
        {!loading && !error && total > 0 ? `Có ${total} việc làm phù hợp` : ''}
      </p>

      {/* Job list / states */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 px-4 text-center">
          <img src="/images/error-system.png" alt="Hệ thống lỗi" className="w-32 h-32 object-contain mb-4" />
          <p className="font-normal text-base mb-1">Hệ thống lỗi</p>
          <p className="text-sm text-worker-text-secondary">Hiện tại hệ thống đang lỗi. Vui lòng thử lại sau</p>
          <button
            onClick={() => load(1, false)}
            className="mt-4 border border-worker-primary text-worker-primary rounded-worker-pill px-6 py-2.5 text-sm font-normal"
          >
            Thử lại
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-12 px-4 text-center">
          <img src="/images/empty-jobs.png" alt="Không có kết quả" className="w-32 h-32 object-contain mb-4" />
          <p className="font-normal text-base mb-1">Không có kết quả</p>
          <p className="text-sm text-worker-text-secondary">
            Rất tiếc, không tìm thấy kết quả nào phù hợp với toàn bộ lựa chọn của bạn
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-4 border border-worker-primary text-worker-primary rounded-worker-pill px-6 py-2.5 text-sm font-normal">
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.id}`}
              className="bg-white rounded-worker-md shadow-worker-card p-4 flex gap-3 relative overflow-hidden"
            >
              <div className="shrink-0 mt-1">
                <Avatar
                  variant={job.merchant.logoUrl ? 'image' : 'person'}
                  src={job.merchant.logoUrl ?? undefined}
                  alt={job.merchant.brandName}
                  size={48}
                />
              </div>
              <div className="flex-1 min-w-0 pr-[80px]">
                <p className="text-xs text-worker-text-secondary mb-0.5">{job.merchant.brandName}</p>
                <p className="font-semibold text-sm leading-snug mb-1">{job.title}</p>
                <p className="text-worker-primary font-normal text-sm mb-1">
                  {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                </p>
                <p className="text-xs text-worker-text-secondary truncate">
                  {(() => {
                    const stores = job.jobPostStores;
                    if (stores.length === 0) return '';
                    if (stores.length === 1) {
                      const s = stores[0].store;
                      return `${s.name} · ${s.district}`;
                    }
                    const first = stores[0].store;
                    return `${stores.length} địa điểm tại ${first.district}, ${first.city}`;
                  })()}
                </p>
              </div>
              <span className="absolute top-3 right-3 bg-worker-accent text-worker-primary text-[11px] font-normal px-2 py-0.5 rounded-worker-pill whitespace-nowrap">
                {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
              </span>
            </a>
          ))}
        </div>
      )}

      {jobs.length < total && !loading && !error && (
        <div className="text-center mt-6">
          <ShowMore onClick={() => load(page + 1, true)} label="Xem thêm" />
        </div>
      )}
    </div>
  );
}
