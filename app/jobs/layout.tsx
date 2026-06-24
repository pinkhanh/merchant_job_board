import { WorkerHeader } from '@/components/WorkerHeader';

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-sans">
      <WorkerHeader />
      <main className="pt-[60px] bg-worker-bg min-h-screen">{children}</main>
    </div>
  );
}
