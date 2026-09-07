"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type DemoChoice = "effort" | "circumstance" | "both" | "depends" | "unsure";
type TurnState = "alone" | "beside";
type FragmentKind = "agree" | "difference" | "uncertainty" | "question" | "idea";

type Position = {
  left: number;
  top: number;
  width: number;
};

type ThoughtFragment = {
  mark: string;
  text: string;
  kind: FragmentKind;
  label: string;
  positions: Position[];
};

type SolutionContribution = {
  type: string;
  mark: string;
  text: string;
  group: "learning" | "missing" | "ideas" | "building";
};

const ink = "text-[#F4EFE7]";
const muted = "text-[#9CA59D]";
const rule = "border-white/[0.13]";
const live = "text-[#F0863F]";
const teal = "text-[#9DBFB7]";

// Cinematic atmosphere: a single luminous bloom (warm orange → teal → cool blue)
// over near-black. Used sparingly as a signature on the hero and brand moments.
const heroAtmosphere: CSSProperties = {
  backgroundColor: "#0A0D0B",
  backgroundImage: [
    "radial-gradient(68% 82% at 9% 4%, rgba(247,168,92,0.40) 0%, rgba(224,110,40,0.20) 26%, rgba(150,62,28,0.07) 48%, transparent 68%)",
    "radial-gradient(80% 100% at 100% 58%, rgba(72,150,132,0.30) 0%, rgba(40,86,78,0.14) 42%, transparent 72%)",
    "radial-gradient(95% 80% at 62% 122%, rgba(28,56,72,0.38) 0%, transparent 60%)",
    "linear-gradient(158deg, #0B0F0C 0%, #0A0D0B 55%, #0C0A08 100%)",
  ].join(", "),
};

// Soft focal bloom for the big brand climax (cool-leaning, like a distant light).
const brandGlow: CSSProperties = {
  backgroundImage:
    "radial-gradient(52% 64% at 46% 40%, rgba(224,110,40,0.15) 0%, rgba(72,150,132,0.10) 38%, rgba(28,56,72,0.06) 58%, transparent 74%)",
};

// Warm bloom to return the closing CTA to the hero's energy.
const warmGlow: CSSProperties = {
  backgroundImage:
    "radial-gradient(58% 68% at 20% 34%, rgba(224,110,40,0.17) 0%, rgba(150,62,28,0.07) 40%, transparent 70%)",
};

const heroSupportingCopy =
  "Somewhere between what you were taught, what you experienced, and what you found online—you formed a way of seeing the world.";

const influenceWords = [
  { label: "Family.", from: { left: 4, top: 16 }, to: { left: 28, top: 38 } },
  { label: "Friends.", from: { left: 68, top: 18 }, to: { left: 45, top: 30 } },
  { label: "Culture.", from: { left: 13, top: 62 }, to: { left: 35, top: 45 } },
  { label: "Community.", from: { left: 62, top: 67 }, to: { left: 50, top: 48 } },
  { label: "School.", from: { left: 28, top: 6 }, to: { left: 39, top: 34 } },
  { label: "The internet.", from: { left: 47, top: 75 }, to: { left: 47, top: 59 } },
  { label: "Our experiences.", from: { left: 40, top: 28 }, to: { left: 39, top: 50 } },
];

const questionOptions: Array<{ id: DemoChoice; mark: string; label: string }> = [
  { id: "effort", mark: "●", label: "Mostly effort" },
  { id: "circumstance", mark: "○", label: "Mostly circumstance" },
  { id: "both", mark: "◐", label: "Both" },
  { id: "depends", mark: "~", label: "It depends" },
  { id: "unsure", mark: "?", label: "I'm not sure" },
];

const demoResponses: Record<DemoChoice, string> = {
  effort:
    "I used to think effort was everything until I saw two people work just as hard and get completely different chances.",
  circumstance:
    "I used to think circumstance explained everything until I met someone who kept choosing the difficult thing every day.",
  both:
    "I keep coming back to both. Effort matters, but it starts from places people did not choose.",
  depends:
    "It depends on which door was already open, and what someone did once they reached it.",
  unsure:
    "I don't know yet. I think that answer changes when I look at my own life honestly.",
};

