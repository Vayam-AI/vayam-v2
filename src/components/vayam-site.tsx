"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./vayam-site.module.css";

// ---------------------------------------------------------------------------
// Content (all copy exact per handoff; typographic quotes/dashes intentional)
// ---------------------------------------------------------------------------

type Answer = "agree" | "unsure" | "disagree";

const QUESTIONS: Array<{ q: string; persp: Record<Answer, string> }> = [
  {
    q: "Should how you were raised decide what you believe?",
    persp: {
      agree:
        "“I kept my parents’ politics until I moved cities for work. Nothing about my values changed — only who I ate lunch with.”",
      unsure:
        "“I thought I had chosen my beliefs. Then I met someone who had reasoned their way to the opposite conclusion, carefully.”",
      disagree:
        "“Where I grew up, questioning it out loud cost you the room. That is not a free choice either.”",
    },
  },
  {
    q: "Is changing your mind in public a strength or a liability?",
    persp: {
      agree:
        "“I run a small team. The day I said I had been wrong about a hire, people started telling me things earlier.”",
      unsure:
        "“It depends who is watching. In my family it reads as honesty; at work it has been used against me.”",
      disagree:
        "“I have watched people rewarded for confidence they did not earn. Consistency is the only thing I trust now.”",
    },
  },
  {
    q: "Do you understand your own biases better than the people around you do?",
    persp: {
      agree:
        "“I journalled for a year and found a pattern I had denied for a decade. Nobody else could have told me that.”",
      unsure:
        "“I notice mine only in hindsight. My sister spots them live, and she is usually right.”",
      disagree:
        "“The things I was most certain about were the things I had never once been asked to explain.”",
    },
  },
];

const WHO: Record<Answer, string> = {
  agree: "shared by a 24-year-old in Hyderabad · agreed with you",
  unsure: "shared by a 31-year-old in Pune · was unsure too",
  disagree: "shared by a 22-year-old in Kochi · disagreed with you",
};

const TALLIES: Record<Answer, [string, string, string]> = {
  agree: ["48%", "19%", "33%"],
  unsure: ["31%", "38%", "31%"],
  disagree: ["29%", "22%", "49%"],
};

const CHIP_OPTIONS: Array<{ key: Answer; glyph: string; label: string }> = [
  { key: "agree", glyph: "●", label: "Agree" },
  { key: "unsure", glyph: "◐", label: "I don’t know" },
  { key: "disagree", glyph: "○", label: "Disagree" },
];

const HOME_STEPS = [
  { label: "01 · answer", body: "You respond first — including “I don’t know.”", active: true },
  { label: "02 · encounter", body: "Vayam shows you a perspective you didn’t consider.", active: false },
  { label: "03 · understand", body: "Conversations reorganise into collective understanding.", active: false },
  { label: "04 · contribute", body: "Move from discussing a problem to building on it.", active: false },
];

const WRAPPED_STATS: Array<{ num: string; cap: string; bg?: string }> = [
  { num: "14", cap: "times you changed your mind", bg: "rgba(255,90,31,0.07)" },
  { num: "62%", cap: "of perspectives you read came from outside your circle" },
  { num: "39", cap: "questions you answered “I don’t know”" },
  { num: "7", cap: "ideas built on by other people", bg: "rgba(31,122,114,0.09)" },
];

const CI_COUNTERS: Array<{ num: string; color: string; cap: string }> = [
  { num: "1,204", color: "var(--text)", cap: "people answered" },
  { num: "4", color: "var(--teal)", cap: "points of agreement" },
  { num: "2", color: "var(--text)", cap: "real disagreements" },
  { num: "6", color: "var(--orange)", cap: "still open" },
];

const CI_FLOW = [
  { n: "01", active: true, text: "Someone proposes a solution." },
  { n: "02", active: false, text: "People argue its pros and cons." },
  { n: "03", active: false, text: "Every pro and con is voted up or down." },
  {
    n: "04",
    active: false,
    text: "Behind every vote, people attach an experience, a belief, a disagreement, or a new question.",
  },
];

