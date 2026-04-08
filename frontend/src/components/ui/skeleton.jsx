import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

/**
 * TableSkeleton — skeleton loader for table rows
 * @param {number} rows - number of skeleton rows (default 5)
 * @param {number} cols - number of columns (default 5)
 */
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 items-center px-4 py-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              className="h-4 flex-1"
              style={{ maxWidth: colIdx === 0 ? '120px' : colIdx === cols - 1 ? '80px' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
