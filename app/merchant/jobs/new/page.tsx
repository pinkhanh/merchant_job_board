'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Store = { id: string; name: string };

type WizardState = {
  storeIds: string[];
  title: string;
  industry: string;
  employmentType: 'part_time' | 'shift' | 'seasonal';
  salaryType: 'hourly' | 'shift' | 'monthly' | 'negotiable';
  deadline: string;
  description: string;
};

const EMPLOYMENT_TYPES = [
  { value: 'part_time', label: 'Bán thời gian' },
  { value: 'shift', label: 'Theo ca' },
  { value: 'seasonal', label: 'Thời vụ' },
] as const;

export default function JobWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [stores, setStores] = useState<Store[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [state, setState] = useState<WizardState>({
    storeIds: [],
    title: '',
    industry: 'F&B',
    employmentType: 'part_time',
    salaryType: 'hourly',
    deadline: '',
    description: '',
  });

  useEffect(() => {
    fetch('/api/merchant/stores')
      .then((res) => res.json())
      .then(setStores);
  }, []);

  function toggleStore(id: string) {
    setState((s) => ({
      ...s,
      storeIds: s.storeIds.includes(id) ? s.storeIds.filter((x) => x !== id) : [...s.storeIds, id],
    }));
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
            {s.n < step ? '✓' : s.n}
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
  const inputClass =
    'border border-border rounded-md px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 w-full';
  const card = 'bg-white border border-border rounded-lg shadow-card p-8';

  if (step === 1) {
    return (
      <div>
        {stepper}
        <div className={card}>
          <h1 className="text-lg font-bold mb-4">Chọn địa điểm làm việc</h1>
          <div className="flex flex-col gap-2 mb-4">
            {stores.map((store) => (
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

          <button onClick={generateDescription} className={`${primaryButton} self-start`}>
            Tiếp theo
          </button>
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
          <button onClick={() => setStep(4)} className={`${primaryButton} self-start`}>
            Tiếp theo
          </button>
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
        <button onClick={publish} className={`${primaryButton} self-start`}>
          Đăng tin
        </button>
      </div>
    </div>
  );
}
