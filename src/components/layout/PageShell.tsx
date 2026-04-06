import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import NavBar from "@/components/layout/NavBar";

export default function PageShell({
  children,
  className,
  showNav = true,
}: {
  children: ReactNode;
  className?: string;
  showNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--z-bg)] text-zinc-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-80 w-[680px] -translate-x-1/2 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-amber-300/25 blur-3xl" />
      </div>
      {showNav ? <NavBar /> : null}
      <main className={cn("relative mx-auto max-w-6xl px-4 py-6", className)}>{children}</main>
    </div>
  );
}
