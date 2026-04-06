import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-[10px] border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm shadow-zinc-200/20 outline-none transition focus:border-[color:var(--z-accent)] focus:ring-2 focus:ring-blue-200",
        className,
      )}
      {...props}
    />
  );
}

