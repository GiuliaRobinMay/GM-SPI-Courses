"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLibrary } from "@/lib/store";
import { ACCENT_TOKENS, accent } from "@/lib/theme";
import type { AccentToken } from "@/lib/types";
import { CreatorPicker } from "./CreatorPicker";
import { Field, Modal } from "./ui";

export function CourseDialog({
  open,
  onClose,
  facultyId,
  courseId,
}: {
  open: boolean;
  onClose: () => void;
  /** Pre-selected faculty when creating from inside one. */
  facultyId?: string;
  /** When set, the dialog edits that course instead of creating one. */
  courseId?: string;
}) {
  const router = useRouter();
  const { db, addCourse, updateCourse, course } = useLibrary();
  const existing = courseId ? course(courseId) : undefined;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [faculty, setFaculty] = useState(facultyId ?? db.faculties[0]?.id ?? "");
  const [creatorId, setCreatorId] = useState("cr-self");
  const [sourceUrl, setSourceUrl] = useState("");
  const [topics, setTopics] = useState("");
  const [track, setTrack] = useState("");
  const [tone, setTone] = useState<AccentToken>("violet");

  useEffect(() => {
    if (!open) return;
    setTitle(existing?.title ?? "");
    setSubtitle(existing?.subtitle ?? "");
    setDescription(existing?.description ?? "");
    setFaculty(existing?.facultyId ?? facultyId ?? db.faculties[0]?.id ?? "");
    setCreatorId(existing?.creatorId ?? db.creators.find((c) => c.isSelf)?.id ?? "cr-self");
    setSourceUrl(existing?.sourceUrl ?? "");
    setTopics(existing?.topics.join(", ") ?? "");
    setTrack(existing?.track ?? "");
    setTone(existing?.accent ?? "violet");
  }, [open, existing, facultyId, db.faculties, db.creators]);

  const topicList = topics
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  function submit() {
    if (!title.trim() || !faculty) return;
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      facultyId: faculty,
      creatorId,
      sourceUrl: sourceUrl.trim() || undefined,
      topics: topicList,
      track: track.trim() || undefined,
      accent: tone,
    };
    if (existing) {
      updateCourse(existing.id, payload);
      onClose();
      return;
    }
    const created = addCourse(payload);
    onClose();
    router.push(`/course/${created.id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={existing ? "Edit course" : "New course"}
      description="A course groups lessons that came from the same body of material."
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={!title.trim() || !faculty}
          >
            {existing ? "Save changes" : "Create course"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title">
            <input
              autoFocus
              className="field"
              placeholder="Building Agents That Actually Ship"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Subtitle" hint="Optional one-liner.">
          <input
            className="field"
            placeholder="From a single prompt to a working automation"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />
        </Field>

        <Field label="Faculty">
          <select
            className="field"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
          >
            {db.faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Creator" hint="Who made it — you or someone else.">
          <CreatorPicker
            value={creatorId}
            onChange={(id) => setCreatorId(id ?? "cr-self")}
          />
        </Field>

        <Field label="Track" hint="Groups courses into a progression, e.g. “Level 1”.">
          <input
            className="field"
            placeholder="Level 1"
            value={track}
            onChange={(e) => setTrack(e.target.value)}
          />
        </Field>

        <Field label="Source link" hint="Where the original course lives.">
          <input
            className="field"
            placeholder="https://…"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Description">
            <textarea
              className="field min-h-[84px] resize-y"
              placeholder="What this course covers and why you kept it."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Topics" hint="Comma separated.">
          <input
            className="field"
            placeholder="agents, automation, prompting"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
          />
        </Field>

        <div>
          <span className="label">Colour</span>
          <div className="flex gap-2 pt-1">
            {ACCENT_TOKENS.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                aria-label={t}
                className={`size-8 rounded-full ${accent(t).solid} ${
                  tone === t ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
