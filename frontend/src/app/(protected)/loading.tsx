import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="w-full h-full flex-1 max-w-[1600px] mx-auto px-5 sm:px-7 lg:px-8 py-6">
      <DashboardSkeleton />
    </div>
  );
}