const understandingFragments: ThoughtFragment[] = [
  {
    mark: "●",
    text: "Effort matters, but not everyone starts from the same place.",
    kind: "agree",
    label: "Agreement",
    positions: [
      { left: 5, top: 8, width: 34 },
      { left: 9, top: 18, width: 38 },
      { left: 5, top: 10, width: 40 },
    ],
  },
  {
    mark: "≠",
    text: "Some people call it luck because they don't see the work.",
    kind: "difference",
    label: "Difference",
    positions: [
      { left: 52, top: 12, width: 34 },
      { left: 50, top: 44, width: 37 },
      { left: 53, top: 12, width: 38 },
    ],
  },
  {
    mark: "◐",
    text: "I can't separate my choices from what was available to me.",
    kind: "uncertainty",
    label: "Uncertainty",
    positions: [
      { left: 18, top: 36, width: 36 },
      { left: 12, top: 49, width: 36 },
      { left: 5, top: 43, width: 39 },
    ],
  },
  {
    mark: "~",
    text: "My parents' contacts changed what success looked like for me.",
    kind: "difference",
    label: "Experience changes the answer",
    positions: [
      { left: 57, top: 42, width: 32 },
      { left: 54, top: 58, width: 37 },
      { left: 53, top: 30, width: 38 },
    ],
  },
  {
    mark: "?",
    text: "What do we count as effort if survival already takes most of it?",
    kind: "question",
    label: "What we still don't understand",
    positions: [
      { left: 8, top: 67, width: 38 },
      { left: 8, top: 76, width: 43 },
      { left: 5, top: 75, width: 42 },
    ],
  },
  {
    mark: "→",
    text: "Maybe ask what support turns effort into a real chance.",
    kind: "idea",
    label: "Possibilities emerging",
    positions: [
      { left: 51, top: 70, width: 39 },
      { left: 48, top: 78, width: 40 },
      { left: 53, top: 68, width: 40 },
    ],
  },
];

const collectiveLines = [
  "One person brings experience.",
  "Another brings expertise.",
  "Someone else notices what everyone missed.",
  "Another asks the question nobody thought to ask.",
  "Different backgrounds.",
  "Different disciplines.",
  "Different lives.",
  "Different ways of thinking.",
];

const solutionSteps = [
  "Problem",
  "Perspectives",
  "Understanding",
  "Ideas",
  "Challenge",
  "Refine",
  "Collaborative solution",
];

const solutionContributions: SolutionContribution[] = [
  {
    type: "LIVED EXPERIENCE",
    mark: "~",
    text: "The problem isn't only lighting. It is also what happens while waiting.",
    group: "learning",
  },
  {
    type: "PERSPECTIVE",
    mark: "≠",
    text: "Transport after 11 PM is part of it.",
    group: "learning",
  },
  {
    type: "DATA / KNOWLEDGE",
    mark: "§",
    text: "A public dataset could show where transit points are poorly lit.",
    group: "missing",
  },
  {
    type: "QUESTION",
    mark: "?",
    text: "What happens after someone reports an incident?",
    group: "missing",
  },
  {
    type: "IDEA",
    mark: "→",
    text: "What if public spaces had staffed waiting points near transit stops?",
    group: "ideas",
  },
  {
    type: "CHALLENGE",
    mark: "≠",
    text: "Who maintains it, and who is accountable if it fails?",
    group: "building",
  },
];

const loopSteps = [
  "Question",
  "Respond",
  "Encounter",
  "Reflect",
  "Understand",
  "Think together",
  "Build together",
  "Return",
];

const capabilityStages = [
  {
    title: "QUESTION",
    copy: "Start with something worth thinking about.",
  },
  {
    title: "RESPOND",
    copy: "Say what you genuinely think—even when you're unsure.",
  },
  {
    title: "ENCOUNTER",
    copy: "Meet perspectives your own experience may never have shown you.",
  },
  {
    title: "REFLECT",
    copy: "Understand your assumptions, patterns and changing beliefs.",
  },
  {
    title: "CONNECT",
    copy: "See agreements, disagreements, uncertainties and missing context.",
  },
  {
    title: "UNDERSTAND",
    copy: "Turn individual contributions into collective understanding.",
  },
  {
    title: "BUILD",
    copy: "Use that understanding to propose, challenge and refine ideas together.",
  },
  {
    title: "EVOLVE",
    copy: "Watch both your thinking and the collective thinking change over time.",
  },
];

const principles = [
  "Question ideas, not people.",
  "Disagreement is welcome. Disrespect isn't.",
  "‘I don't know’ is a valid answer.",
  "Give reasons, not just reactions.",
  "Lived experience is valuable context.",
  "Be willing to change your mind.",
  "Build on good ideas—even when they aren't yours.",
  "Contribute to understanding, not winning.",
];

const lessItems = [
  "Followers",
  "Virality",
  "Hot takes",
  "Echo chambers",
  "Endless comments",
  "Performing certainty",
  "Winning arguments",
];

const moreItems = [
  "Perspectives",
  "Context",
  "Reflection",
  "Curiosity",
  "Collective intelligence",
  "Collaboration",
  "Ideas",
  "Solutions",
];

const wrappedCards = [
  "You changed your mind on 7 questions.",
  "You explored 21 perspectives outside your usual viewpoint.",
  "You helped develop 6 ideas this month.",
  "3 of your questions changed how a discussion was framed.",
];

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

function useScrollStage(stageCount: number) {
  const ref = useRef<HTMLElement | null>(null);
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setStage(stageCount - 1);
      return;
    }

    const update = () => {
      const section = ref.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const travel = Math.max(rect.height - viewportHeight, 1);
      const progress = Math.min(
        1,
        Math.max(0, (viewportHeight * 0.42 - rect.top) / travel),
      );
      const nextStage = Math.min(
        stageCount - 1,
        Math.floor(progress * stageCount),
      );

      setStage((current) => (current === nextStage ? current : nextStage));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduceMotion, stageCount]);

  return { ref, stage: reduceMotion ? stageCount - 1 : stage, reduceMotion };
}

