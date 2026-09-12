"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = ({ className = "", ...props }: SkeletonProps) => {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
};

export const SkeletonCircle = ({ className = "" }: { className?: string }) => {
  return <Skeleton className={`rounded-full shrink-0 ${className}`} />;
};

export const SkeletonLine = ({
  className = "",
  width = "w-full",
}: {
  className?: string;
  width?: string;
}) => {
  return <Skeleton className={`h-3.5 ${width} rounded-md ${className}`} />;
};

export const SkeletonCard = ({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-800 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

/* ============================================================
   PAGE SPECIFIC SKELETON PREVIEWS
   ============================================================ */

export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 Top KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <SkeletonLine width="w-28" />
              <Skeleton className="h-8 w-20 rounded-lg" />
              <SkeletonLine width="w-36" />
            </div>
            <Skeleton className="w-13 h-13 rounded-2xl shrink-0" />
          </SkeletonCard>
        ))}
      </div>

      {/* Section 1: Main Chart & Donut Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonLine width="w-48" className="h-5" />
              <SkeletonLine width="w-72" />
            </div>
            <Skeleton className="w-36 h-8 rounded-xl" />
          </div>
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </SkeletonCard>

        <SkeletonCard className="space-y-6">
          <div className="space-y-2">
            <SkeletonLine width="w-40" className="h-5" />
            <SkeletonLine width="w-56" />
          </div>
          <div className="flex items-center justify-center py-4">
            <SkeletonCircle className="w-44 h-44" />
          </div>
          <div className="space-y-2 pt-2">
            <SkeletonLine width="w-full" />
            <SkeletonLine width="w-4/5" />
          </div>
        </SkeletonCard>
      </div>

      {/* Section 2: Bottom Grids Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="space-y-4">
            <SkeletonLine width="w-36" className="h-4" />
            <Skeleton className="h-[180px] w-full rounded-2xl" />
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Banner Skeleton */}
      <Skeleton className="h-40 w-full rounded-[24px]" />

      {/* 6 KPI Metric Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} className="p-5 space-y-3">
            <SkeletonLine width="w-20" />
            <Skeleton className="h-8 w-16 rounded-lg" />
            <SkeletonLine width="w-24" />
          </SkeletonCard>
        ))}
      </div>

      {/* 2 Main Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="h-72 space-y-4">
              <SkeletonLine width="w-36" className="h-5" />
              <div className="flex justify-center py-2">
                <SkeletonCircle className="w-36 h-36" />
              </div>
            </SkeletonCard>
            <SkeletonCard className="h-72 space-y-4">
              <SkeletonLine width="w-36" className="h-5" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </SkeletonCard>
          </div>

          <SkeletonCard className="space-y-4">
            <SkeletonLine width="w-48" className="h-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-28 rounded-2xl" />
              ))}
            </div>
          </SkeletonCard>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <SkeletonCard className="h-80 space-y-4">
            <SkeletonLine width="w-40" className="h-5" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
};

export const TasksSkeleton = () => {
  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left border-collapse">
          {/* Table Header Skeleton */}
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-[#F4F5F7] dark:bg-slate-800/80">
              <th className="py-3.5 px-3 w-10 text-center">
                <Skeleton className="w-4 h-4 rounded mx-auto" />
              </th>
              <th className="py-3.5 px-2 w-24">
                <Skeleton className="h-3 w-14 rounded" />
              </th>
              <th className="py-3.5 px-2 min-w-[200px]">
                <Skeleton className="h-3 w-28 rounded" />
              </th>
              <th className="py-3.5 px-2 w-36">
                <Skeleton className="h-3 w-20 rounded" />
              </th>
              <th className="py-3.5 px-2 w-32">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
              <th className="py-3.5 px-2 w-28">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
              <th className="py-3.5 px-2 w-32">
                <Skeleton className="h-3 w-16 rounded" />
              </th>
              <th className="py-3.5 px-2 w-28 text-right">
                <Skeleton className="h-3 w-16 rounded ml-auto" />
              </th>
              <th className="sticky right-0 z-20 py-3.5 pr-4 pl-2 w-44 min-w-[165px] text-right bg-[#F4F5F7] dark:bg-slate-800">
                <Skeleton className="h-3 w-16 rounded ml-auto" />
              </th>
            </tr>
          </thead>

          {/* Table Body Rows Skeleton */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 text-center align-middle">
                  <Skeleton className="w-4 h-4 rounded mx-auto" />
                </td>
                <td className="py-3 px-2 align-middle">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </td>
                <td className="py-3 px-2 align-middle">
                  <div className="space-y-1.5 max-w-sm">
                    <Skeleton className="h-3.5 w-4/5 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </td>
                <td className="py-3 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <SkeletonCircle className="w-6 h-6" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </td>
                <td className="py-3 px-2 align-middle">
                  <div className="flex items-center gap-2">
                    <SkeletonCircle className="w-6 h-6" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </td>
                <td className="py-3 px-2 align-middle">
                  <Skeleton className="h-6 w-16 rounded-md" />
                </td>
                <td className="py-3 px-2 align-middle">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </td>
                <td className="py-3 px-2 text-right align-middle">
                  <Skeleton className="h-3.5 w-20 rounded ml-auto" />
                </td>
                <td className="sticky right-0 z-10 py-3 pr-4 pl-2 text-right align-middle w-44 min-w-[165px] bg-inherit">
                  <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const EmployeesSkeleton = ({
  viewMode = "list",
}: {
  viewMode?: "list" | "grid";
}) => {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-300">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <SkeletonCircle className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonLine width="w-32" />
                  <SkeletonLine width="w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2 border border-slate-100 dark:border-slate-800/80">
              <div className="flex justify-between">
                <SkeletonLine width="w-20" />
                <SkeletonLine width="w-24" />
              </div>
              <div className="flex justify-between">
                <SkeletonLine width="w-20" />
                <SkeletonLine width="w-24" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    );
  }

  // Authentic Table List Shimmer Skeleton
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/90 dark:border-slate-800 w-full min-h-[420px] flex flex-col justify-between overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto w-full custom-scrollbar flex-1 pb-4">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200/90 dark:border-slate-800 bg-[#F4F5F7] dark:bg-slate-800/80">
              <th className="py-3.5 px-3 w-10 text-center">
                <Skeleton className="w-4 h-4 rounded mx-auto" />
              </th>
              <th className="py-3.5 px-3 min-w-[220px]">
                <Skeleton className="h-3 w-24 rounded" />
              </th>
              <th className="py-3.5 px-3 w-28 text-center">
                <Skeleton className="h-3 w-16 rounded mx-auto" />
              </th>
              <th className="py-3.5 px-3 w-36">
                <Skeleton className="h-3 w-20 rounded" />
              </th>
              <th className="py-3.5 px-3 w-36">
                <Skeleton className="h-3 w-20 rounded" />
              </th>
              <th className="py-3.5 px-3 w-28 text-center">
                <Skeleton className="h-3 w-14 rounded mx-auto" />
              </th>
              <th className="py-3.5 px-3 w-32 text-center">
                <Skeleton className="h-3 w-16 rounded mx-auto" />
              </th>
              <th className="sticky right-0 z-20 py-3.5 pr-4 pl-2 w-44 min-w-[168px] text-right bg-[#F4F5F7] dark:bg-slate-800">
                <Skeleton className="h-3 w-16 rounded ml-auto" />
              </th>
            </tr>
          </thead>

          {/* Table Body Rows */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                {/* Checkbox */}
                <td className="py-3 px-3 text-center align-middle">
                  <Skeleton className="w-4 h-4 rounded mx-auto" />
                </td>

                {/* Employee Name + Email */}
                <td className="py-3 px-3 align-middle">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3.5 w-28 rounded" />
                      <Skeleton className="h-2.5 w-36 rounded" />
                    </div>
                  </div>
                </td>

                {/* ID Code */}
                <td className="py-3 px-3 text-center align-middle">
                  <Skeleton className="h-5 w-20 rounded-md mx-auto" />
                </td>

                {/* Department */}
                <td className="py-3 px-3 align-middle">
                  <Skeleton className="h-5 w-24 rounded-md" />
                </td>

                {/* Role */}
                <td className="py-3 px-3 align-middle">
                  <Skeleton className="h-5 w-24 rounded-md" />
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-center align-middle">
                  <Skeleton className="h-5 w-16 rounded-full mx-auto" />
                </td>

                {/* Date */}
                <td className="py-3 px-3 text-center align-middle">
                  <Skeleton className="h-3.5 w-20 rounded mx-auto" />
                </td>

                {/* Actions */}
                <td className="sticky right-0 z-10 py-3 pr-4 pl-2 text-right align-middle w-44 min-w-[168px] bg-inherit">
                  <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="w-7 h-7 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Skeleton */}
      <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-[#F4F5F7]/50 dark:bg-slate-800/40 flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const SidebarSkeleton = () => {
  return (
    <aside className="hidden lg:flex lg:w-[275px] lg:flex-col lg:border-r lg:border-slate-200/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0B0F17] justify-between shrink-0 h-screen sticky top-0 z-40 select-none animate-in fade-in duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-5">
        {/* Brand Skeleton */}
        <div className="px-2 pt-1 pb-2 space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonCircle className="w-9 h-9" />
            <SkeletonLine width="w-28" className="h-5" />
          </div>
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>

        {/* 3 Group Enclosures */}
        {[1, 2, 3].map((g) => (
          <div key={g} className="space-y-1.5">
            <SkeletonLine width="w-20" className="mx-2" />
            <div className="bg-white dark:bg-slate-900/90 rounded-[20px] border border-slate-200/90 dark:border-slate-800/90 p-2 space-y-2">
              {[1, 2].map((item) => (
                <div key={item} className="flex items-center gap-3 p-2 rounded-xl">
                  <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
                  <SkeletonLine width="w-28" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Profile Skeleton */}
      <div className="p-4 pt-1 pb-5 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
        <SkeletonLine width="w-28" className="mx-2" />
        <div className="bg-white dark:bg-slate-900/90 rounded-[22px] border border-slate-200/90 dark:border-slate-800/90 p-2 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            <SkeletonCircle className="w-10 h-10" />
            <div className="space-y-2 flex-1">
              <SkeletonLine width="w-20" />
              <SkeletonLine width="w-16" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </div>
    </aside>
  );
};
