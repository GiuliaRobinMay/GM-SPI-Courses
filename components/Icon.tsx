"use client";

import {
  Sparkles, Megaphone, Briefcase, ChefHat, BookOpen, Brain, Camera, Code2,
  Compass, Dumbbell, Flame, Globe2, GraduationCap, Heart, Landmark, Leaf,
  Lightbulb, LineChart, Music, Palette, PenTool, Rocket, Users, Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icons a Faculty can be given. Keys are stored in the database. */
export const FACULTY_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  megaphone: Megaphone,
  briefcase: Briefcase,
  chefhat: ChefHat,
  book: BookOpen,
  brain: Brain,
  camera: Camera,
  code: Code2,
  compass: Compass,
  dumbbell: Dumbbell,
  flame: Flame,
  globe: Globe2,
  cap: GraduationCap,
  heart: Heart,
  landmark: Landmark,
  leaf: Leaf,
  lightbulb: Lightbulb,
  chart: LineChart,
  music: Music,
  palette: Palette,
  pen: PenTool,
  rocket: Rocket,
  users: Users,
  wrench: Wrench,
};

export const FACULTY_ICON_NAMES = Object.keys(FACULTY_ICONS);

export function FacultyIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = FACULTY_ICONS[name] ?? BookOpen;
  return <Cmp className={className} strokeWidth={1.8} />;
}
