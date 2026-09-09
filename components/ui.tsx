"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { LessonStatus } from "@/lib/types";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  // Mounted flag so the portal only runs in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Rendered on <body>: several ancestors use backdrop-blur, which would
  // otherwise become the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/25 p-4 backdrop-blur-[2px] sm:p-8">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative my-4 w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl border border-hairline bg-white shadow-xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
            {description && <p className="muted mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="btn-quiet -mr-2 -mt-1 px-2" aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-hairline px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon && (
        <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        {body && <p className="muted mx-auto mt-1 max-w-sm">{body}</p>}
      </div>
      {action}
    </div>
  );
}

export function Progress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-indigo-500 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const STATUS_STYLE: Record<LessonStatus, { label: string; className: string }> = {
  todo: { label: "To study", className: "bg-slate-100 text-slate-600" },
  studying: { label: "Studying", className: "bg-amber-100 text-amber-700" },
  done: { label: "Done", className: "bg-emerald-100 text-emerald-700" },
};

export function StatusBadge({ status }: { status: LessonStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[12px] font-medium text-slate-600">
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-slate-400">{hint}</span>}
    </label>
  );
}
