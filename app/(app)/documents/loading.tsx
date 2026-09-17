import { SkeletonHeader, SkeletonRows } from "@/components/common/skeletons";

export default function DocumentsLoading() {
  return (
    <>
      <SkeletonHeader />
      <SkeletonRows rows={4} />
    </>
  );
}
