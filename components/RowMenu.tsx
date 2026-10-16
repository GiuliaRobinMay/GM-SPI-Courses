"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export interface MenuItem {
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * The three-dot menu on a row.
 *
 * Rendered on <body> and positioned against the button, because the sidebar
 * scrolls and clips — a menu inside it would be cut off at the edge.
 */
export function RowMenu({ items, label }: { items: MenuItem[]; label: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [at]);

  return (
    <>
      <button
        ref={button}
        aria-label={`More for ${label}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = button.current!.getBoundingClientRect();
          setAt(at ? null : { top: r.bottom + 4, left: Math.max(8, r.right - 180) });
        }}
        className="btn-quiet shrink-0 px-1 py-1"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {at &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAt(null)} />
            <div
              role="menu"
              className="fixed z-50 w-[180px] overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-lg"
              style={{ top: at.top, left: at.left }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setAt(null);
                    item.onSelect();
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition disabled:opacity-30 ${
                    item.danger
                      ? "text-brand-red hover:bg-brand-red/10"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
