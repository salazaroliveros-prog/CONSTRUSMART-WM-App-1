import { cn } from '@/lib/utils';

export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
);

export const ChartSkeleton = () => (
  <div className="h-64 w-full bg-card p-4 rounded-xl border border-border space-y-3">
    <Skeleton className="h-4 w-48 mb-3" />
    <Skeleton className="h-48 w-full" />
    <div className="flex gap-4">
      <Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const KPISkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
    ))}
  </div>
);

export const ScreenSkeleton = () => (
  <div className="p-3 sm:p-5 max-w-[1200px] mx-auto space-y-4">
    <Skeleton className="h-8 w-1/3 mb-4" />
    <KPISkeleton />
    <Skeleton className="h-64 w-full rounded-xl" />
  </div>
);