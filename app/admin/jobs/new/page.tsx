'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { VIETNAM_PROVINCES } from '@/lib/constants/vietnamProvinces';
import { useToast } from '@/components/Toast';

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
}

type Merchant = { id: string; brandName: string; logoUrl: string | null; status: string };
type Store = { id: string; name: string; streetAddress: string | null; ward: string | null; district: string; city: string };

type WizardState = {
  merchantId: string;
  storeIds: string[];
  title: string;
  position: string;
  industry: string;
  employmentType: 'part_time' | 'shift' | 'seasonal' | 'full_time';
  salaryMin: string;
  salaryMax: string;
  salaryType: 'hourly' | 'shift' | 'monthly' | 'negotiable';
  deadline: string;
  description: string;
};

type StoreSelectionMode = 'manual' | 'region';

const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'full_time', label: 'Toàn thời gian' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

const SALARY_TYPES = [
  { value: 'hourly', label: 'Theo giờ' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'monthly', label: 'Theo tháng' },
  { value: 'negotiable', label: 'Thỏa thuận' },
] as const;

export default function AdminJobsNewPage() {
  const router = useRouter();
  const showToast = useToast();
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 1: Brand selection
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantPage, setMerchantPage] = useState(1);
  const [merchantTotal, setMerchantTotal] = useState(0);
  const [merchantSearch, setMerchantSearch] = useState('');
  const MERCHANT_PAGE_SIZE = 10;

  // Step 2: Store selection (same as merchant wizard)
  const [storeSelectionMode, setStoreSelectionMode] = useState<StoreSelectionMode>('manual');
  const [stores, setStores] = useState<Store[]>([]);
  const [storeTotal, setStoreTotal] = useState(0);
  const [storeKeyword, setStoreKeyword] = useState('');
  const [storeCity, setStoreCity] = useState('');
  const [storeDistrict, setStoreDistrict] = useState('');
  const [regionCity, setRegionCity] = useState('');
  const [regionDistrict, setRegionDistrict] = useState('');
  const [regionStoreCount, setRegionStoreCount] = useState<number | null>(null);
  const [isRegionLoading, setIsRegionLoading] = useState(false);

  // Step 3: Job info
  const [aiLoading, setAiLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [state, setState] = useState<WizardState>({
    merchantId: '',
    storeIds: [],
    title: '',
    position: '',
    industry: 'F&B',
    employmentType: 'part_time',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'hourly',
    deadline: '',
    description: '',
  });

  // Load merchants for Step 1
  useEffect(() => {
    const params = new URLSearchParams();
    if (merchantSearch) params.set('search', merchantSearch);
    params.set('page', String(merchantPage));
    fetch(`/api/admin/merchants?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        // Admin merchants API currently returns an array. If it returns { items, total } in the future, adapt here.
        const items: Merchant[] = Array.isArray(body) ? body : (body.items ?? []);
        setMerchants(items);
        setMerchantTotal(body.total ?? items.length);
      });
  }, [merchantSearch, merchantPage]);

  // Load stores for Step 2 when merchant changes
  useEffect(() => {
    if (!state.merchantId) return;
    const params = new URLSearchParams({ page: '1' });
    if (storeKeyword) params.set('keyword', storeKeyword);
    if (storeCity) params.set('city', storeCity);
    if (storeDistrict) params.set('district', storeDistrict);
    fetch(`/api/admin/merchants/${state.merchantId}/stores?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => { setStores(body.items ?? []); setStoreTotal(body.total ?? 0); });
  }, [state.merchantId, storeKeyword, storeCity, storeDistrict]);

  function toggleStore(id: string) {
    setState((s) => ({
      ...s,
      storeIds: s.storeIds.includes(id) ? s.storeIds.filter((x) => x !== id) : [...s.storeIds, id],
    }));
  }

  async function fetchAllStoreIdsForRegion(city: string, district: string): Promise<string[]> {
    const ids: string[] = [];
    let page = 1;
    let total = Infinity;
    while (ids.length < total) {
      const params = new URLSearchParams({ city, district, page: String(page) });
      const res = await fetch(`/api/admin/merchants/${state.merchantId}/stores?${params.toString()}`);
      const body = await res.json();
      total = body.total;
      if (!body.items?.length) break;
      ids.push(...body.items.map((s: { id: string }) => s.id));
      page++;
    }
    return ids;
  }

  async function selectRegionDistrict(district: string) {
    setRegionDistrict(district);
    if (!regionCity || !district) { setRegionStoreCount(null); setState((s) => ({ ...s, storeIds: [] })); return; }
    setIsRegionLoading(true);
    try {
      const ids = await fetchAllStoreIdsForRegion(regionCity, district);
      setRegionStoreCount(ids.length);
      setState((s) => ({ ...s, storeIds: ids }));
    } finally { setIsRegionLoading(false); }
  }

  async function generateDescription() {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: state.title, industry: state.industry, employmentType: state.employmentType }),
      });
      const body = await res.json();
      setState((s) => ({ ...s, description: `${body.roleOverview}\n\n${body.requirements}\n\n${body.benefits}` }));
      showToast('success', 'AI đã tạo mô tả công việc');
    } catch {
      showToast('error', 'Không thể tạo mô tả AI');
    } finally { setAiLoading(false); }
    setStep(4);
  }

  async function publish() {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: state.merchantId,
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
      if (res.ok) {
        showToast('success', 'Đăng tin tuyển dụng thành công!');
        router.push('/admin/jobs');
      } else {
        let message = 'Đăng tin thất bại';
        try {
          const body = await res.json();
          if (body?.error) message = typeof body.error === 'string' ? body.error : 'Đăng tin thất bại';
        } catch { /* ignore JSON parse error */ }
        showToast('error', message);
        return;
      }
    } catch {
      showToast('error', 'Đăng tin thất bại, vui lòng thử lại');
    } finally { setIsPublishing(false); }
  }

  const steps = [
    { n: 1, label: 'Chọn thương hiệu' },
    { n: 2, label: 'Chọn cửa hàng' },
    { n: 3, label: 'Thông tin công việc' },
    { n: 4, label: 'Mô tả AI' },
    { n: 5, label: 'Đăng tin' },
  ];

  const primaryButton = 'bg-primary text-white rounded-md px-5 py-2.5 font-semibold hover:bg-primary-hover text-sm disabled:opacity-60 disabled:cursor-not-allowed';
  const secondaryButton = 'bg-white text-text-secondary border border-border rounded-md px-5 py-2.5 font-semibold hover:border-primary hover:text-primary text-sm';
  const inputClass = 'border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 w-full bg-white';
  const card = 'bg-white border border-border rounded-lg shadow-card p-8';

  const stepper = (
    <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-1">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s.n < step ? 'bg-primary text-white' : s.n === step ? 'bg-primary text-white' : 'bg-white border-2 border-border text-text-secondary'}`}>
            {s.n < step ? <CheckIcon className="w-4 h-4" /> : s.n}
          </div>
          <span className={`text-xs ${s.n === step ? 'text-primary font-semibold' : 'text-text-secondary'}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 ${s.n < step ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );

  const ctaRow = (primaryLabel: string, onPrimary: () => void, primaryDisabled?: boolean) => (
    <div className="flex gap-2 justify-end mt-4">
      {step > 1 && <button onClick={() => setStep((s) => s - 1)} className={secondaryButton}>Quay lại</button>}
      <button onClick={onPrimary} disabled={primaryDisabled} className={primaryButton}>
        {primaryDisabled ? 'Đang xử lý...' : primaryLabel}
      </button>
    </div>
  );

  // STEP 1: Brand selection
  if (step === 1) {
    const filteredMerchants = merchants.filter(
      (m) => m.status === 'active' && (!merchantSearch || m.brandName.toLowerCase().includes(merchantSearch.toLowerCase()))
    );
    return (
      <div>
        {stepper}
        <div className={card}>
          <h1 className="text-lg font-bold mb-4">Chọn thương hiệu</h1>
          <input
            value={merchantSearch}
            onChange={(e) => { setMerchantSearch(e.target.value); setMerchantPage(1); }}
            placeholder="Tìm theo tên thương hiệu..."
            className={`${inputClass} mb-4`}
          />
          <div className="flex flex-col gap-2 mb-4">
            {filteredMerchants.map((m) => (
              <label key={m.id} className={`flex items-center gap-3 border rounded-md px-4 py-3 cursor-pointer ${state.merchantId === m.id ? 'border-primary bg-primary-surface' : 'border-border hover:border-primary'}`}>
                <input type="radio" name="merchantId" className="sr-only" checked={state.merchantId === m.id} onChange={() => setState((s) => ({ ...s, merchantId: m.id }))} />
                <span className="font-medium">{m.brandName}</span>
              </label>
            ))}
            {filteredMerchants.length === 0 && <p className="text-sm text-text-secondary py-4 text-center">Không tìm thấy thương hiệu</p>}
          </div>
          {stepError && <p className="text-status-off-text text-sm mb-2">{stepError}</p>}
          {ctaRow('Tiếp theo', () => {
            if (!state.merchantId) { setStepError('Vui lòng chọn 1 thương hiệu'); return; }
            setStepError(null);
            setStep(2);
          })}
        </div>
      </div>
    );
  }

  // STEP 2: Store selection (identical to merchant wizard step 1, but calls admin stores API)
  if (step === 2) {
    return (
      <div>
        {stepper}
        <div className={card}>
          <h1 className="text-lg font-bold mb-4">Chọn địa điểm làm việc</h1>
          <fieldset className="flex gap-2 mb-4">
            <legend className="text-xs font-semibold uppercase tracking-wide mb-1">Hình thức chọn</legend>
            {(['manual', 'region'] as const).map((mode) => (
              <label key={mode} className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${storeSelectionMode === mode ? 'bg-primary-surface border-primary text-primary font-semibold' : 'border-border text-text-secondary'}`}>
                <input type="radio" name="storeSelectionMode" className="sr-only" checked={storeSelectionMode === mode} onChange={() => { setStoreSelectionMode(mode); setState((s) => ({ ...s, storeIds: [] })); }} />
                {mode === 'manual' ? 'Lựa chọn địa điểm' : 'Lựa chọn khu vực'}
              </label>
            ))}
          </fieldset>

          {storeSelectionMode === 'manual' && (
            <>
              <div className="flex gap-2 mb-4">
                <input value={storeKeyword} onChange={(e) => setStoreKeyword(e.target.value)} placeholder="Tìm cửa hàng..." className={`${inputClass} flex-1`} />
              </div>
              <p className="text-sm text-text-secondary mb-2">
                {storeTotal > 0 ? `Hiển thị ${stores.length} / ${storeTotal} cửa hàng` : 'Không tìm thấy cửa hàng'}
              </p>
              <div className="flex flex-col gap-2 mb-4">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    aria-label={store.name}
                    aria-pressed={state.storeIds.includes(store.id)}
                    className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                      state.storeIds.includes(store.id)
                        ? 'border-primary bg-primary-surface'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      state.storeIds.includes(store.id) ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {state.storeIds.includes(store.id) && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{store.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {[store.streetAddress, store.ward, store.district, store.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {storeSelectionMode === 'region' && (
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex gap-2">
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Tỉnh/Thành Phố
                  <select value={regionCity} onChange={(e) => { setRegionCity(e.target.value); setRegionDistrict(''); setRegionStoreCount(null); setState((s) => ({ ...s, storeIds: [] })); }} className="border border-border rounded-md px-2 py-2 text-sm bg-white">
                    <option value="">Chọn tỉnh/thành phố</option>
                    {Object.keys(VIETNAM_PROVINCES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium">
                  Quận/Huyện
                  <select value={regionDistrict} onChange={(e) => selectRegionDistrict(e.target.value)} disabled={!regionCity} className="border border-border rounded-md px-2 py-2 text-sm bg-white disabled:opacity-60">
                    <option value="">Chọn quận/huyện</option>
                    {(VIETNAM_PROVINCES[regionCity] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </div>
              {isRegionLoading && <p className="text-sm text-text-secondary">Đang tải danh sách cửa hàng...</p>}
              {regionStoreCount !== null && !isRegionLoading && (
                <p className="text-sm text-text-secondary">Đã chọn {regionStoreCount} cửa hàng tại {regionDistrict}, {regionCity}</p>
              )}
            </div>
          )}

          {state.storeIds.length > 0 && <p className="text-sm text-primary font-semibold mb-2">Đã chọn {state.storeIds.length} cửa hàng</p>}
          {stepError && <p className="text-status-off-text text-sm mb-2">{stepError}</p>}
          {ctaRow('Tiếp theo', () => {
            if (state.storeIds.length === 0) { setStepError('Vui lòng chọn ít nhất 1 cửa hàng'); return; }
            setStepError(null);
            setStep(3);
          })}
        </div>
      </div>
    );
  }

  // STEP 3: Job info (identical to merchant wizard step 2)
  if (step === 3) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <h1 className="text-lg font-bold">Thông tin công việc</h1>
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-xs font-semibold uppercase tracking-wide">Tên vị trí tuyển dụng <span className="text-status-off-text">*</span></label>
            <input id="title" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} className={inputClass} />
          </div>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide mb-2">Loại hình làm việc <span className="text-status-off-text">*</span></legend>
            <div className="flex flex-wrap gap-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <label key={t.value} className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${state.employmentType === t.value ? 'bg-primary-surface border-primary text-primary font-semibold' : 'border-border text-text-secondary'}`}>
                  <input type="radio" name="employmentType" className="sr-only" checked={state.employmentType === t.value} onChange={() => setState((s) => ({ ...s, employmentType: t.value }))} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="deadline" className="text-xs font-semibold uppercase tracking-wide">Hạn nộp hồ sơ</label>
            <input id="deadline" type="date" lang="vi" placeholder="dd/mm/yyyy" value={state.deadline} onChange={(e) => setState((s) => ({ ...s, deadline: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="salaryMin" className="text-xs font-semibold uppercase tracking-wide">Lương tối thiểu</label>
              <input id="salaryMin" type="number" min={0} value={state.salaryMin} onChange={(e) => setState((s) => ({ ...s, salaryMin: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="salaryMax" className="text-xs font-semibold uppercase tracking-wide">Lương tối đa</label>
              <input id="salaryMax" type="number" min={0} value={state.salaryMax} onChange={(e) => setState((s) => ({ ...s, salaryMax: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide mb-2">Hình thức trả lương</legend>
            <div className="flex flex-wrap gap-2">
              {SALARY_TYPES.map((t) => (
                <label key={t.value} className={`px-4 py-2 rounded-pill border text-sm cursor-pointer ${state.salaryType === t.value ? 'bg-primary-surface border-primary text-primary font-semibold' : 'border-border text-text-secondary'}`}>
                  <input type="radio" name="salaryType" className="sr-only" checked={state.salaryType === t.value} onChange={() => setState((s) => ({ ...s, salaryType: t.value }))} />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
          {stepError && <p className="text-status-off-text text-sm">{stepError}</p>}
          {ctaRow('Tạo mô tả với AI', () => {
            if (!state.title.trim()) { setStepError('Vui lòng nhập Tên vị trí tuyển dụng'); return; }
            setStepError(null);
            generateDescription();
          }, aiLoading)}
        </div>
      </div>
    );
  }

  // STEP 4: AI description (identical to merchant wizard step 3)
  if (step === 4) {
    return (
      <div>
        {stepper}
        <div className={`${card} flex flex-col gap-4`}>
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Mô tả công việc (AI đề xuất)</h1>
            <button type="button" onClick={() => setShowPrompt((v) => !v)} className="text-xs text-text-secondary hover:text-primary flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              {showPrompt ? 'Ẩn prompt' : 'Xem prompt AI'}
            </button>
          </div>
          {showPrompt && (
            <div className="p-3 bg-status-info-bg rounded-md border border-status-info-text/20 text-xs text-status-info-text">
              <p className="font-semibold mb-1">Prompt AI:</p>
              <p>Vị trí <strong>{state.title}</strong>, ngành <strong>{state.industry}</strong>, loại hình <strong>{state.employmentType}</strong></p>
            </div>
          )}
          <textarea
            value={state.description}
            onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
            className={`${inputClass} min-h-[200px]`}
            placeholder="Mô tả công việc..."
          />
          {ctaRow('Tiếp theo', () => setStep(5))}
        </div>
      </div>
    );
  }

  // STEP 5: Review & publish
  const reviewRow = (label: string, value: React.ReactNode) => (
    <div className="flex gap-3 text-sm">
      <span className="text-text-secondary w-40 shrink-0">{label}</span>
      <span className="font-medium flex-1">{value}</span>
    </div>
  );
  const selectedMerchant = merchants.find((m) => m.id === state.merchantId);
  return (
    <div>
      {stepper}
      <div className={`${card} flex flex-col gap-4`}>
        <h1 className="text-lg font-bold">Xem lại & Đăng tin</h1>
        <div className="bg-primary-surface rounded-md p-4 flex flex-col gap-3">
          <p className="font-semibold text-base">{state.title || '(Chưa có tiêu đề)'}</p>
          <div className="h-px bg-border" />
          {reviewRow('Thương hiệu', selectedMerchant?.brandName ?? '—')}
          {reviewRow('Loại hình', EMPLOYMENT_TYPES.find((t) => t.value === state.employmentType)?.label ?? '—')}
          {reviewRow('Số cửa hàng', `${state.storeIds.length} cửa hàng`)}
          {reviewRow('Hạn nộp hồ sơ', state.deadline ? fmtDate(state.deadline) : '—')}
        </div>
        {state.description && (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Mô tả công việc</p>
            <p className="text-sm whitespace-pre-line border border-border rounded-md p-3">{state.description}</p>
          </div>
        )}
        {ctaRow('Đăng tin', publish, isPublishing)}
      </div>
    </div>
  );
}
