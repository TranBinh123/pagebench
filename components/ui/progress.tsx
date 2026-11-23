import { cn } from '@/lib/cn';

export function Progress({ value }: { value: number | null }) {
  const pct = value === null ? undefined : Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
    >
      <div
        className={cn('h-full rounded-full bg-brand transition-[width] duration-200', value === null && 'w-1/3 animate-indeterminate')}
        style={pct === undefined ? undefined : { width: `${pct}%` }}
      />
    </div>
  );
}
