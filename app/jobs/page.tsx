'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from '@/components/worker/ui/Spinner';
import { Chips } from '@/components/worker/ui/Chips';
import { Select } from '@/components/worker/ui/Select';

type JobPost = {
  id: string;
  title: string;
  employmentType: 'part_time' | 'shift' | 'seasonal';
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
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

const INDUSTRIES = ['F&B', 'Retail', 'Delivery', 'Customer Service', 'Other'];

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return 'Thỏa thuận';
  if (min && max) return `${min.toLocaleString('vi-VN')} - ${max.toLocaleString('vi-VN')}`;
  return `${(min ?? max)!.toLocaleString('vi-VN')}`;
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
      <h1 className="text-2xl font-extrabold mb-6 bg-gradient-to-r from-worker-primary to-worker-primary-light bg-clip-text text-transparent">
        Tìm việc shift, part-time gần bạn
      </h1>

      {counts.merchant.length > 0 && (
        <div className="flex gap-6 overflow-x-auto pb-4 mb-4">
          {counts.merchant.map((m) => (
            <button key={m.id} onClick={() => setMerchantId(m.id === merchantId ? '' : m.id)} className="flex flex-col items-center gap-1 shrink-0">
              {m.logoUrl ? (
                <img
                  src={m.logoUrl}
                  alt={m.brandName}
                  className={`w-[72px] h-[72px] rounded-full object-cover ${m.id === merchantId ? 'border-2 border-worker-primary' : ''}`}
                />
              ) : (
                <div className={`w-[72px] h-[72px] rounded-full bg-worker-accent ${m.id === merchantId ? 'border-2 border-worker-primary' : ''}`} />
              )}
              <span className="text-xs text-worker-text-secondary">{m.brandName}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {EMPLOYMENT_TYPES.map((t) => (
          <Chips
            key={t.value}
            label={`${t.label} (${counts.employmentType[t.value] ?? 0})`}
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
        <div className="grid gap-4">
          {jobs.map((job) => {
            const store = job.jobPostStores[0]?.store;
            return (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white border-l-[3px] border-worker-primary rounded-worker-md shadow-worker-card p-5 flex gap-4"
              >
                {job.merchant.logoUrl ? (
                  <img
                    src={job.merchant.logoUrl}
                    alt={job.merchant.brandName}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-worker-accent shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm text-worker-text-secondary">{job.merchant.brandName}</p>
                  <p className="text-lg font-bold">{job.title}</p>
                  <p className="text-worker-primary font-bold">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                  {store && (
                    <p className="text-sm text-worker-text-secondary">
                      {store.name} · {store.district}
                    </p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {jobs.length < total && (
        <div className="text-center mt-6">
          <button onClick={() => load(page + 1, true)} className="border border-worker-border rounded-worker-pill px-6 py-2.5 text-sm font-medium">
            Tải thêm
          </button>
        </div>
      )}
    </div>
  );
}
