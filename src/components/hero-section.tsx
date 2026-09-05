"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type HeroChoice = "clear" | "unthought" | "unsure";
type SecondChoice = "agree" | "different" | "unsure";
type ReflectionChoice = "think" | "different" | "context";

type Statement = {
  mark: string;
  text: string;
  participant: string;
  label: string;
};

type Position = {
  x: number;
  y: number;
  w: number;
};

const heroOptions: Array<{ id: HeroChoice; mark: string; label: string }> = [
  { id: "clear", mark: "●", label: "I know my answer" },
  { id: "unthought", mark: "○", label: "I've never really thought about it" },
  { id: "unsure", mark: "◐", label: "Honestly, unsure" },
];

const firstTurnPerspectives: Record<
  HeroChoice,
  Array<{ mark: string; text: string; participant: string }>
> = {
  clear: [
    {
      mark: "≠",
      text: "A serious corruption case would probably make me reconsider. But I don't know whether I'd actually switch.",
      participant: "participant 41",
    },
  ],
  unthought: [
    {
      mark: "~",
      text: "The candidate would matter more than the party. I just haven't made time to look that closely.",
      participant: "participant 18",
    },
  ],
  unsure: [
    {
      mark: "~",
      text: "For me the candidate matters more than the party.",
      participant: "participant 07",
    },
    {
      mark: "≠",
      text: "If another party actually addressed what my family deals with daily, I would at least listen.",
      participant: "participant 26",
    },
  ],
};

const developmentStatements: Statement[] = [
  {
    mark: "~",
    text: "My family has always voted this way.",
    participant: "participant 03",
    label: "~ Lived experience",
  },
  {
    mark: "◐",
    text: "I don't know anything about my local candidate.",
    participant: "participant 22",
    label: "◐ Uncertainty",
  },
  {
    mark: "~",
    text: "I mostly care about what affects my family.",
    participant: "participant 47",
    label: "~ Lived experience",
  },
  {
    mark: "◐",
    text: "I don't trust any of them.",
    participant: "participant 11",
    label: "Belief",
  },
  {
    mark: "≠",
    text: "Religion matters to me when I vote.",
    participant: "participant 36",
    label: "Belief",
  },
  {
    mark: "≠",
    text: "I don't think religion should matter at all.",
    participant: "participant 52",
    label: "≠ Counter-perspective",
  },
  {
    mark: "→",
    text: "I wish I knew more about the candidate, not just the party.",
    participant: "participant 14",
    label: "→ Idea",
  },
  {
    mark: "?",
    text: "How do I even check whether a representative did what they promised?",
    participant: "participant 29",
    label: "? Question",
  },
];

const desktopPositions: Position[][] = [
  [
    { x: 0, y: 0, w: 56 },
    { x: 25, y: 86, w: 58 },
    { x: 8, y: 174, w: 52 },
    { x: 39, y: 260, w: 48 },
    { x: 0, y: 348, w: 45 },
    { x: 45, y: 430, w: 50 },
    { x: 10, y: 520, w: 64 },
    { x: 31, y: 616, w: 55 },
  ],
  [
    { x: 0, y: 0, w: 50 },
    { x: 36, y: 112, w: 55 },
    { x: 6, y: 102, w: 52 },
    { x: 34, y: 246, w: 48 },
    { x: 0, y: 390, w: 44 },
    { x: 51, y: 390, w: 46 },
    { x: 12, y: 532, w: 62 },
    { x: 28, y: 636, w: 58 },
  ],
  [
    { x: 68, y: 46, w: 28 },
    { x: 5, y: 440, w: 42 },
    { x: 68, y: 140, w: 28 },
    { x: 5, y: 532, w: 42 },
    { x: 5, y: 228, w: 40 },
    { x: 56, y: 228, w: 40 },
    { x: 5, y: 46, w: 55 },
    { x: 5, y: 642, w: 58 },
  ],
];

