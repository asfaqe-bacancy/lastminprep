import { SkeletonHeader, SkeletonRows } from "@/components/common/skeletons";

export default function PreparationsLoading() {
  return (
    <>
      <SkeletonHeader />
      <SkeletonRows rows={5} />
    </>
  );
}
