import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm shadow-zinc-200/20 outline-none transition focus:border-[color:var(--z-accent)] focus:ring-2 focus:ring-blue-200",
        className,
      )}
      {...props}
    />
  );
}

