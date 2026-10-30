
"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-browser";

const categories = [
  "Name",
  "Object",
  "City",
  "Animal",
  "Profession",
  "Food",
  "Character",
];

type Result = {
  category: string;
  answer: string;
  score: number;
  valid: boolean;
  rarity: number;
};

export default function Game() {
  const [letter, setLetter] = useState("…");
  const [date, setDate] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/daily")
      .then((r) => r.json())
      .then((d) => {
        setLetter(d.letter);
        setDate(d.date);
      })
      .catch(() => setMessage("Could not load today's challenge."));
  }, []);

  useEffect(() => {
    if (!started || done || seconds <= 0) return;

    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [started, done, seconds]);

  async function submit() {
    if (!started || busy || done) return;

    setBusy(true);
    setMessage("Checking your answers…");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setResults(data.results);
      setTotal(data.total);
      setDone(true);

      setMessage(
        data.saved
          ? "Score saved to Tressle Rankings."
          : session
            ? "Score calculated. Your account is connected; score saving is the next step."
            : "Score calculated. Sign in to save it to the global rankings."
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started && seconds === 0 && !done && !busy) {
      submit();
    }
  }, [started, seconds, done, busy]);

  const progress = (seconds / 60) * 100;

  return (
    <section id="daily" className="panel">
      {!started ? (
        <div className="start-screen">
          <div className="eyebrow">TODAY'S CHALLENGE</div>
          <h2>Ready to play?</h2>
          <p className="muted">
            You have 60 seconds to find the rarest words.
            The daily letter will be revealed when you start.
          </p>

          <button
            className="btn primary"
            disabled={letter === "…"}
            onClick={() => setStarted(true)}
          >
            {letter === "…" ? "Loading..." : "START GAME"}
          </button>
        </div>
      ) : !done ? (
        <>
          <div className="challenge">
            <div>
              <div className="label">TODAY'S CHALLENGE</div>
              <div className="letterline">
                <div className="letter">{letter}</div>
                <div>
                  <b>Tressle Daily</b>
                  <div className="date">{date}</div>
                </div>
              </div>
            </div>

            <div className="timer">
              <strong>{seconds}</strong>
              <small>SECONDS LEFT</small>
            </div>
          </div>

          <div className="progress">
            <div
              className="bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid">
            {categories.map((c) => (
              <div className="field" key={c}>
                <label htmlFor={c}>{c.toUpperCase()}</label>
                <input
                  id={c}
                  value={answers[c] || ""}
                  maxLength={40}
                  autoComplete="off"
                  placeholder={`Starts with ${letter}…`}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [c]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="actions">
            <button
              className="btn primary"
              disabled={busy}
              onClick={submit}
            >
              {busy ? "Checking…" : "Submit answers"}
            </button>

            <button
              className="btn secondary"
              onClick={() => setAnswers({})}
            >
              Clear all
            </button>
          </div>

          <p className="note">
            Everyone gets the same letter and categories each day.
            Valid, less common words earn a higher Rarity Score.
            You have 60 seconds.
          </p>
        </>
      ) : (
        <>
          <div className="eyebrow">DAILY CHALLENGE COMPLETE</div>
          <h2>Your Rarity Score</h2>
          <div className="score">{total}</div>
          <p className="muted">Your verified score breakdown</p>

          <div className="result-list">
            {results.map((r) => (
              <div className="result-row" key={r.category}>
                <span>
                  {r.category}: {r.answer || "—"}{" "}
                  {r.answer && !r.valid ? "· not accepted" : ""}
                </span>
                <span className="points">+{r.score}</span>
              </div>
            ))}
          </div>

          <p className="status">{message}</p>
        </>
      )}

      {message && !done && started && (
        <p className="status" role="status">{message}</p>
      )}
    </section>
  );
}
