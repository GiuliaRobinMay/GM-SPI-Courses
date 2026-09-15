import type { Metadata } from "next";
import { LibraryProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studiolo — your private university",
  description:
    "Keep every course, transcript and video you learn from in one place, and turn each one into highlights and steps you can act on.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <AuthGate>
          <LibraryProvider>
            <AppShell>{children}</AppShell>
          </LibraryProvider>
        </AuthGate>
      </body>
    </html>
  );
}
