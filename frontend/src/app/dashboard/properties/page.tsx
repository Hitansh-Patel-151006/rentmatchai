'use client';

import React, { Suspense } from 'react';
import LandlordPropertiesView from '@/src/components/dashboard/LandlordPropertiesView';
import { Skeleton } from '@/src/components/ui/skeleton';

function PropertiesSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 select-none">
      <div className="rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-8 space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
      <div className="h-10 flex gap-4">
        <Skeleton className="h-10 flex-1 rounded-2xl" />
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

export default function DashboardPropertiesPage() {
  return (
    <Suspense fallback={<PropertiesSkeleton />}>
      <LandlordPropertiesView />
    </Suspense>
  );
}