const mobilePositions: Position[][] = [
  [
    { x: 0, y: 0, w: 92 },
    { x: 8, y: 126, w: 90 },
    { x: 0, y: 254, w: 90 },
    { x: 10, y: 382, w: 88 },
    { x: 0, y: 508, w: 88 },
    { x: 9, y: 636, w: 89 },
    { x: 0, y: 766, w: 94 },
    { x: 6, y: 914, w: 92 },
  ],
  [
    { x: 0, y: 0, w: 92 },
    { x: 6, y: 136, w: 90 },
    { x: 0, y: 272, w: 92 },
    { x: 8, y: 408, w: 88 },
    { x: 0, y: 550, w: 88 },
    { x: 9, y: 690, w: 88 },
    { x: 0, y: 830, w: 94 },
    { x: 5, y: 984, w: 92 },
  ],
  [
    { x: 0, y: 152, w: 92 },
    { x: 0, y: 688, w: 92 },
    { x: 0, y: 284, w: 92 },
    { x: 0, y: 814, w: 92 },
    { x: 0, y: 432, w: 92 },
    { x: 0, y: 558, w: 92 },
    { x: 0, y: 42, w: 92 },
    { x: 0, y: 996, w: 92 },
  ],
];

const phaseLabels = [
  "The conversation appears",
  "The same statements get understood",
  "The statements reorganize",
];

const secondOptions: Array<{ id: SecondChoice; mark: string; label: string }> = [
  { id: "agree", mark: "●", label: "I agree" },
  { id: "different", mark: "○", label: "I see it differently" },
  { id: "unsure", mark: "◐", label: "I'm not sure" },
];

const reflectionOptions: Array<{ id: ReflectionChoice; label: string }> = [
  { id: "think", label: "Made me think" },
  { id: "different", label: "I still see it differently" },
  { id: "context", label: "I need more context" },
];

const trustLines = [
  "No political advertising.",
  "No candidate recommendations.",
  "Your political responses are not a public profile.",
  "Disagreement is allowed.",
  'So is "I don\'t know."',
];

function responseClass(hasAnswered: boolean, isSelected: boolean) {
  const color = !hasAnswered
    ? "text-[#E2570F] hover:text-[#B8430A]"
    : isSelected
      ? "text-[#201D1A]"
      : "text-[#8A857D] hover:text-[#201D1A]";

  return [
    "min-h-11 rounded-sm text-left text-base font-medium leading-snug transition-colors",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]",
    "motion-reduce:transition-none",
    color,
  ].join(" ");
}

function StatementLine({
  mark,
  text,
  participant,
  label,
  className = "",
}: Statement & { className?: string }) {
  return (
    <article
      className={`relative border-t border-[#DAD7D1] pl-8 pt-3 sm:pr-28 ${className}`}
    >
      <span
        className="absolute left-0 top-3 text-lg font-semibold text-[#201D1A]"
        aria-hidden="true"
      >
        {mark}
      </span>
      <p className="text-[1.08rem] leading-8 text-[#201D1A] [font-family:var(--vayam-serif)] sm:text-lg">
        &ldquo;{text}&rdquo;
      </p>
      {label ? (
        <p className="mt-2 text-sm font-medium text-[#8A857D]">{label}</p>
      ) : null}
      <span className="mt-2 block text-xs font-medium text-[#8A857D] sm:absolute sm:right-0 sm:top-3 sm:mt-0">
        {participant}
      </span>
    </article>
  );
}

function TurnThought({
  mark,
  text,
  participant,
}: {
  mark: string;
  text: string;
  participant: string;
}) {
  return (
    <StatementLine
      mark={mark}
      text={text}
      participant={participant}
      label=""
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    />
  );
}

