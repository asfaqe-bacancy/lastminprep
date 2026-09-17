import { Wordmark } from "./wordmark";
import { ThemeToggle } from "./theme-toggle";

export function MobileTopBar() {
  return (
    <header className="liquid sticky top-0 z-30 flex items-center justify-between rounded-none border-x-0 border-t-0 px-5 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] lg:hidden">
      <Wordmark />
      <ThemeToggle />
    </header>
  );
}
