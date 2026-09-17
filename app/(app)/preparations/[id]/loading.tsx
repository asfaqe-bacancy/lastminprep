import { SkeletonHeader, SkeletonRows } from "@/components/common/skeletons";

export default function PreparationLoading() {
  return (
    <>
      <SkeletonHeader />
      <SkeletonRows rows={4} />
      <div className="mt-9">
        <SkeletonRows rows={4} />
      </div>
    </>
  );
}
