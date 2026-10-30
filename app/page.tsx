
import Game from "@/components/Game";

export default function Home() {
  return (
    <main className="wrap">
      <header>
        <div className="brand">
          TRESS<span>LE</span>
        </div>

        <nav>
          <a href="#daily">Daily</a>
          <a href="#rankings">Rankings</a>
          <a href="/login" className="btn primary">
            Sign in
          </a>
        </nav>
      </header>

      <section className="hero">
        <div className="eyebrow">THE DAILY WORD CHALLENGE</div>
        <h1>
          One Letter.<br />
          <span style={{ color: "var(--purple)" }}>
            Endless Possibilities.
          </span>
        </h1>
        <p>Think fast. Dig deep. Find the rarest words.</p>
      </section>

      <Game />

      <section
        id="rankings"
        className="panel section"
      >
        <div className="eyebrow">GLOBAL LEADERBOARD</div>
        <h2>Tressle Rankings</h2>
        <p className="muted">
          Top scores from today's challenge.
        </p>
        <div
          id="leaderboard-placeholder"
          className="muted"
        >
          Leaderboard loads after the first verified submissions.
        </div>
      </section>

      <footer>
        © {new Date().getFullYear()} TRESSLE · DAILY WORD CHALLENGE
      </footer>
    </main>
  );
}
