import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-7">
        <Wordmark href="/" />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 pb-16">
        {children}
      </main>
    </div>
  );
}
