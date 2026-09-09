"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Compass, Library, Plus, Settings, Users, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { useLibrary } from "@/lib/store";
import { accent } from "@/lib/theme";
import { FacultyIcon } from "./Icon";
import { FacultyDialog } from "./FacultyDialog";

const NAV = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/creators", label: "Creators", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { db, coursesOf } = useLibrary();
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const faculties = [...db.faculties].sort((a, b) => a.order - b.order);

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-hairline bg-white transition-[width] ${
        collapsed ? "w-[68px]" : "w-[248px]"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[13px] font-bold text-white">
            St
          </span>
          {!collapsed && (
            <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">
              Studiolo
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="btn-quiet ml-auto px-1.5"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {!collapsed && (
          <div className="flex items-center justify-between px-6 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Faculties
            </span>
            <button
              onClick={() => setDialogOpen(true)}
              className="btn-quiet px-1 py-1"
              aria-label="New faculty"
            >
              <Plus className="size-4" />
            </button>
          </div>
        )}

        <div className="flex flex-col gap-0.5 overflow-y-auto px-3 pb-4">
          {faculties.map((f) => {
            const a = accent(f.accent);
            const active = pathname === `/faculty/${f.id}`;
            const count = coursesOf(f.id).length;
            return (
              <Link
                key={f.id}
                href={`/faculty/${f.id}`}
                title={collapsed ? f.name : undefined}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active
                    ? "bg-slate-100 font-medium text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${a.soft} ${a.softText}`}
                >
                  <FacultyIcon name={f.icon} className="size-4" />
                </span>
                {!collapsed && (
                  <>
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto text-[12px] tabular-nums text-slate-400">
                      {count}
                    </span>
                  </>
                )}
              </Link>
            );
          })}

          {collapsed && (
            <button
              onClick={() => setDialogOpen(true)}
              className="mx-auto mt-1 flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              aria-label="New faculty"
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-hairline px-3 py-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[12px] font-semibold text-indigo-700">
            {(db.creators.find((c) => c.isSelf)?.name ?? "You").slice(0, 2)}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-slate-900">
                {db.creators.find((c) => c.isSelf)?.name ?? "You"}
              </p>
              <p className="truncate text-[12px] text-slate-400">
                {db.lessons.length} lessons stored
              </p>
            </div>
          )}
        </div>
      </div>

      <FacultyDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </aside>
  );
}
