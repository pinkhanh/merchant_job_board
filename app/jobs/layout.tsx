import { Suspense } from 'react';
import { WorkerHeader } from '@/components/WorkerHeader';

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans">
      <Suspense fallback={null}>
        <WorkerHeader />
      </Suspense>
      <main className="pt-[60px] bg-worker-bg min-h-screen">{children}</main>
    </div>
  );
}