function useMediaQuery(query: string, initial = false) {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatches(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

function DiscussionDevelopment() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState(0);
  const isCompact = useMediaQuery("(max-width: 767px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const activePhase = reduceMotion ? 2 : phase;
  const positions = (isCompact ? mobilePositions : desktopPositions)[activePhase];

  useEffect(() => {
    if (reduceMotion) {
      setPhase(2);
      return;
    }

    const updatePhase = () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const track = Math.max(rect.height - viewportHeight, 1);
      const progress = Math.min(
        1,
        Math.max(0, (viewportHeight * 0.48 - rect.top) / track),
      );
      const nextPhase = progress < 0.34 ? 0 : progress < 0.68 ? 1 : 2;

      setPhase((current) => (current === nextPhase ? current : nextPhase));
    };

    updatePhase();
    window.addEventListener("scroll", updatePhase, { passive: true });
    window.addEventListener("resize", updatePhase);

    return () => {
      window.removeEventListener("scroll", updatePhase);
      window.removeEventListener("resize", updatePhase);
    };
  }, [reduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="discussions"
      className="relative border-t border-[#DAD7D1] bg-white py-12 md:min-h-[220vh] md:py-0"
      aria-labelledby="discussion-development-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 md:sticky md:top-16 md:min-h-[calc(100svh-4rem)] md:py-10">
        <div className="flex flex-col gap-2 border-b border-[#DAD7D1] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8A857D]">
              Two people who answered this:
            </p>
            <h2
              id="discussion-development-title"
              className="mt-1 text-xl font-semibold text-[#201D1A]"
            >
              {phaseLabels[activePhase]}
            </h2>
          </div>
          <p className="text-sm font-medium text-[#8A857D]">
            same thoughts, different order
          </p>
        </div>

        <div className="relative mt-8 h-[1130px] md:h-[720px]">
          {activePhase === 2 ? (
            <>
              <p className="absolute left-0 top-0 text-sm font-semibold text-[#201D1A] md:left-[5%]">
                Where people seem to agree
              </p>
              <p className="absolute left-0 top-[390px] text-sm font-semibold text-[#201D1A] md:left-[5%] md:top-[184px]">
                Where people see it differently
              </p>
              <span
                className="absolute left-[2px] top-[526px] text-lg font-semibold text-[#201D1A] md:left-[49%] md:top-[266px]"
                aria-hidden="true"
              >
                ≠
              </span>
              <p className="absolute left-0 top-[648px] text-sm font-semibold text-[#201D1A] md:left-[5%] md:top-[396px]">
                What people aren&apos;t sure about
              </p>
              <p className="absolute left-0 top-[956px] text-sm font-semibold text-[#201D1A] md:left-[5%] md:top-[598px]">
                Questions emerging
              </p>
            </>
          ) : null}

          {developmentStatements.map((statement, index) => {
            const position = positions[index];
            const style = {
              left: `${position.x}%`,
              top: `${position.y}px`,
              width: `${position.w}%`,
            } satisfies CSSProperties;

            return (
              <div
                key={statement.text}
                className="absolute transition-[left,top,width] duration-500 ease-out motion-reduce:transition-none"
                style={style}
              >
                <StatementLine
                  mark={statement.mark}
                  text={statement.text}
                  participant={statement.participant}
                  label={activePhase >= 1 ? statement.label : ""}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FirstQuestion() {
  const [choice, setChoice] = useState<HeroChoice | null>(null);
  const [showTurn, setShowTurn] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyText, setWhyText] = useState("");
  const [whySubmitted, setWhySubmitted] = useState(false);

  useEffect(() => {
    if (!choice) {
      return;
    }

    setShowTurn(false);
    const timer = window.setTimeout(() => setShowTurn(true), 350);

    return () => window.clearTimeout(timer);
  }, [choice]);

  const submitReason = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWhySubmitted(true);
    setWhyOpen(false);
    setWhyText("");
  };

  return (
    <section className="mx-auto min-h-[calc(100svh-4rem)] max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="max-w-5xl">
        <h1 className="max-w-5xl text-[clamp(2.7rem,7vw,5.8rem)] font-bold leading-[0.98] tracking-normal text-[#E2570F]">
          What would actually make you change the party you currently support?
        </h1>

        <div
          className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3"
          aria-label="Answer the opening question"
        >
          {heroOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={responseClass(Boolean(choice), choice === option.id)}
              onClick={() => {
                setChoice(option.id);
                setWhyOpen(false);
                setWhySubmitted(false);
              }}
            >
              <span aria-hidden="true">{option.mark}</span> {option.label}
            </button>
          ))}
        </div>

        {choice && showTurn ? (
          <div
            className="mt-12 max-w-5xl"
            aria-live="polite"
            aria-label="A human perspective arrived"
          >
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
              <div className="border-t border-[#DAD7D1] pt-3">
                <p className="text-sm font-medium text-[#8A857D]">
                  You answered
                </p>
                <p className="mt-2 text-lg font-semibold text-[#201D1A]">
                  {heroOptions.find((option) => option.id === choice)?.mark}{" "}
                  {heroOptions.find((option) => option.id === choice)?.label}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-[#8A857D]">
                  {choice === "unsure"
                    ? "Two people answered from different directions:"
                    : "Someone who answered differently:"}
                </p>
                <div className="grid gap-5">
                  {firstTurnPerspectives[choice].map((thought) => (
                    <TurnThought
                      key={thought.text}
                      mark={thought.mark}
                      text={thought.text}
                      participant={thought.participant}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 max-w-2xl">
              {!whyOpen && !whySubmitted ? (
                <button
                  type="button"
                  className="rounded-sm text-sm font-medium text-[#8A857D] underline-offset-4 hover:text-[#201D1A] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
                  onClick={() => setWhyOpen(true)}
                >
                  Want to say why?
                </button>
              ) : null}

              {whyOpen ? (
                <form className="grid gap-3" onSubmit={submitReason}>
                  <label className="sr-only" htmlFor="opening-reason">
                    Say why
                  </label>
                  <textarea
                    id="opening-reason"
                    value={whyText}
                    onChange={(event) => setWhyText(event.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-[#DAD7D1] bg-white p-3 text-base text-[#201D1A] shadow-none outline-none placeholder:text-[#8A857D] focus:border-[#201D1A] focus:ring-0"
                    placeholder="Add what you see"
                  />
                  <button
                    type="submit"
                    disabled={!whyText.trim()}
                    className="min-h-11 justify-self-start rounded-sm border border-[#201D1A] px-4 text-sm font-semibold text-[#201D1A] transition-colors hover:bg-[#F6F5F2] disabled:border-[#DAD7D1] disabled:text-[#8A857D]"
                  >
                    Add what you see
                  </button>
                </form>
              ) : null}

              {whySubmitted ? (
                <p className="text-sm font-medium text-[#8A857D]" aria-live="polite">
                  Noted. It&apos;ll join the discussion.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function VayamIntro() {
  return (
    <section
      id="why-vayam"
      className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <h2 className="text-3xl font-semibold leading-tight text-[#201D1A] sm:text-5xl">
          Vayam means we.
        </h2>
        <div className="max-w-2xl space-y-5 text-lg leading-8 text-[#201D1A]">
          <p>
            A discussion here doesn&apos;t end at a comment thread. People bring
            what they know, what they&apos;ve lived, what they believe and what
            they aren&apos;t sure about.
          </p>
          <p>
            Vayam tries to help make sense of what emerges: where people agree,
            where they see it differently, and what none of us understands yet.
          </p>
        </div>
      </div>
    </section>
  );
}

function PerspectiveTurn({
  onNeedContext,
}: {
  onNeedContext: () => void;
}) {
  const [choice, setChoice] = useState<SecondChoice | null>(null);
  const [showTurn, setShowTurn] = useState(false);
  const [reflection, setReflection] = useState<ReflectionChoice | null>(null);

  useEffect(() => {
    if (!choice) {
      return;
    }

    setShowTurn(false);
    setReflection(null);
    const timer = window.setTimeout(() => setShowTurn(true), 350);

    return () => window.clearTimeout(timer);
  }, [choice]);

  const handleReflection = (nextChoice: ReflectionChoice) => {
    setReflection(nextChoice);

    if (nextChoice === "context") {
      onNeedContext();
    }
  };

  return (
    <section className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="mb-4 text-sm font-medium text-[#8A857D]">
              Another way of seeing it
            </p>
            <StatementLine
              mark="~"
              text="Religion should have no role in deciding who we vote for."
              participant="participant 52"
              label=""
            />
          </div>

          <div>
            <div
              className="grid gap-4 sm:grid-cols-3"
              aria-label="Respond to this perspective"
            >
              {secondOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={responseClass(Boolean(choice), choice === option.id)}
                  onClick={() => setChoice(option.id)}
                >
                  <span aria-hidden="true">{option.mark}</span> {option.label}
                </button>
              ))}
            </div>

            {choice && showTurn ? (
              <div className="mt-10" aria-live="polite">
                <p className="mb-3 text-sm font-medium text-[#8A857D]">
                  Another way someone sees it:
                </p>
                <TurnThought
                  mark="~"
                  text="For some families, religion isn't separate from community safety or identity. They aren't voting because someone told them to."
                  participant="participant 36"
                />

                <div className="mt-8">
                  <p className="text-lg font-semibold text-[#201D1A]">
                    Did that add anything?
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {reflectionOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={responseClass(
                          Boolean(reflection),
                          reflection === option.id,
                        )}
                        onClick={() => handleReflection(option.id)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {reflection ? (
                  <p className="mt-8 text-sm font-medium text-[#8A857D] md:text-right">
                    ● 214&nbsp;&nbsp;○ 189&nbsp;&nbsp;◐ 87
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function LearnSection({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <section
      id="learn"
      className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="learn-title"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="learn-title"
          className={`max-w-4xl text-[clamp(2.3rem,6vw,5rem)] font-bold leading-[1.02] tracking-normal ${
            open ? "text-[#201D1A]" : "text-[#E2570F]"
          }`}
        >
          ? What can an MLA actually do?
        </h2>

        <div className="mt-8">
          <p className="text-lg font-semibold text-[#201D1A]">Not sure?</p>
          <button
            type="button"
            className={responseClass(open, open)}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
          >
            Understand this in 2 minutes →
          </button>
        </div>

        {open ? (
          <div className="mt-10 max-w-3xl space-y-5 border-t border-[#DAD7D1] pt-5 text-base leading-7 text-[#201D1A]">
            <p>
              <strong>MLA</strong> - Member of the Legislative Assembly. Your
              representative in the state legislature.
            </p>
            <p>
              <strong>Responsible for:</strong> making state laws, raising local
              issues in the Assembly, constituency development funds, questioning
              the state government.
            </p>
            <p>
              <strong>Not responsible for:</strong> national laws, municipal
              garbage collection, most local road repairs - those belong to other
              levels.
            </p>
            <p className="text-sm font-semibold text-[#8A857D]">
              § Read the sources →
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FindingsSection() {
  return (
    <section className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-4xl text-[clamp(2.3rem,6vw,5rem)] font-bold leading-[1.02] tracking-normal text-[#201D1A]">
          So what did we learn?
        </h2>

        <ol className="mt-12 grid gap-8">
          <li className="grid gap-3 border-t border-[#DAD7D1] pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-3xl text-xl font-semibold leading-8 text-[#201D1A]">
              1. Most participants want more information about individual
              candidates.
            </p>
            <p className="text-sm font-medium text-[#8A857D] md:pt-2">
              ● 214&nbsp;&nbsp;○ 38&nbsp;&nbsp;◐ 71
            </p>
          </li>
          <li className="grid gap-3 border-t border-[#DAD7D1] pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-3xl text-xl font-semibold leading-8 text-[#201D1A]">
              2. People disagree strongly about whether party identity should
              matter more than candidate performance.
            </p>
          </li>
          <li className="grid gap-3 border-t border-[#DAD7D1] pt-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <p className="max-w-3xl text-xl font-semibold leading-8 text-[#201D1A]">
              3. Many people aren&apos;t sure where to find reliable candidate
              information.
            </p>
            <p className="text-sm font-medium text-[#8A857D] md:pt-2">◐</p>
          </li>
        </ol>

        <div className="mt-14 border-t border-[#DAD7D1] pt-5">
          <p className="text-sm font-semibold text-[#8A857D]">Still open</p>
          <p className="mt-3 max-w-3xl text-2xl font-semibold leading-tight text-[#201D1A] sm:text-4xl">
            ? What information would actually change someone&apos;s vote?
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold leading-tight text-[#201D1A] sm:text-5xl">
            We&apos;re starting with voting.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#201D1A]">
            Vayam&apos;s first discussions are with young Indians, about how we
            make political choices. Not to tell anyone who to vote for. We want
            to see whether having somewhere to question what we believe,
            understand what others see, and learn what we don&apos;t know can help
            some of us think a little more deliberately before the next election.
          </p>
        </div>

        <div>
          {trustLines.map((line) => (
            <p
              key={line}
              className="border-t border-[#DAD7D1] py-4 text-xl font-semibold leading-7 text-[#201D1A]"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function FounderSection() {
  return (
    <section className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="max-w-3xl text-2xl leading-[1.45] text-[#201D1A] sm:text-3xl">
          I started wondering about this because I became an adult and a citizen
          and realised I didn&apos;t really understand what either was supposed to
          mean. I was educated. I had access to information. But access
          wasn&apos;t understanding. Vayam started somewhere inside that confusion.
        </p>
      </div>
    </section>
  );
}

function ClosingQuestion() {
  return (
    <section className="border-t border-[#DAD7D1] bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-5xl text-[clamp(2.7rem,7vw,5.8rem)] font-bold leading-[0.98] tracking-normal text-[#E2570F]">
          How much of what you believe did you actually choose?
        </h2>

        <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-sm bg-[#E2570F] px-5 text-base font-semibold text-white transition-colors hover:bg-[#B8430A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
          >
            Answer one question →
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-sm text-base font-semibold text-[#201D1A] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
          >
            Just explore
          </Link>
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  const [learnOpen, setLearnOpen] = useState(false);

  return (
    <main>
      <FirstQuestion />
      <DiscussionDevelopment />
      <VayamIntro />
      <PerspectiveTurn onNeedContext={() => setLearnOpen(true)} />
      <LearnSection open={learnOpen} setOpen={setLearnOpen} />
      <FindingsSection />
      <TrustSection />
      <FounderSection />
      <ClosingQuestion />
    </main>
  );
}
