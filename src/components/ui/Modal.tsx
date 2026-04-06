import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, description, children, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "w-full max-w-lg rounded-2xl bg-white shadow-xl shadow-black/20 border border-zinc-200",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5">
            <div>
              <div className="text-base font-semibold text-zinc-900">{title}</div>
              {description ? <div className="mt-1 text-sm text-zinc-600">{description}</div> : null}
            </div>
            <button
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
              onClick={onClose}
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 pb-5 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

