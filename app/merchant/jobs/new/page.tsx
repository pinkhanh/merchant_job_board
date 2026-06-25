'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStoreSearch } from '@/lib/hooks/useStoreSearch';
import { StoreFilterBar } from '@/components/StoreFilterBar';
import { CheckIcon } from '@heroicons/react/24/outline';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';

type WizardState = {
  storeIds: string[];
  title: string;
  industry: string;
  employmentType: 'part_time' | 'shift' | 'seasonal';
  salaryMin: string;
  salaryMax: string;
  salaryType: 'hourly' | 'shift' | 'monthly' | 'negotiable';
  deadline: string;
  description: string;
};

type StoreSelectionMode = 'manual' | 'region';

const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

const SALARY_TYPES = [
  { value: 'hourly', label: 'Theo giờ' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'monthly', label: 'Theo tháng' },
  { value: 'negotiable', label: 'Thỏa thuận' },
] as const;

export default function JobWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const storeSearch = useStoreSearch();
  const [stepError, setStepError] = useState<string | null>(null);
  const [storeSelectionMode, setStoreSelectionMode] = useState<StoreSelectionMode>('manual');
  const [regionCity, setRegionCity] = useState('');
  const [regionDistrict, setRegionDistrict] = useState('');
  const [regionStoreCount, setRegionStoreCount] = useState<number | null>(null);
  const [state, setState] = useState<WizardState>({
    storeIds: [],
    title: '',
    industry: 'F&B',
    employmentType: 'part_time',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'hourly',
    deadline: '',
    description: '',
  });

  function toggleStore(id: string) {
    setState((s) => ({
      ...s,
      storeIds: s.storeIds.includes(id) ? s.storeIds.filter((x) => x !== id) : [...s.storeIds, id],
    }));
  }

  function selectStoreSelectionMode(mode: StoreSelectionMode) {
    setStoreSelectionMode(mode);
    setRegionCity('');
    setRegionDistrict('');
    setRegionStoreCount(null);
    setState((s) => ({ ...s, storeIds: [] }));
  }

  async function fetchAllStoreIdsForRegion(city: string, district: string): Promise<string[]> {
    const ids: string[] = [];
    let page = 1;
    let total = Infinity;
    while (ids.length < total) {
      const params = new URLSearchParams();
      params.set('city', city);
      params.set('district', district);
      params.set('page', String(page));
      const res = await fetch(`/api/merchant/stores?${params.toString()}`);
      const body = await res.json();
      ids.push(...body.items.map((store: { id: string }) => store.id));
      total = body.total;
      if (!body.items || body.items.length === 0) break;
      page += 1;
    }
    return ids;
  }

  function selectRegionCity(city: string) {
    setRegionCity(city);
    setRegionDistrict('');
    setRegionStoreCount(null);
    setState((s) => ({ ...s, storeIds: [] }));
  }

  async function selectRegionDistrict(district: string) {
    setRegionDistrict(district);
    if (!regionCity || !district) {
      setRegionStoreCount(null);
      setState((s) => ({ ...s, storeIds: [] }));
      return;
    }
    const ids = await fetchAllStoreIdsForRegion(regionCity, district);
    setRegionStoreCount(ids.length);
    setState((s) => ({ ...s, storeIds: ids }));
  }

  function goToStep2() {
    if (state.storeIds.length === 0) {
      setStepError('Vui lòng chọn ít nhất 1 cửa hàng');
      return;
    }
    setStepError(null);
    setStep(2);
  }

  async function generateDescription() {
    const res = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: state.title, industry: state.industry, employmentType: state.employmentType }),
    });
    const body = await res.json();
    setState((s) => ({ ...s, description: `${body.roleOverview}\n\n${body.requirements}\n\n${body.benefits}` }));
    setStep(3);
  }

  async function publish() {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeIds: state.storeIds,
        title: state.title,
        industry: state.industry,
        employmentType: state.employmentType,
        salaryMin: state.salaryMin === '' ? undefined : Number(state.salaryMin),
        salaryMax: state.salaryMax === '' ? undefined : Number(state.salaryMax),
        salaryType: state.salaryType,
        schedule: { days: ['mon'], start: '08:00', end: '17:00' },
        deadline: state.deadline,
        description: state.description,
        status: 'live',
      }),
    });
    if (res.ok) router.push('/merchant/jobs');
  }

  const steps = [
    { n: 1, label: 'Chọn cửa hàng' },
    { n: 2, label: 'Thông tin công việc' },
    { n: 3, label: 'Mô tả AI' },
    { n: 4, label: 'Đăng tin' },
  ];

  const stepper = (
    <div className="flex items-center gap-4 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s.n < step
                ? 'bg-primary text-white'
                : s.n === step
                ? 'bg-primary text-white'
                : 'bg-white border-2 border-border text-text-secondary'
            }`}
          >
            {s.n < step ? <CheckIcon className="w-4 h-4" /> : s.n}
          </div>
          <span className={`text-xs ${s.n === step ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${s.n < step ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );

  const primaryButton = 'bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover';
  const secondaryButton =
    'bg-white text-text-secondary border border-border rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary';
  const inputClass =
    'border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 w-full';
  const card = 'bg-white border border-border rounded-lg shadow-card p-8';

  function goBack() {
    setStep((s) => s - 1);
  }

  const backButton = (
    <button onClick={goBack} className={secondaryButton}>
      Quay lại
    </button>
  );

  if (step === 1) {
    return (
      <div>
        {stepper}
        <div className={card}>
          <h1 className="text-lg font-bold mb-4">Chọn địa điểm làm việc</h1>

          <fieldset className="flex gap-2 mb-4">
            <legend className="text-xs font-semibold uppercase tracking-wide mb-1">Hình thức chọn</legend>
            <label
              htmlFor="storeSelectionMode-manual"
              className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${
                storeSelectionMode === 'manual'
                  ? 'bg-primary-surface border-primary text-primary font-semibold'
                  : 'border-border text-text-secondary'
              }`}
            >
              <input
                id="storeSelectionMode-manual"
                type="radio"
                name="storeSelectionMode"
                className="sr-only"
                checked={storeSelectionMode === 'manual'}
                onChange={() => selectStoreSelectionMode('manual')}
              />
              Lựa chọn địa điểm làm việc
            </label>
            <label
              htmlFor="storeSelectionMode-region"
              className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${
                storeSelectionMode === 'region'
                  ? 'bg-primary-surface border-primary text-primary font-semibold'
                  : 'border-border text-text-secondary'
              }`}
            >
              <input
                id="storeSelectionMode-region"
                type="radio"
                name="storeSelectionMode"
                className="sr-only"
                checked={storeSelectionMode === 'region'}
                onChange={() => selectStoreSelectionMode('region')}
              />
              Lựa chọn khu vực
            </label>
          </fieldset>

          {storeSelectionMode === 'manual' && (
            <>
              <StoreFilterBar
                keyword={storeSearch.keyword}
                onKeywordChange={storeSearch.setKeyword}
                city={storeSearch.city}
                onCityChange={storeSearch.setCity}
                district={storeSearch.district}
                onDistrictChange={storeSearch.setDistrict}
              />
              <div className="flex flex-col gap-2 mb-4">
                {storeSearch.items.map((store) => (
                  <label
                    key={store.id}
                    htmlFor={store.id}
                    className="flex items-center gap-2 border border-border rounded-md px-4 py-3 cursor-pointer hover:border-primary"
                  >
                    <input
                      id={store.id}
                      type="checkbox"
                      checked={state.storeIds.includes(store.id)}
                      onChange={() => toggleStore(store.id)}
                    />
                    {store.name}
                  </label>
                ))}
              </div>
              {storeSearch.hasMore && (
                <button onClick={storeSearch.loadMore} className="text-primary text-sm hover:underline mb-4">
                  Xem thêm
                </button>
              )}
            </>
          )}

          {storeSelectionMode === 'region' && (
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex gap-2">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Tỉnh/Thành Phố
                  <select
                    value={regionCity}
                    onChange={(e) => selectRegionCity(e.target.value)}
                    className="border border-border rounded-md px-2 py-2 text-sm"
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {Object.keys(VIETNAM_PROVINCES).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Quận/Huyện
                  <select
                    value={regionDistrict}
                    onChange={(e) => selectRegionDistrict(e.target.value)}
                    disabled={!regionCity}
                    className="border border-border rounded-md px-2 py-2 text-sm"
                  >
                    <option value="">Chọn quận/huyện</option>
                    {(VIETNAM_PROVINCES[regionCity] ?? []).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
              </div>
              {regionStoreCount !== null && (
                <p className="text-sm text-text-secondary">
                  Đã chọn {regionStoreCount} cửa hàng tại {regionDistrict}, {regionCity}
                </p>
              )}
            </div>
          )}

          {stepError && <p className="text-status-off-text text-sm mb-4">{stepError}</p>}
          <button onClick={goToStep2} className={primaryButton}>
            Tiếp theo
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <h1 className="text-lg font-bold">Thông tin công việc</h1>

          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide">
              Tên vị trí tuyển dụng
            </label>
            <input
              id="title"
              value={state.title}
              onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
              className={inputClass}
            />
          </div>

          <fieldset className="flex gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wide mb-1">Loại hình làm việc</legend>
            {EMPLOYMENT_TYPES.map((t) => (
              <label
                key={t.value}
                htmlFor={t.value}
                className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${
                  state.employmentType === t.value
                    ? 'bg-primary-surface border-primary text-primary font-semibold'
                    : 'border-border text-text-secondary'
                }`}
              >
                <input
                  id={t.value}
                  type="radio"
                  name="employmentType"
                  className="sr-only"
                  checked={state.employmentType === t.value}
                  onChange={() => setState((s) => ({ ...s, employmentType: t.value }))}
                />
                {t.label}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1">
            <label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wide">
              Hạn nộp hồ sơ
            </label>
            <input
              id="deadline"
              type="date"
              value={state.deadline}
              onChange={(e) => setState((s) => ({ ...s, deadline: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="salaryMin" className="text-xs font-semibold uppercase tracking-wide">
                Lương tối thiểu
              </label>
              <input
                id="salaryMin"
                type="number"
                min={0}
                value={state.salaryMin}
                onChange={(e) => setState((s) => ({ ...s, salaryMin: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="salaryMax" className="text-xs font-semibold uppercase tracking-wide">
                Lương tối đa
              </label>
              <input
                id="salaryMax"
                type="number"
                min={0}
                value={state.salaryMax}
                onChange={(e) => setState((s) => ({ ...s, salaryMax: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <fieldset className="flex gap-2">
            <legend className="text-xs font-semibold uppercase tracking-wide mb-1">Hình thức trả lương</legend>
            {SALARY_TYPES.map((t) => (
              <label
                key={t.value}
                htmlFor={`salaryType-${t.value}`}
                className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${
                  state.salaryType === t.value
                    ? 'bg-primary-surface border-primary text-primary font-semibold'
                    : 'border-border text-text-secondary'
                }`}
              >
                <input
                  id={`salaryType-${t.value}`}
                  type="radio"
                  name="salaryType"
                  className="sr-only"
                  checked={state.salaryType === t.value}
                  onChange={() => setState((s) => ({ ...s, salaryType: t.value }))}
                />
                {t.label}
              </label>
            ))}
          </fieldset>

          <div className="flex gap-2">
            <button onClick={generateDescription} className={primaryButton}>
              Tiếp theo
            </button>
            {backButton}
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <h1 className="text-lg font-bold">Mô tả công việc (AI đề xuất)</h1>
          <textarea
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            className={`${inputClass} min-h-[200px]`}
          />
          <div className="flex gap-2">
            <button onClick={() => setStep(4)} className={primaryButton}>
              Tiếp theo
            </button>
            {backButton}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {stepper}
      <div className={`${card} flex flex-col gap-4`}>
        <h1 className="text-lg font-bold">Xem lại & Đăng tin</h1>
        <p className="font-semibold">{state.title}</p>
        <p className="text-sm text-text-secondary whitespace-pre-line">{state.description}</p>
        <div className="flex gap-2">
          <button onClick={publish} className={primaryButton}>
            Đăng tin
          </button>
          {backButton}
        </div>
      </div>
    </div>
  );
}
