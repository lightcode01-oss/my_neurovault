import { Skeleton } from './ui/skeleton';
import { Card } from './ui/card';

/**
 * Skeleton loader for memory submission form
 * Displays while form is initializing or data is loading
 */
export function MemorySubmissionSkeleton() {
  return (
    <Card className="p-6 space-y-4">
      {/* Title input skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Category select skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Content textarea skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Submit button skeleton */}
      <Skeleton className="h-10 w-full" />

      {/* Progress bar skeleton */}
      <Skeleton className="h-2 w-full" />
    </Card>
  );
}

/**
 * Skeleton loader for transaction status
 */
export function TransactionStatusSkeleton() {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  );
}

/**
 * Skeleton loader for address pill
 */
export function AddressPillSkeleton() {
  return <Skeleton className="h-10 w-40" />;
}
