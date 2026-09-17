import {
  SkeletonCard,
  SkeletonHeader,
  SkeletonRows,
  SkeletonTiles,
} from "@/components/common/skeletons";

export default function DashboardLoading() {
  return (
    <>
      <SkeletonHeader />
      <SkeletonCard className="mb-10" />
      <SkeletonRows rows={3} />
      <div className="mt-10">
        <SkeletonTiles />
      </div>
    </>
  );
}
