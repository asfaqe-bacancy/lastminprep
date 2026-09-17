import {
  SkeletonHeader,
  SkeletonRows,
  SkeletonTiles,
} from "@/components/common/skeletons";

export default function ProgressLoading() {
  return (
    <>
      <SkeletonHeader />
      <div className="mb-9">
        <SkeletonTiles />
      </div>
      <SkeletonRows rows={4} />
    </>
  );
}
