import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PointsPill({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-zinc-900 shadow-sm shadow-blue-200/25 border border-white/60",
        className,
      )}
    >
      <Star className="h-4 w-4 text-amber-500" />
      <span>{value} 积分</span>
    </div>
  );
}

