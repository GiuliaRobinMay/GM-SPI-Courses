"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { useLibrary } from "@/lib/store";
import { CourseDialog } from "@/components/CourseDialog";
import { NextUp } from "@/components/NextUp";
import { PlanCalendar } from "@/components/PlanCalendar";
import { StudyPlan } from "@/components/StudyPlan";
import { EmptyState } from "@/components/ui";

/**
 * The dashboard answers three questions in order: what do I watch now, what
 * have I lined up, and when am I doing it. The full course list lives in the
 * sidebar, so it is not repeated here.
 */
export default function DashboardPage() {
  const { db } = useLibrary();
  const [courseOpen, setCourseOpen] = useState(false);

  if (db.courses.length === 0) {
    return (
      <>
        <EmptyState
          icon={<GraduationCap className="size-5" />}
          title="No courses yet"
          body="A course is one body of material — an SPI course, a YouTube series, or something you recorded yourself."
          action={
            <button className="btn-primary" onClick={() => setCourseOpen(true)}>
              <Plus className="size-4" />
              Create your first course
            </button>
          }
        />
        <CourseDialog open={courseOpen} onClose={() => setCourseOpen(false)} />
      </>
    );
  }

  return (
    <div className="space-y-8">
      <NextUp />

      <section>
        <h2 className="section-title mb-3">My study plan</h2>
        <StudyPlan />
      </section>

      <PlanCalendar />
    </div>
  );
}