type Contribution = { glyph: string; kind: string; text: string };
type Argument = {
  id: string;
  kind: "pro" | "con";
  text: string;
  up: number;
  down: number;
  contrib: Contribution[];
};
type Solution = { id: string; backing: string; title: string; args: Argument[] };

const SOLUTIONS: Solution[] = [
  {
    id: "s1",
    backing: "62%",
    title:
      "Before you can reply, you have to read one perspective that disagrees with you.",
    args: [
      {
        id: "a1",
        kind: "pro",
        text: "You cannot argue with a caricature you have never actually read.",
        up: 214,
        down: 12,
        contrib: [
          {
            glyph: "●",
            kind: "experience",
            text: "I wrote a reply, read the other side, and deleted half of it. The half that was about the person, not the point.",
          },
          {
            glyph: "○",
            kind: "belief",
            text: "Understanding an argument is not the same as conceding it.",
          },
          {
            glyph: "?",
            kind: "question",
            text: "Does reading one opposing view do anything if you already decided it is wrong?",
          },
        ],
      },
      {
        id: "a2",
        kind: "con",
        text: "Anything mandatory gets skimmed. People will click through it to get to the reply box.",
        up: 96,
        down: 38,
        contrib: [
          {
            glyph: "●",
            kind: "experience",
            text: "Our college made a diversity module compulsory. Everyone learned to scroll fast, not to listen.",
          },
          {
            glyph: "≠",
            kind: "disagreement",
            text: "Skimming is still exposure. Some of it lands even when you resist it.",
          },
          {
            glyph: "→",
            kind: "idea",
            text: "Ask one question about what you read instead of forcing a timer.",
          },
        ],
      },
    ],
  },
  {
    id: "s2",
    backing: "41%",
    title: "Weight a contribution by the reasoning it gives, not by who wrote it.",
    args: [
      {
        id: "b1",
        kind: "pro",
        text: "Removes the follower hierarchy — a first-time poster with a good reason outranks a popular one-liner.",
        up: 178,
        down: 21,
        contrib: [
          {
            glyph: "●",
            kind: "experience",
            text: "The most useful thing anyone told me about my hometown came from an account with nine followers.",
          },
          {
            glyph: "§",
            kind: "learning",
            text: "In our test threads, people agreed on the problem far more than on the language for it.",
          },
        ],
      },
      {
        id: "b2",
        kind: "con",
        text: "Someone still has to judge what counts as good reasoning, and that is a kind of power.",
        up: 132,
        down: 29,
        contrib: [
          {
            glyph: "○",
            kind: "belief",
            text: "Evidence should support a point, not overpower the person making it.",
          },
          {
            glyph: "≠",
            kind: "disagreement",
            text: "Then let the room judge it, not a model.",
          },
          {
            glyph: "?",
            kind: "question",
            text: "Who decides when lived experience counts as evidence?",
          },
        ],
      },
    ],
  },
];

const KIND_COLOR: Record<string, string> = {
  experience: "var(--orange-light)",
  belief: "var(--text-60)",
  disagreement: "var(--teal-light)",
  question: "var(--orange-light)",
  idea: "var(--teal-light)",
  learning: "var(--text-60)",
};

const VALUES_LEFT = [
  ["Empathetic, ", "not sentimental."],
  ["Intelligent, ", "not intimidating."],
  ["Curious, ", "not argumentative."],
  ["Responsible, ", "not restrictive."],
];
const VALUES_RIGHT = [
  ["Collaborative, ", "not competitive."],
  ["Reflective, ", "not preachy."],
  ["Forward-looking, ", "not idealistic without action."],
  ["Courageous, ", "without being aggressive."],
];

