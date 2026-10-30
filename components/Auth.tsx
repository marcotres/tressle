
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  onSessionChange: (session: Session | null) => void;
};

export default function Auth({ onSessionChange }: Props) {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      onSessionChange(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        onSessionChange(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, onSessionChange]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage("Account created. Check your email for confirmation.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage("Welcome back!");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "Signed out.");
  }

  return (
    <section className="panel section">
      <div className="eyebrow">TRESSLE ACCOUNT</div>

      <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="auth-email">EMAIL</label>
          <input
            id="auth-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label htmlFor="auth-password">PASSWORD</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="At least 6 characters"
          />
        </div>

        <button className="btn primary" disabled={busy} type="submit">
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        className="btn secondary"
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setMessage("");
        }}
      >
        {mode === "login"
          ? "Create a new account"
          : "Already have an account? Sign in"}
      </button>

      <button
        className="btn secondary"
        type="button"
        onClick={handleLogout}
      >
        Sign out
      </button>

      {message && <p className="status" role="status">{message}</p>}

      <p className="muted">
        You can play Tressle without creating an account.
      </p>
    </section>
  );
}
