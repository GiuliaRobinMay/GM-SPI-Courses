"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Mail } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

type State =
  | { status: "checking" }
  | { status: "signed-in"; email?: string }
  | { status: "signed-out" };

/**
 * Sign-in wall, but only when Supabase is configured.
 *
 * With no backend the app is local and needs no account, so this renders
 * nothing and gets out of the way entirely.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(
    isSupabaseConfigured ? { status: "checking" } : { status: "signed-in" },
  );
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      setState(
        data.session
          ? { status: "signed-in", email: data.session.user.email ?? undefined }
          : { status: "signed-out" },
      );
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(
        session
          ? { status: "signed-in", email: session.user.email ?? undefined }
          : { status: "signed-out" },
      );
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (state.status === "signed-in") return <>{children}</>;

  if (state.status === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="size-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
      </div>
    );
  }

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase || !email.trim()) return;

    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);

    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="card w-full max-w-sm p-7">
        <span className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <GraduationCap className="size-5" />
        </span>
        <h1 className="mt-4 text-[20px] font-semibold tracking-[-0.01em] text-slate-900">
          Studiolo
        </h1>
        <p className="muted mt-1">
          Your library lives in your account, so it follows you between devices.
        </p>

        {sent ? (
          <div className="mt-5 rounded-xl bg-brand-green/10 px-4 py-3.5 text-[13px] text-brand-green">
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-brand-green">
              A sign-in link is on its way to {email}. Open it on this device.
            </p>
          </div>
        ) : (
          <form className="mt-5 space-y-3" onSubmit={sendLink}>
            <input
              type="email"
              required
              autoFocus
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              <Mail className="size-4" />
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
            {error && (
              <p className="rounded-lg bg-brand-red/10 px-3 py-2 text-[12px] text-brand-red">
                {error}
              </p>
            )}
            <p className="text-center text-[12px] text-slate-400">
              No password. The link signs you in.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
