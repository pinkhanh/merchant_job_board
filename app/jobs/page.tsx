'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const [error, setError] = useState(false);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>(
    searchParams.get('employmentType')?.split(',').filter(Boolean) ?? []
  );
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') ?? '');
  const [industry, setIndustry] = useState(searchParams.get('industry') ?? '');
  const [merchantId, setMerchantId] = useState(searchParams.get('merchantId') ?? '');

  const hasActiveFilters = employmentTypes.length > 0 || !!minSalary || !!industry || !!merchantId;

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

  function clearAllFilters() {
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
      <p className="text-sm text-worker-text-secondary mb-2">
        Hàng loạt việc làm tại các thương hiệu cùng MoMo
      </p>
      <p className="text-sm font-semibold text-worker-text-secondary mb-5">
        {total > 0 ? `${total} việc làm` : ''}
      </p>

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

      {/* Filter chips - employment type with pink underline when selected */}
      <div className="flex flex-wrap gap-2 mb-3">
        {EMPLOYMENT_TYPES.map((t) => {
          const selected = employmentTypes.includes(t.value);
          return (
            <button
              key={t.value}
              onClick={() => toggleEmploymentType(t.value)}
              className={`relative px-4 py-2 rounded-worker-pill text-sm font-medium border transition-colors ${
                selected
                  ? 'border-worker-primary text-worker-primary bg-white'
                  : 'border-worker-border text-worker-text-secondary bg-white'
              }`}
            >
              {`${t.label}${counts.employmentType[t.value] ? ` (${counts.employmentType[t.value]})` : ''}`}
              {selected && (
                <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-worker-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Salary + Industry selects */}
      <div className="flex flex-wrap gap-3 mb-3">
        <select
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
          className={`border rounded-worker-pill px-4 py-2 text-sm appearance-none bg-white pr-8 ${
            minSalary ? 'border-worker-primary text-worker-primary' : 'border-worker-border text-worker-text-secondary'
          }`}
        >
          <option value="">Tất cả mức lương</option>
          {counts.minSalary.map((b) => (
            <option key={b.threshold} value={String(b.threshold)}>
              {`≥ ${b.threshold.toLocaleString('vi-VN')} (${b.count})`}
            </option>
          ))}
        </select>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className={`border rounded-worker-pill px-4 py-2 text-sm appearance-none bg-white pr-8 ${
            industry ? 'border-worker-primary text-worker-primary' : 'border-worker-border text-worker-text-secondary'
          }`}
        >
          <option value="">Tất cả ngành nghề</option>
          {['F&B', 'Retail', 'Delivery', 'Customer Service', 'Other'].map((i) => (
            <option key={i} value={i}>{`${i} (${counts.industry[i] ?? 0})`}</option>
          ))}
        </select>
      </div>

      {/* Clear all CTA */}
      {hasActiveFilters && (
        <div className="mb-4">
          <button
            onClick={clearAllFilters}
            className="text-sm text-worker-primary font-medium underline underline-offset-2"
          >
            Bỏ chọn tất cả
          </button>
        </div>
      )}

      {/* Job list / states */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-12 px-4 text-center">
          <img src="/images/error-system.png" alt="Hệ thống lỗi" className="w-32 h-32 object-contain mb-4" />
          <p className="font-bold text-base mb-1">Hệ thống lỗi</p>
          <p className="text-sm text-worker-text-secondary">Hiện tại hệ thống đang lỗi. Vui lòng thử lại sau</p>
          <button
            onClick={() => load(1, false)}
            className="mt-4 border border-worker-primary text-worker-primary rounded-worker-pill px-6 py-2.5 text-sm font-bold"
          >
            Thử lại
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center py-12 px-4 text-center">
          <img src="/images/empty-jobs.png" alt="Không có kết quả" className="w-32 h-32 object-contain mb-4" />
          <p className="font-bold text-base mb-1">Không có kết quả</p>
          <p className="text-sm text-worker-text-secondary">
            Rất tiếc, không tìm thấy kết quả nào phù hợp với toàn bộ lựa chọn của bạn
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-4 border border-worker-primary text-worker-primary rounded-worker-pill px-6 py-2.5 text-sm font-bold">
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => {
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
                  <p className="text-xs text-worker-text-secondary truncate">
                    {job.jobPostStores.length > 1
                      ? `${job.jobPostStores.length} địa điểm`
                      : job.jobPostStores[0]?.store
                      ? `${job.jobPostStores[0].store.name} · ${job.jobPostStores[0].store.district}`
                      : ''}
                  </p>
                </div>
                <span className="absolute top-3 right-3 bg-worker-accent text-worker-primary text-[11px] font-semibold px-2 py-0.5 rounded-worker-pill whitespace-nowrap">
                  {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
                </span>
              </a>
            );
          })}
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