const NAV_ITEMS = ["Vayam", "The Turn", "Collective Intelligence", "Values"];
const WAITLIST_NOTE =
  "Vayam opens in Hyderabad first, then other cities. We will not send you a feed — just one question worth answering.";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VayamSite() {
  const [screen, setScreen] = useState<0 | 1 | 2 | 3>(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [qi, setQi] = useState(0);
  const [votes, setVotes] = useState<Record<string, -1 | 0 | 1>>({});
  const [openArg, setOpenArg] = useState<string | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const openWaitlist = useCallback(() => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setWaitlistOpen(true);
  }, []);
  const closeWaitlist = useCallback(() => {
    setWaitlistOpen(false);
    setEmailError("");
  }, []);

  // Keyboard: arrow-key screen nav; Escape closes the modal (and ignores arrows while open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (waitlistOpen) {
        if (e.key === "Escape") closeWaitlist();
        return;
      }
      if (e.key === "ArrowRight") setScreen((s) => (Math.min(3, s + 1) as 0 | 1 | 2 | 3));
      if (e.key === "ArrowLeft") setScreen((s) => (Math.max(0, s - 1) as 0 | 1 | 2 | 3));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waitlistOpen, closeWaitlist]);

  // Cursor parallax on the orb field — imperative, and disabled under reduced motion.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: MouseEvent) => {
      const el = fieldRef.current;
      if (!el) return;
      const x = (e.clientX / window.innerWidth - 0.5) * -34;
      const y = (e.clientY / window.innerHeight - 0.5) * -24;
      el.style.transform = `translate3d(${x}px,${y}px,0)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Modal focus management: focus in on open, trap Tab, restore focus on close.
  useEffect(() => {
    if (!waitlistOpen) return;
    const panel = modalRef.current;
    if (!panel) return;
    const focusables = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled"));
    const first = focusables()[0];
    first?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => {
      panel.removeEventListener("keydown", onKeyDown);
      lastFocusRef.current?.focus?.();
    };
  }, [waitlistOpen, joined]);

  const question = QUESTIONS[qi % QUESTIONS.length];
  const tally = TALLIES[answer ?? "unsure"];
  const tallyRows = useMemo(
    () => [
      { label: "Agree", pct: tally[0], color: "var(--orange)" },
      { label: "Unsure", pct: tally[1], color: "var(--text-60)" },
      { label: "Disagree", pct: tally[2], color: "var(--teal-deep)" },
    ],
    [tally],
  );

  const join = async () => {
    if (joining) return;
    if (!/.+@.+\..+/.test(email)) {
      setEmailError("Enter an email we can reach you at.");
      return;
    }
    setJoining(true);
    setEmailError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setJoined(true);
      } else {
        setEmailError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const anotherQuestion = () => {
    setAnswer(null);
    setQi((n) => n + 1);
  };

  const vote = (id: string, dir: 1 | -1) => {
    setVotes((v) => ({ ...v, [id]: v[id] === dir ? 0 : dir }));
    setOpenArg(id);
  };
  const toggleArg = (id: string) => setOpenArg((cur) => (cur === id ? null : id));

  return (
    <div className={styles.root}>
      {/* Background field */}
      <div ref={fieldRef} className={styles.field} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
      </div>
      <div className={styles.vignette} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <button className={styles.wordmark} onClick={() => setScreen(0)} aria-label="Vayam home">
          <span className={styles.wordmarkName}>vayam</span>
          <span className={styles.wordmarkWe}>we</span>
        </button>
        <nav className={styles.nav} aria-label="Primary">
          {NAV_ITEMS.map((label, i) => {
            const active = screen === i;
            return (
              <button
                key={label}
                className={styles.navBtn}
                onClick={() => setScreen(i as 0 | 1 | 2 | 3)}
                aria-current={active ? "page" : undefined}
              >
                {label}
                {active ? <span className={styles.navUnderline} /> : null}
              </button>
            );
          })}
          <button className={styles.cta} onClick={openWaitlist}>
            Join the waitlist<span className={styles.mono}>→</span>
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className={styles.main}>
        {screen === 0 ? <HomeScreen onAnswer={() => setScreen(1)} onWaitlist={openWaitlist} /> : null}

        {screen === 1 ? (
          <section className={`${styles.screen} ${styles.screenTurn}`}>
            <p className={styles.eyebrow}>the turn · ≠</p>
            <h1 className={styles.turnH1}>
              How much of what you believe did you <em>actually</em> choose?
            </h1>
            <p className={styles.screenBody}>
              Somewhere between what you were taught, what you experienced, and what you found
              online—you formed a way of seeing the world. What if you could see beyond it?
            </p>

            <div className={styles.card}>
              <p className={styles.cardStatus}>● awaiting your response</p>
              <h2 className={styles.questionH2}>{question.q}</h2>
              <div className={styles.chips} role="radiogroup" aria-label="Your answer">
                {CHIP_OPTIONS.map((opt) => {
                  const selected = answer === opt.key;
                  return (
                    <button
                      key={opt.key}
                      className={`${styles.chip} ${selected ? styles.chipSelected : ""}`}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAnswer(opt.key)}
                    >
                      <span className={styles.mono}>{opt.glyph}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {answer ? (
              <div className={styles.results}>
                <div className={styles.perspCard}>
                  <p className={styles.cardEyebrow}>≠ a different lived experience</p>
                  <p className={styles.perspQuote}>{question.persp[answer]}</p>
                  <p className={styles.perspWho}>{WHO[answer]}</p>
                </div>
                <div className={styles.tallyCard}>
                  <div>
                    <p className={styles.cardEyebrow}>§ where the room stands</p>
                    {tallyRows.map((row) => (
                      <div key={row.label} className={styles.tallyRow}>
                        <div className={styles.tallyHead}>
                          <span>{row.label}</span>
                          <span className={styles.mono}>{row.pct}</span>
                        </div>
                        <div className={styles.tallyTrack}>
                          <div
                            className={styles.tallyFill}
                            style={{ width: row.pct, background: row.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.btnRow2}>
                    <button className={styles.primaryPill} onClick={openWaitlist}>
                      Explain your reasoning<span className={styles.mono}>→</span>
                    </button>
                    <button className={styles.secondaryPill} onClick={anotherQuestion}>
                      Another question
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <p className={styles.closingNote}>
              You answer first. Vayam then introduces perspectives you may not have considered — and
              treats uncertainty as a legitimate position.
            </p>

            <div className={styles.sectionBreak}>
              <p className={styles.eyebrow}>and then · vayam wrapped · ~</p>
              <h2 className={styles.wrappedH2}>Every turn you take becomes a mirror.</h2>
              <p className={styles.wrappedBody}>
                The perspectives you meet don’t disappear. Vayam keeps a private record of how your
                thinking moved — personalised insights into your behaviour, beliefs, and the moments
                you changed your mind.
              </p>
              <div className={styles.statGrid}>
                {WRAPPED_STATS.map((s) => (
                  <div
                    key={s.num + s.cap}
                    className={styles.statCard}
                    style={s.bg ? { background: s.bg } : undefined}
                  >
                    <p className={styles.statNum}>{s.num}</p>
                    <p className={styles.statCap}>{s.cap}</p>
                  </div>
                ))}
              </div>
              <p className={styles.disclaimer}>
                sample · your wrapped is yours alone until you share it
              </p>
            </div>
          </section>
        ) : null}

        {screen === 2 ? (
          <section className={`${styles.screen} ${styles.screenCI}`}>
            <p className={styles.eyebrow}>collective intelligence · §</p>
            <h2 className={styles.ciH2}>No single person has the complete picture.</h2>
            <p className={styles.ciBody}>
              One question, a thousand answers. Someone proposes a solution, people argue its pros
              and cons, and every argument gets voted up or down — but a vote alone tells you
              nothing, so each one can carry the experience, belief, disagreement or question behind
              it. Open any pro or con to see what people put behind their vote.
            </p>

            <div className={styles.counterGrid}>
              {CI_COUNTERS.map((c) => (
                <div key={c.cap} className={styles.counterCell}>
                  <p className={styles.counterNum} style={{ color: c.color }}>
                    {c.num}
                  </p>
                  <p className={styles.counterCap}>{c.cap}</p>
                </div>
              ))}
            </div>

            <div className={styles.flowStrip}>
              {CI_FLOW.map((f) => (
                <p key={f.n} className={styles.flowItem}>
                  <span className={f.active ? styles.flowNumActive : styles.flowNum}>{f.n}</span>
                  <br />
                  {f.text}
                </p>
              ))}
            </div>

            {SOLUTIONS.map((sol) => (
              <div key={sol.id} className={styles.solution}>
                <div className={styles.solHeader}>
                  <p className={styles.solEyebrow}>→ proposed solution · {sol.backing} backing</p>
                  <p className={styles.solTitle}>{sol.title}</p>
                </div>
                {sol.args.map((arg) => {
                  const v = votes[arg.id] ?? 0;
                  const isPro = arg.kind === "pro";
                  const open = openArg === arg.id;
                  return (
                    <div key={arg.id} className={styles.argWrap}>
                      <div className={styles.argRow}>
                        <span
                          className={`${styles.tag} ${isPro ? styles.tagPro : styles.tagCon}`}
                        >
                          {arg.kind}
                        </span>
                        <p className={styles.argText}>{arg.text}</p>
                        <div className={styles.argControls}>
                          <button
                            className={styles.voteBtn}
                            aria-pressed={v === 1}
                            aria-label={`Upvote: ${arg.text}`}
                            onClick={() => vote(arg.id, 1)}
                            style={{
                              background: v === 1 ? "rgba(255,90,31,0.16)" : "transparent",
                              border: `1px solid ${v === 1 ? "var(--orange)" : "rgba(242,238,232,0.18)"}`,
                              color: v === 1 ? "var(--orange-light)" : "var(--text-62)",
                            }}
                          >
                            ▲ {arg.up + (v === 1 ? 1 : 0)}
                          </button>
                          <button
                            className={styles.voteBtn}
                            aria-pressed={v === -1}
                            aria-label={`Downvote: ${arg.text}`}
                            onClick={() => vote(arg.id, -1)}
                            style={{
                              background: v === -1 ? "rgba(31,122,114,0.16)" : "transparent",
                              border: `1px solid ${v === -1 ? "var(--teal)" : "rgba(242,238,232,0.18)"}`,
                              color: v === -1 ? "var(--teal-light)" : "var(--text-62)",
                            }}
                          >
                            ▼ {arg.down + (v === -1 ? 1 : 0)}
                          </button>
                          <button
                            className={styles.toggleBtn}
                            aria-expanded={open}
                            onClick={() => toggleArg(arg.id)}
                          >
                            {open ? "hide" : `${arg.contrib.length} behind this`}
                          </button>
                        </div>
                      </div>
                      {open ? (
                        <div className={styles.expanded}>
                          <p className={styles.expandedEyebrow}>attached to this {arg.kind}</p>
                          {arg.contrib.map((c) => (
                            <div key={c.text} className={styles.contribRow}>
                              <span
                                className={styles.contribKind}
                                style={{ color: KIND_COLOR[c.kind] ?? "var(--text-60)" }}
                              >
                                {c.glyph} {c.kind}
                              </span>
                              <p className={styles.contribText}>{c.text}</p>
                            </div>
                          ))}
                          <button className={styles.addYours} onClick={openWaitlist}>
                            Add yours<span className={styles.mono}>→</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}

            <p className={styles.closingNote}>
              Nothing here is a popularity contest. A vote without reasoning is just noise — so every
              vote can carry the experience behind it.
            </p>
          </section>
        ) : null}

        {screen === 3 ? (
          <section className={`${styles.screen} ${styles.screenValues}`}>
            <p className={styles.eyebrow}>what vayam feels like · ◐</p>
            <div className={styles.valuesGrid}>
              <div className={styles.valuesCol}>
                {VALUES_LEFT.map(([lead, not]) => (
                  <p key={not} className={styles.valuesRow}>
                    {lead}
                    <em>{not}</em>
                  </p>
                ))}
              </div>
              <div className={styles.valuesCol}>
                {VALUES_RIGHT.map(([lead, not]) => (
                  <p key={not} className={styles.valuesRow}>
                    {lead}
                    <em>{not}</em>
                  </p>
                ))}
              </div>
            </div>
            <div className={styles.valuesClose}>
              <p className={styles.pullQuote}>
                Question ideas, not people. Disagreement is welcome; disrespect is not.
              </p>
              <div>
                <p className={styles.valuesPara}>
                  Better societies do not come from everyone thinking the same way. They come from
                  people willing to understand themselves, encounter perspectives different from their
                  own, and build better ideas together.
                </p>
                <button className={styles.primaryPill} onClick={openWaitlist}>
                  Join the waitlist<span className={styles.mono}>→</span>
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      {/* Footer bar */}
      <div className={styles.footer}>
        <span>see clear, contribute better</span>
        <span>{String(screen + 1).padStart(2, "0")} / 04 · ← → to move</span>
      </div>

      {/* Waitlist modal */}
      {waitlistOpen ? (
        <div
          className={styles.scrim}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeWaitlist();
          }}
        >
          <div
            ref={modalRef}
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={joined ? "You're on the list" : "Join the waitlist"}
          >
            <button className={styles.modalClose} onClick={closeWaitlist} aria-label="Close">
              ×
            </button>
            {joined ? (
              <div>
                <p className={`${styles.modalEyebrow} ${styles.modalEyebrowJoined}`}>
                  ◐ you’re on the list
                </p>
                <h3 className={styles.modalH3}>We’ll send you one question.</h3>
                <p className={styles.modalBody}>
                  That’s the whole invitation. Answer it, and Vayam will show you someone who sees it
                  differently.
                </p>
                <button className={styles.closeBtn} onClick={closeWaitlist}>
                  Close
                </button>
              </div>
            ) : (
              <div>
                <p className={styles.modalEyebrow}>● early access</p>
                <h3 className={styles.modalH3}>Be one of the first to answer.</h3>
                <p className={styles.modalBody}>{WAITLIST_NOTE}</p>
                <div className={styles.modalRow}>
                  <input
                    className={styles.input}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") join();
                    }}
                    placeholder="you@email.com"
                    type="email"
                    aria-label="Email address"
                    aria-invalid={Boolean(emailError)}
                  />
                  <button className={styles.joinBtn} onClick={join} disabled={joining}>
                    Join
                  </button>
                </div>
                <p className={styles.errorLine} role="alert">
                  {emailError}
                </p>
                <p className={styles.footnote}>no feed, no followers, no noise</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home screen (screen 0)
// ---------------------------------------------------------------------------

function HomeScreen({
  onAnswer,
  onWaitlist,
}: {
  onAnswer: () => void;
  onWaitlist: () => void;
}) {
  return (
    <section className={`${styles.screen} ${styles.screenHome}`}>
      <h1 className={styles.heroH1}>No one sees the whole picture alone.</h1>
      <div className={styles.introGrid}>
        <p className={styles.heroBody}>
          Vayam harnesses collective intelligence to help people discover new perspectives, question
          ideas, and collaborate to build better ones together.
        </p>
        <div className={styles.rightCol}>
          <p className={styles.monoLines}>
            less performance, more reflection
            <br />
            less noise, more understanding
          </p>
          <div className={styles.btnRow}>
            <button className={styles.answerBtn} onClick={onAnswer}>
              Answer one question<span className={styles.pulse}>●</span>
            </button>
            <button className={styles.ghostBtn} onClick={onWaitlist}>
              Join the waitlist
            </button>
          </div>
        </div>
      </div>
      <div className={styles.stepGrid}>
        {HOME_STEPS.map((step, i) => (
          <div
            key={step.label}
            className={`${styles.stepCell} ${i === 0 ? styles.stepCellFirst : ""}`}
          >
            <p className={`${styles.stepLabel} ${step.active ? styles.stepLabelActive : ""}`}>
              {step.label}
            </p>
            <p className={styles.stepBody}>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