function PrimaryLink({
  children,
  href = "/dashboard",
}: {
  children: ReactNode;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-12 items-center justify-center rounded-[0.45rem] bg-[#E2570F] px-6 text-base font-semibold text-white transition-colors hover:bg-[#B8430A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7]"
    >
      {children}
    </Link>
  );
}

function QuietLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center rounded-sm text-base font-semibold ${ink} underline-offset-8 transition-colors hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7]`}
    >
      {children}
    </Link>
  );
}

function Section({
  id,
  children,
  className = "",
  glow,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  glow?: CSSProperties;
}) {
  return (
    <section
      id={id}
      className={`relative border-t ${rule} px-5 py-24 sm:px-8 ${glow ? "overflow-hidden" : ""} ${className}`}
    >
      {glow ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={glow} />
      ) : null}
      <div className="relative mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function MarkedStatement({
  mark,
  text,
  label,
  className = "",
}: {
  mark: string;
  text: string;
  label?: string;
  className?: string;
}) {
  return (
    <article className={`relative border-t ${rule} pl-8 pt-4 ${className}`}>
      <span
        className={`absolute left-0 top-4 text-lg font-semibold ${live}`}
        aria-hidden="true"
      >
        {mark}
      </span>
      <p className={`text-lg leading-8 ${ink} [font-family:var(--vayam-serif)]`}>
        &ldquo;{text}&rdquo;
      </p>
      {label ? <p className={`mt-2 text-sm font-medium ${muted}`}>{label}</p> : null}
    </article>
  );
}

function StageLabel({ children }: { children: ReactNode }) {
  return <p className={`text-sm font-semibold ${teal}`}>{children}</p>;
}

function HomepageHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          aria-label="Vayam home"
          className={`rounded-sm text-lg font-semibold ${ink} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7]`}
        >
          vayam
        </Link>
        <Link
          href="/signin"
          className={`rounded-sm text-sm font-medium ${muted} transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7]`}
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

function LandingHero() {
  return (
    <section
      style={heroAtmosphere}
      className="relative flex min-h-[100svh] items-center overflow-hidden px-5 py-28 sm:px-8"
    >
      <HomepageHeader />
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-5xl">
          <h1
            className={`max-w-5xl text-[clamp(3rem,8vw,7.25rem)] font-semibold leading-[0.96] tracking-normal ${live}`}
          >
            How much of what you believe did you actually choose?
          </h1>

          <div className="mt-9 max-w-3xl space-y-5">
            <p className={`text-lg leading-8 ${ink} sm:text-xl`}>
              {heroSupportingCopy}
            </p>
            <p className={`text-lg leading-8 ${ink} sm:text-xl`}>
              What if you could see beyond it?
            </p>
            <p className={`text-base font-medium ${muted}`}>
              &lsquo;I&rsquo;m not sure&rsquo; is an answer too.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <PrimaryLink>Answer one question →</PrimaryLink>
            <QuietLink href="#question-demo">Just explore</QuietLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeliefOrigins() {
  const { ref, stage } = useScrollStage(3);

  return (
    <section
      ref={ref}
      id="thinking-origins"
      className={`relative border-t ${rule} px-5 py-20 sm:px-8 md:min-h-[190vh] md:py-0`}
    >
      <div className="mx-auto max-w-6xl md:sticky md:top-0 md:grid md:min-h-screen md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-12">
        <div className="py-10">
          <StageLabel>I</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            Most of us inherit a worldview before we ever build one.
          </h2>
          <div className={`mt-8 max-w-lg space-y-3 text-xl leading-8 ${ink}`}>
            <p>They quietly shape what feels normal.</p>
            <p>What feels right.</p>
            <p>What feels obvious.</p>
          </div>
          <p className={`mt-8 text-3xl font-semibold ${stage >= 2 ? live : muted}`}>
            Then what?
          </p>
        </div>

        <div className="relative mt-10 h-[28rem] overflow-hidden border-y border-white/[0.13] md:mt-0 md:h-[34rem] md:border-y-0">
          <div
            className={`absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${rule} text-5xl font-semibold ${ink}`}
          >
            I
          </div>
          {influenceWords.map((word) => {
            const position = stage === 0 ? word.from : word.to;
            const opacity = stage === 2 ? 0.48 : 1;
            const style = {
              left: `${position.left}%`,
              top: `${position.top}%`,
              opacity,
            } satisfies CSSProperties;

            return (
              <span
                key={word.label}
                className={`absolute max-w-36 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold leading-tight transition-[left,top,opacity,color] duration-700 ease-out motion-reduce:transition-none ${
                  stage >= 1 ? teal : ink
                }`}
                style={style}
              >
                {word.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function YourPerspective() {
  return (
    <Section id="your-perspective">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <StageLabel>I</StageLabel>
          <h2 className={`mt-4 text-5xl font-semibold leading-tight ${ink}`}>
            What do you think?
          </h2>
        </div>
        <div className={`max-w-2xl space-y-4 text-2xl leading-snug ${ink}`}>
          <p>Not the most popular answer.</p>
          <p>Not what sounds intelligent.</p>
          <p>Not what you&apos;re expected to say.</p>
          <p className="pt-4">Start with what you actually think.</p>
          <p className={`pt-6 text-[clamp(2.5rem,8vw,6rem)] font-semibold leading-none ${live}`}>
            &lsquo;I don&apos;t know.&rsquo;
          </p>
        </div>
      </div>
    </Section>
  );
}

function TheTurn() {
  const [state, setState] = useState<TurnState>("alone");

  return (
    <Section id="turn">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div>
          <StageLabel>YOU</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            Now see what you couldn&apos;t see alone.
          </h2>
          <div className={`mt-8 max-w-xl space-y-4 text-lg leading-8 ${ink}`}>
            <p>You answer first.</p>
            <p>
              Then Vayam introduces you to someone who sees the same question
              differently.
            </p>
            <p>Not as an opponent.</p>
            <p>Not to prove you wrong.</p>
            <p>
              But because their experiences may reveal something yours
              couldn&apos;t.
            </p>
            <p className="font-semibold">Your perspective is one part of the picture.</p>
          </div>
          <button
            type="button"
            className={`mt-8 min-h-12 rounded-[0.45rem] border border-[#E2570F] px-6 text-base font-semibold ${state === "alone" ? live : ink} transition-colors hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7]`}
            onClick={() => setState("beside")}
          >
            See another.
          </button>
        </div>

        <div className={`relative min-h-[30rem] border-y ${rule} py-8`}>
          <div
            className={`transition-transform duration-500 ease-out motion-reduce:transition-none ${
              state === "beside" ? "lg:-translate-x-12" : ""
            }`}
          >
            <MarkedStatement
              mark="●"
              text="I worked hard for what I have. That has to count for something."
              label="your perspective"
              className="max-w-md"
            />
          </div>

          <div
            className={`mt-8 max-w-md transition-all duration-500 ease-out motion-reduce:transition-none lg:absolute lg:right-0 lg:top-28 ${
              state === "beside"
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
            aria-live="polite"
          >
            <MarkedStatement
              mark="≠"
              text="I worked hard too. The part I couldn't control was who had room to notice it."
              label="another perspective"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}

function InteractiveQuestionDemo() {
  const [choice, setChoice] = useState<DemoChoice | null>(null);
  const [showPerspective, setShowPerspective] = useState(false);

  useEffect(() => {
    if (!choice) {
      return;
    }

    setShowPerspective(false);
    const timer = window.setTimeout(() => setShowPerspective(true), 360);

    return () => window.clearTimeout(timer);
  }, [choice]);

  return (
    <Section id="question-demo">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <StageLabel>Demo content</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            Do people become successful mostly because of effort or circumstance?
          </h2>
        </div>

        <div>
          <div className="grid gap-3" aria-label="Respond to the demo question">
            {questionOptions.map((option) => {
              const selected = choice === option.id;
              const answered = Boolean(choice);

              return (
                <button
                  key={option.id}
                  type="button"
                  className={`min-h-12 rounded-sm border-t ${rule} px-1 py-3 text-left text-lg font-semibold transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4EFE7] ${
                    answered
                      ? selected
                        ? ink
                        : muted
                      : live
                  }`}
                  onClick={() => setChoice(option.id)}
                >
                  <span aria-hidden="true">{option.mark}</span> {option.label}
                </button>
              );
            })}
          </div>

          {choice && showPerspective ? (
            <div className="mt-10" aria-live="polite">
              <p className={`mb-4 text-sm font-medium ${muted}`}>
                Someone else sees it differently.
              </p>
              <MarkedStatement
                mark="~"
                text={demoResponses[choice]}
                label="sample lived-experience response"
              />
              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                <QuietLink href="#turn">See their perspective →</QuietLink>
                <QuietLink href="#collective-understanding">
                  See how everyone answered →
                </QuietLink>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

function CollectiveUnderstanding() {
  const { ref, stage } = useScrollStage(3);
  const labelsVisible = stage >= 1;
  const compact = useMediaQuery("(max-width: 767px)");

  return (
    <section
      ref={ref}
      id="collective-understanding"
      className={`relative border-t ${rule} px-5 py-20 sm:px-8 md:min-h-[210vh] md:py-0`}
    >
      <div className="mx-auto max-w-6xl md:sticky md:top-0 md:flex md:min-h-screen md:flex-col md:justify-center md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <StageLabel>WE</StageLabel>
            <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
              One opinion tells you something.
            </h2>
            <p className={`mt-4 text-3xl font-semibold leading-tight ${teal}`}>
              Thousands, understood together, can tell you much more.
            </p>
          </div>
          <div className={`max-w-2xl text-lg leading-8 ${ink}`}>
            <p>Vayam doesn&apos;t simply collect what people think.</p>
            <p className="mt-4">It looks at perspectives together to surface:</p>
          </div>
        </div>

        <div className="relative mt-12 h-[64rem] overflow-hidden border-y border-white/[0.13] md:h-[38rem] md:border-y-0">
          {understandingFragments.map((fragment, index) => {
            const position = compact
              ? {
                  left: 0,
                  top: 2 + index * 16,
                  width: 92,
                }
              : fragment.positions[stage];
            const style = {
              left: `${position.left}%`,
              top: `${position.top}%`,
              width: `${position.width}%`,
            } satisfies CSSProperties;

            return (
              <div
                key={fragment.text}
                className="absolute transition-[left,top,width] duration-700 ease-out motion-reduce:transition-none"
                style={style}
              >
                <MarkedStatement
                  mark={fragment.mark}
                  text={fragment.text}
                  label={labelsVisible ? fragment.label : undefined}
                />
              </div>
            );
          })}
        </div>

        <p className={`max-w-3xl text-xl leading-8 ${ink}`}>
          Because the value isn&apos;t in having more opinions. It&apos;s in
          understanding what those opinions reveal together.
        </p>
      </div>
    </section>
  );
}

function CollectiveIntelligence() {
  const { ref, stage } = useScrollStage(3);

  return (
    <section
      ref={ref}
      id="collective-intelligence"
      className={`relative border-t ${rule} px-5 py-24 sm:px-8 md:min-h-[170vh] md:py-0`}
    >
      <div className="mx-auto max-w-6xl md:sticky md:top-0 md:grid md:min-h-screen md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-12">
        <div className="py-12">
          <StageLabel>Collective intelligence</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            No one person has the whole picture.
          </h2>
          <div className={`mt-9 max-w-xl space-y-4 text-xl leading-8 ${ink}`}>
            {collectiveLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="relative min-h-[34rem] border-y border-white/[0.13] md:border-y-0">
          {collectiveLines.slice(0, 6).map((line, index) => {
            const angle = index * 60;
            const radius = stage === 0 ? 12 + index * 5 : stage === 1 ? 22 : 30;
            const style = {
              transform: `rotate(${angle}deg) translate(${radius}%) rotate(-${angle}deg)`,
              opacity: stage === 0 ? 0.82 : 1,
            } satisfies CSSProperties;

            return (
              <div
                key={line}
                className={`absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 border-t ${rule} pt-3 text-sm leading-5 ${muted} transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none`}
                style={style}
              >
                {line}
              </div>
            );
          })}

          <div
            className={`absolute left-1/2 top-1/2 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${rule} text-center text-lg font-semibold leading-tight ${stage >= 2 ? live : ink}`}
          >
            seeing more together
          </div>
        </div>

        <div className="pb-12 md:col-span-2">
          <p className={`max-w-3xl text-xl leading-8 ${ink}`}>
            When those perspectives are brought together thoughtfully, they can
            create something none of them could have reached alone.
          </p>
          <p className={`mt-8 text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-none ${live}`}>
            That is collective intelligence.
          </p>
          <p className={`mt-6 max-w-3xl text-2xl font-medium leading-tight ${ink}`}>
            Not everyone thinking the same. Everyone seeing more because we
            thought together.
          </p>
        </div>
      </div>
    </section>
  );
}

function UnderstandingBridge() {
  const lines = [
    "What people are experiencing.",
    "Why they disagree.",
    "What assumptions are wrong.",
    "What's still unknown.",
    "Where common ground exists.",
  ];

  return (
    <Section id="understanding-bridge">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr]">
        <div>
          <StageLabel>BUILD</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            Seeing the problem differently is only the beginning.
          </h2>
        </div>
        <div>
          <p className={`text-xl leading-8 ${ink}`}>A discussion might reveal:</p>
          <div className="mt-8 grid gap-4">
            {lines.map((line) => (
              <p
                key={line}
                className={`border-t ${rule} py-4 text-xl font-semibold ${ink}`}
              >
                {line}
              </p>
            ))}
          </div>
          <p className={`mt-10 text-[clamp(2.4rem,6vw,5.4rem)] font-semibold leading-none ${live}`}>
            What can we build from what we&apos;ve learned?
          </p>
        </div>
      </div>
    </Section>
  );
}

function CollaborativeSolutions() {
  const copy = [
    "Once a discussion develops enough collective understanding, people can start contributing ideas.",
    "One person proposes something.",
    "Another improves it.",
    "Someone challenges an assumption.",
    "Someone brings lived experience.",
    "Someone adds evidence.",
    "Someone identifies a consequence nobody considered.",
    "The idea evolves.",
  ];

  return (
    <Section id="build">
      <div>
        <StageLabel>Collaborative solutions</StageLabel>
        <h2 className={`mt-4 max-w-4xl text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
          Move from talking about problems to building possible solutions.
        </h2>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`space-y-4 text-xl leading-8 ${ink}`}>
          {copy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className={`border-y ${rule} py-6`}>
          <div className="grid gap-4">
            {solutionSteps.map((step, index) => (
              <div key={step} className="grid grid-cols-[2rem_1fr] items-center gap-4">
                <span className={`text-lg font-semibold ${index === 6 ? live : muted}`}>
                  {index === 6 ? "→" : "↓"}
                </span>
                <span
                  className={`border-t ${rule} py-3 text-xl font-semibold ${
                    index === 6 ? live : ink
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className={`mt-14 text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-none ${teal}`}>
        Not my solution.
        <br />A solution we built together.
      </p>
    </Section>
  );
}

function SolutionDemo() {
  const { ref, stage } = useScrollStage(2);
  const grouped = stage >= 1;
  const groups: Array<{ id: SolutionContribution["group"]; title: string }> = [
    { id: "learning", title: "What we're learning" },
    { id: "missing", title: "What we're missing" },
    { id: "ideas", title: "Ideas emerging" },
    { id: "building", title: "Solutions being built" },
  ];

  return (
    <section
      ref={ref}
      id="solution-demo"
      className={`relative border-t ${rule} px-5 py-24 sm:px-8 md:min-h-[175vh] md:py-0`}
    >
      <div className="mx-auto max-w-6xl md:sticky md:top-0 md:flex md:min-h-screen md:flex-col md:justify-center md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <StageLabel>Demo content</StageLabel>
            <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
              How could Hyderabad make public spaces safer for women at night?
            </h2>
          </div>
          <p className={`max-w-2xl text-lg leading-8 ${muted}`}>
            Sample interface content. The point is the structure, not a claim that
            these are complete findings.
          </p>
        </div>

        <div className="mt-12">
          {!grouped ? (
            <div className="grid gap-5 md:grid-cols-3">
              {solutionContributions.map((item) => (
                <MarkedStatement
                  key={item.text}
                  mark={item.mark}
                  text={item.text}
                  label={item.type}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              {groups.map((group) => (
                <div key={group.id}>
                  <p className={`mb-4 text-xl font-semibold ${teal}`}>{group.title}</p>
                  <div className="grid gap-5">
                    {solutionContributions
                      .filter((item) => item.group === group.id)
                      .map((item) => (
                        <MarkedStatement
                          key={item.text}
                          mark={item.mark}
                          text={item.text}
                          label={item.type}
                        />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10">
          <PrimaryLink>Contribute to this idea →</PrimaryLink>
        </div>
      </div>
    </section>
  );
}

function VayamLoop() {
  return (
    <Section id="loop">
      <div>
        <StageLabel>The loop</StageLabel>
        <h2 className={`mt-4 max-w-4xl text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
          One question can go further than an answer.
        </h2>
      </div>
      <div className={`mt-12 border-y ${rule} py-8`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-4">
          {loopSteps.map((step, index) => (
            <span key={step} className="flex items-center gap-4">
              <span className={`text-xl font-semibold ${index >= 5 ? teal : ink}`}>
                {step}
              </span>
              {index < loopSteps.length - 1 ? (
                <span className={live} aria-hidden="true">
                  →
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </div>
      <p className={`mt-8 max-w-4xl text-2xl font-semibold leading-tight ${live}`}>
        Question → Perspective → Reflection → Collective Intelligence →
        Collaborative Solutions
      </p>
    </Section>
  );
}

function Capabilities() {
  return (
    <Section id="capabilities">
      <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
        <div>
          <StageLabel>Product capabilities</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            What Vayam helps a discussion do.
          </h2>
        </div>
        <div className="grid gap-0">
          {capabilityStages.map((stage, index) => (
            <article
              key={stage.title}
              className={`grid gap-4 border-t ${rule} py-5 md:grid-cols-[7rem_1fr]`}
            >
              <p className={`text-sm font-semibold ${index >= 6 ? live : muted}`}>
                {stage.title}
              </p>
              <p className={`text-xl font-semibold leading-8 ${ink}`}>{stage.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

function WhyDifferent() {
  return (
    <Section id="why-different">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <h2 className={`text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
          The internet is very good at showing us what everyone is saying.
          <span className="mt-6 block text-[#9DBFB7]">
            It is much worse at helping us understand what we&apos;re learning.
          </span>
        </h2>
        <div className="grid gap-10 sm:grid-cols-2">
          <div>
            <p className={`text-sm font-semibold ${muted}`}>Social feeds give us</p>
            <div className="mt-5 grid gap-3">
              {["Posts.", "Comments.", "Reactions.", "Arguments.", "Likes."].map(
                (item) => (
                  <p key={item} className={`border-t ${rule} py-3 text-lg ${muted}`}>
                    {item}
                  </p>
                ),
              )}
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${teal}`}>Vayam tries to turn them into</p>
            <div className="mt-5 grid gap-3">
              {["Context.", "Patterns.", "Questions.", "Understanding.", "Ideas.", "Solutions."].map(
                (item) => (
                  <p key={item} className={`border-t ${rule} py-3 text-lg ${ink}`}>
                    {item}
                  </p>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
      <p className={`mt-14 text-4xl font-semibold leading-tight ${live} sm:text-6xl`}>
        Less reaction.
        <br />
        More collective intelligence.
        <br />
        Less winning.
        <br />
        More building.
      </p>
    </Section>
  );
}

function UncertaintySection() {
  return (
    <Section id="uncertainty">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className={`text-[clamp(3rem,8vw,7rem)] font-semibold leading-none ${live}`}>
            &lsquo;I don&apos;t know&rsquo; is useful information.
          </h2>
        </div>
        <div className={`space-y-6 text-xl leading-8 ${ink}`}>
          <p>Uncertainty tells us where understanding is incomplete.</p>
          <p>Disagreement tells us where perspectives diverge.</p>
          <p>Lived experience tells us what data alone may miss.</p>
          <p>Questions tell us what still needs to be explored.</p>
          <p className={`pt-6 text-3xl font-semibold leading-tight ${teal}`}>
            Vayam doesn&apos;t hide complexity. It makes complexity understandable.
          </p>
        </div>
      </div>
    </Section>
  );
}

function VayamWrapped() {
  return (
    <Section id="wrapped">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <StageLabel>Vayam Wrapped</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            Understand the collective.
            <span className="block text-[#9DBFB7]">And understand yourself within it.</span>
          </h2>
          <p className={`mt-6 max-w-xl text-lg leading-8 ${muted}`}>
            A living reflection of how you think—and how your thinking evolves.
          </p>
        </div>
        <div className="grid gap-4">
          {wrappedCards.map((card) => (
            <article key={card} className={`border-t ${rule} px-1 py-5`}>
              <p className={`text-sm font-medium ${muted}`}>Sample reflection</p>
              <p className={`mt-2 text-2xl font-semibold leading-tight ${ink}`}>{card}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Community() {
  return (
    <Section id="community">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <StageLabel>Community</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink} sm:text-6xl`}>
            You don&apos;t need followers to contribute something valuable.
          </h2>
        </div>
        <div className={`space-y-4 text-xl leading-8 ${ink}`}>
          <p>Vayam isn&apos;t built around who has the largest audience.</p>
          <p>An important idea could come from anyone.</p>
          <p>A useful question could come from anyone.</p>
          <p>A missing lived experience could come from anyone.</p>
          <p>A better solution could begin with anyone.</p>
          <p className={`pt-8 text-4xl font-semibold leading-tight ${teal}`}>
            Your value isn&apos;t your following. It&apos;s what you add to the
            picture.
          </p>
        </div>
      </div>
    </Section>
  );
}

function CommunityPrinciples() {
  return (
    <Section id="principles">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <StageLabel>Community principles</StageLabel>
          <h2 className={`mt-4 text-4xl font-semibold leading-tight ${ink}`}>
            A living cultural code.
          </h2>
        </div>
        <div>
          {principles.map((principle) => (
            <p
              key={principle}
              className={`border-t ${rule} py-4 text-xl font-semibold leading-8 ${ink}`}
            >
              {principle}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}

function LessMore() {
  const { ref, stage } = useScrollStage(2);

  return (
    <section
      ref={ref}
      id="less-more"
      className={`relative border-t ${rule} px-5 py-24 sm:px-8 md:min-h-[150vh] md:py-0`}
    >
      <div className="mx-auto max-w-6xl md:sticky md:top-0 md:flex md:min-h-screen md:flex-col md:justify-center md:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div
            className={`transition-opacity duration-700 ${
              stage >= 1 ? "opacity-35" : "opacity-100"
            }`}
          >
            <p className={`text-sm font-semibold ${muted}`}>LESS</p>
            <div className="mt-5 grid gap-3">
              {lessItems.map((item) => (
                <p key={item} className={`border-t ${rule} py-3 text-2xl ${muted}`}>
                  {item}
                </p>
              ))}
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${teal}`}>MORE</p>
            <div className="mt-5 grid gap-3">
              {moreItems.map((item, index) => (
                <p
                  key={item}
                  className={`border-t ${rule} py-3 text-2xl font-semibold transition-transform duration-700 ${
                    stage >= 1 ? "translate-x-0 opacity-100" : "translate-x-4 opacity-75"
                  } ${index >= 4 ? live : ink}`}
                >
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
        <p className={`mt-14 text-4xl font-semibold leading-tight ${live} sm:text-6xl`}>
          Less noise. More understanding.
          <span className={`mt-5 block ${teal}`}>
            Less arguing about the future. More building it together.
          </span>
        </p>
      </div>
    </section>
  );
}

function BigBrandMoment() {
  return (
    <Section id="big-idea" glow={brandGlow} className="py-32">
      <div className="max-w-5xl">
        <h2 className={`text-[clamp(3rem,8vw,7rem)] font-semibold leading-none ${live}`}>
          No one sees the whole picture alone.
        </h2>
        <div className={`mt-12 max-w-3xl space-y-5 text-2xl leading-snug ${ink}`}>
          <p>You know something because of the life you&apos;ve lived.</p>
          <p>Someone else knows something because of theirs.</p>
          <p>Neither perspective needs to disappear.</p>
          <p>Bring enough of them together—</p>
          <p>question them, understand them, connect them, build on them—</p>
          <p>and we can see possibilities none of us could see alone.</p>
          <p className={`pt-8 text-4xl font-semibold ${teal}`}>That is Vayam.</p>
        </div>
        <p className={`mt-16 text-[clamp(7rem,22vw,18rem)] font-semibold leading-none ${ink}`}>
          WE.
        </p>
      </div>
    </Section>
  );
}

function NameStory() {
  return (
    <Section id="name-story">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className={`text-[clamp(4rem,11vw,9rem)] font-semibold leading-none ${ink}`}>
            Vayam
          </h2>
          <p className={`mt-6 text-5xl font-semibold ${teal}`}>वयम् — We.</p>
        </div>
        <div className={`space-y-5 text-2xl leading-snug ${ink}`}>
          <p>Inspired by:</p>
          <p>We are courageous.</p>
          <p>We are steadfast.</p>
          <p>Because it takes courage to question something you have always believed.</p>
          <p>To say:</p>
          <p className={live}>Maybe.</p>
          <p className={live}>I don&apos;t know.</p>
          <p className={live}>I hadn&apos;t thought about it that way.</p>
          <p className={live}>I changed my mind.</p>
          <p className={live}>I think we can build something better.</p>
          <p className="pt-8">And hidden inside Vayam is another question:</p>
          <p className={`text-[clamp(3rem,8vw,7rem)] font-semibold leading-none ${teal}`}>
            Why I am?
          </p>
          <p>
            Because understanding the we starts with understanding the I. And what
            we build together depends on both.
          </p>
        </div>
      </div>
    </Section>
  );
}

function FinalCta() {
  return (
    <Section id="final" glow={warmGlow} className="py-32">
      <div className="max-w-5xl">
        <h2 className={`text-[clamp(3rem,8vw,7rem)] font-semibold leading-none ${live}`}>
          How much of what you believe did you actually choose?
        </h2>
        <p className={`mt-9 max-w-3xl text-2xl font-medium leading-tight ${ink}`}>
          Maybe the first step isn&apos;t finding the right answer. Maybe it&apos;s
          seeing more of the picture.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <PrimaryLink>Answer one question →</PrimaryLink>
          <QuietLink href="#question-demo">Just explore</QuietLink>
        </div>
        <p className={`mt-12 text-base font-medium ${muted}`}>
          See clearer. Think together. Build better.
        </p>
      </div>
    </Section>
  );
}

function LandingFooter() {
  return (
    <footer className={`border-t ${rule} px-5 py-12 sm:px-8`}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_1.9fr]">
        <div>
          <p className={`text-2xl font-semibold ${ink}`}>VAYAM</p>
          <p className={`mt-4 max-w-sm text-base leading-7 ${muted}`}>
            A place to question, encounter, reflect and build better ideas
            together.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className={`text-sm font-semibold ${teal}`}>EXPLORE</p>
            <div className={`mt-4 grid gap-3 text-sm ${muted}`}>
              <Link href="#question-demo" className="hover:text-white">
                Questions
              </Link>
              <Link href="#collective-understanding" className="hover:text-white">
                Perspectives
              </Link>
              <Link href="#collective-understanding" className="hover:text-white">
                Discussions
              </Link>
              <Link href="#build" className="hover:text-white">
                Ideas
              </Link>
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${teal}`}>VAYAM</p>
            <div className={`mt-4 grid gap-3 text-sm ${muted}`}>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
              <Link href="#loop" className="hover:text-white">
                How it works
              </Link>
              <Link href="#principles" className="hover:text-white">
                Community principles
              </Link>
              <Link href="#wrapped" className="hover:text-white">
                Vayam Wrapped
              </Link>
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${teal}`}>TRUST</p>
            <div className={`mt-4 grid gap-3 text-sm ${muted}`}>
              <span>Safety</span>
              <span>Privacy</span>
              <span>Moderation</span>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={`mx-auto mt-12 max-w-6xl border-t ${rule} pt-6 text-sm ${muted}`}>
        No one sees the whole picture alone.
      </div>
    </footer>
  );
}

export function HeroSection() {
  return (
    <main className={`overflow-x-clip bg-[#0A0D0B] ${ink} [font-family:var(--vayam-sans)]`}>
      <LandingHero />
      <BeliefOrigins />
      <YourPerspective />
      <TheTurn />
      <InteractiveQuestionDemo />
      <CollectiveUnderstanding />
      <CollectiveIntelligence />
      <UnderstandingBridge />
      <CollaborativeSolutions />
      <SolutionDemo />
      <VayamLoop />
      <Capabilities />
      <WhyDifferent />
      <UncertaintySection />
      <VayamWrapped />
      <Community />
      <CommunityPrinciples />
      <LessMore />
      <BigBrandMoment />
      <NameStory />
      <FinalCta />
      <LandingFooter />
    </main>
  );
}
