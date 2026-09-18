"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * True once the component has hydrated on the client.
 *
 * Needed for anything whose correct value only exists in the browser — the
 * resolved colour theme, or the current time — where rendering it on the
 * server would produce a hydration mismatch.
 *
 * `useSyncExternalStore` is used rather than an effect that calls setState,
 * because it gives React a separate server snapshot instead of triggering a
 * second render pass.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
