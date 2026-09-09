"use client";

import { useState } from "react";
import { useLibrary } from "@/lib/store";

/**
 * Select an existing creator, or type a new name to add one on the fly.
 * Provenance matters here — every piece of material keeps its author.
 */
export function CreatorPicker({
  value,
  onChange,
  allowInherit,
}: {
  value?: string;
  onChange: (creatorId: string | undefined) => void;
  /** Offer an "same as course" option (used for lessons). */
  allowInherit?: boolean;
}) {
  const { db, addCreator } = useLibrary();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (adding) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          className="field"
          placeholder="Creator name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              onChange(addCreator({ name: name.trim() }).id);
              setName("");
              setAdding(false);
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <button
          className="btn-ghost shrink-0"
          onClick={() => {
            if (!name.trim()) return setAdding(false);
            onChange(addCreator({ name: name.trim() }).id);
            setName("");
            setAdding(false);
          }}
        >
          Add
        </button>
      </div>
    );
  }

  return (
    <select
      className="field"
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === "__new") return setAdding(true);
        onChange(e.target.value || undefined);
      }}
    >
      {allowInherit && <option value="">Same as course</option>}
      {db.creators.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
          {c.isSelf ? " (you)" : ""}
        </option>
      ))}
      <option value="__new">+ Add a creator…</option>
    </select>
  );
}
