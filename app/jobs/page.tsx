'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/worker/ui/Spinner';
import { Chips } from '@/components/worker/ui/Chips';
import { Select } from '@/components/worker/ui/Select';
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

const INDUSTRIES = ['F&B', 'Retail', 'Delivery', 'Customer Service', 'Other'];

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

  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>({ employmentType: {}, industry: {}, merchant: [], minSalary: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(
    searchParams.get('employmentType')?.split(',').filter(Boolean) ?? []
  );
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') ?? '');
  const [industry, setIndustry] = useState(searchParams.get('industry') ?? '');
  const [merchantId, setMerchantId] = useState(searchParams.get('merchantId') ?? '');

  function queryString(forPage: number) {
    const params = new URLSearchParams();
    if (searchParams.get('city')) params.set('city', searchParams.get('city')!);
    if (searchParams.get('district')) params.set('district', searchParams.get('district')!);
    if (searchParams.get('lat')) params.set('lat', searchParams.get('lat')!);
    if (searchParams.get('lng')) params.set('lng', searchParams.get('lng')!);
    if (searchParams.get('radiusKm')) params.set('radiusKm', searchParams.get('radiusKm')!);
    if (employmentTypes.length) params.set('employmentType', employmentTypes.join(','));
    if (minSalary) params.set('minSalary', minSalary);
    if (industry) params.set('industry', industry);
    if (merchantId) params.set('merchantId', merchantId);
    params.set('page', String(forPage));
    return params.toString();
  }

  async function load(forPage: number, append: boolean) {
    if (!append) setLoading(true);
    const res = await fetch(`/api/worker/jobs?${queryString(forPage)}`);
    const body = await res.json();
    setJobs((prev) => (append ? [...prev, ...body.jobs] : body.jobs));
    setTotal(body.total);
    setCounts(body.counts);
    setPage(forPage);
    setLoading(false);
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && searchParams.toString() === '') {
      const saved = window.localStorage.getItem('workerJobFilters');
      if (saved) {
        const parsed = new URLSearchParams(saved);
        setEmploymentTypes(parsed.get('employmentType')?.split(',').filter(Boolean) ?? []);
        setMinSalary(parsed.get('minSalary') ?? '');
        setIndustry(parsed.get('industry') ?? '');
        setMerchantId(parsed.get('merchantId') ?? '');
      }
    }
    load(1, false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('workerJobFilters', queryString(1));
    load(1, false);
  }, [employmentTypes, minSalary, industry, merchantId]);

  function toggleEmploymentType(value: string) {
    setEmploymentTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function clearFilters() {
    setEmploymentTypes([]);
    setMinSalary('');
    setIndustry('');
    setMerchantId('');
    router.push('/jobs');
  }

  return (
    <div className="px-4 py-6 max-w-[1200px] mx-auto">
      <h1 className="text-2xl font-extrabold mb-1 text-worker-primary">
        Tìm việc làm cùng MoMo
      </h1>
      <p className="text-sm text-worker-text-secondary mb-5">
        Hàng loạt việc làm part-time tại các thương hiệu cùng MoMo
      </p>

      {counts.merchant.length > 0 && (
        <div className="flex gap-5 overflow-x-auto pb-3 mb-5">
          {counts.merchant.map((m) => (
            <button key={m.id} onClick={() => setMerchantId(m.id === merchantId ? '' : m.id)} className="flex flex-col items-center gap-1.5 shrink-0">
              <span className={m.id === merchantId ? 'rounded-full ring-2 ring-worker-primary ring-offset-1' : ''}>
                <Avatar variant={m.logoUrl ? 'image' : 'person'} src={m.logoUrl ?? undefined} alt={m.brandName} size={56} />
              </span>
              <span className="text-xs text-worker-text-secondary max-w-[64px] text-center leading-tight">{m.brandName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {EMPLOYMENT_TYPES.map((t) => (
          <Chips
            key={t.value}
            label={`${t.label}${counts.employmentType[t.value] ? ` (${counts.employmentType[t.value]})` : ''}`}
            variant={employmentTypes.includes(t.value) ? 'outline' : 'secondary'}
            onClick={() => toggleEmploymentType(t.value)}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={minSalary}
          onChange={setMinSalary}
          options={[
            { value: '', label: 'Tất cả mức lương' },
            ...counts.minSalary.map((b) => ({
              value: String(b.threshold),
              label: `≥ ${b.threshold.toLocaleString('vi-VN')} (${b.count})`,
            })),
          ]}
        />
        <Select
          value={industry}
          onChange={setIndustry}
          options={[
            { value: '', label: 'Tất cả ngành nghề' },
            ...INDUSTRIES.map((i) => ({ value: i, label: `${i} (${counts.industry[i] ?? 0})` })),
          ]}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-worker-text-secondary mb-4">
            Không tìm thấy việc làm phù hợp. Thử mở rộng khu vực hoặc điều chỉnh bộ lọc.
          </p>
          <button onClick={clearFilters} className="border border-worker-primary text-worker-primary rounded-worker-pill px-6 py-2.5 text-sm font-bold">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
            const store = job.jobPostStores[0]?.store;
            return (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white rounded-worker-md shadow-worker-card p-4 flex gap-3 relative overflow-hidden"
              >
                <div className="shrink-0 mt-1">
                  <Avatar variant={job.merchant.logoUrl ? 'image' : 'person'} src={job.merchant.logoUrl ?? undefined} alt={job.merchant.brandName} size={48} />
                </div>
                <div className="flex-1 min-w-0 pr-[80px]">
                  <p className="text-xs text-worker-text-secondary mb-0.5">{job.merchant.brandName}</p>
                  <p className="font-bold text-sm leading-snug mb-1">{job.title}</p>
                  <p className="text-worker-primary font-bold text-sm mb-1">
                    {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
                  </p>
                  {store && (
                    <p className="text-xs text-worker-text-secondary truncate">
                      {store.name} · {store.district}
                    </p>
                  )}
                </div>
                <span className="absolute top-3 right-3 bg-worker-accent text-worker-primary text-[11px] font-semibold px-2 py-0.5 rounded-worker-pill whitespace-nowrap">
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {jobs.length < total && (
        <div className="text-center mt-6">
          <ShowMore onClick={() => load(page + 1, true)} label="Xem thêm" />
        </div>
      )}
    </div>
  );
}
