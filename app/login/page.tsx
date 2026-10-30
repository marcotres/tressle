
"use client";

import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Auth from "@/components/Auth";

export default function LoginPage() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <main className="wrap">
      <header>
        <a href="/" className="brand">
          TRESS<span>LE</span>
        </a>
        <nav>
          <a href="/">Back to game</a>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow">TRESSLE ACCOUNT</div>
        <h1>Welcome <span style={{ color: "var(--purple)" }}>back.</span></h1>
        <p>Sign in or create an account to save your scores.</p>
      </section>

      {session ? (
        <section className="panel">
          <h2>You're signed in!</h2>
          <p className="muted">{session.user.email}</p>
          <a href="/" className="btn primary">Back to game</a>
        </section>
      ) : (
        <Auth onSessionChange={setSession} />
      )}

      <footer>© {new Date().getFullYear()} TRESSLE · DAILY WORD CHALLENGE</footer>
    </main>
  );
}
