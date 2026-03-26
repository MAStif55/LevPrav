'use client';

export function PackCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            {/* Image skeleton */}
            <div className="aspect-square bg-gray-200" />

            {/* Content skeleton */}
            <div className="p-5 space-y-3">
                {/* Title */}
                <div className="h-5 bg-gray-200 rounded w-3/4" />

                {/* Description */}
                <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>

                {/* Price and button */}
                <div className="flex items-center justify-between pt-2">
                    <div className="h-6 bg-gray-200 rounded w-20" />
                    <div className="h-8 bg-gray-200 rounded-full w-24" />
                </div>
            </div>
        </div>
    );
}

export function PackGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <PackCardSkeleton key={i} />
            ))}
        </div>
    );
}
