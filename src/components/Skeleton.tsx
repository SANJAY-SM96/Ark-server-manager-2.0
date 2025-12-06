import { cn } from '../utils/helpers';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
    count = 1
}: SkeletonProps) {
    const baseClasses = cn(
        'skeleton',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-lg',
        className
    );

    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
    };

    if (count === 1) {
        return <div className={baseClasses} style={style} />;
    }

    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={baseClasses} style={style} />
            ))}
        </div>
    );
}

// Card Skeleton for loading states
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn("glass-panel rounded-2xl p-6 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton width={60} height={24} className="rounded-lg" />
            </div>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
        </div>
    );
}

// Server Card Skeleton
export function ServerCardSkeleton() {
    return (
        <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
                <Skeleton variant="circular" width={16} height={16} />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="50%" height={24} />
                    <div className="flex gap-4">
                        <Skeleton width={80} height={20} className="rounded" />
                        <Skeleton width={60} height={20} className="rounded" />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 justify-end">
                <Skeleton width={80} height={36} className="rounded-lg" />
                <Skeleton width={80} height={36} className="rounded-lg" />
            </div>
        </div>
    );
}

// Mod Card Skeleton
export function ModCardSkeleton() {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden">
            <Skeleton height={192} className="rounded-none" />
            <div className="p-4 space-y-2">
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="text" width="40%" />
                <div className="flex justify-between pt-2">
                    <Skeleton width={36} height={36} className="rounded-lg" />
                    <Skeleton width={80} height={36} className="rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export default Skeleton;
