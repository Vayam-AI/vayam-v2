"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  MessagesSquare,
  Scale,
  ShieldCheck,
  UsersRound,
  Vote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const challengeMetrics = [
  "24 participants",
  "4 proposed solutions",
  "18 arguments",
  "Open for participation",
];

const workflowSteps = [
  {
    title: "Identify a challenge",
    icon: CircleDot,
  },
  {
    title: "Propose possible solutions",
    icon: MessagesSquare,
  },
  {
    title: "Add reasoning, pros and cons",
    icon: Scale,
  },
  {
    title: "Vote on individual arguments",
    icon: Vote,
  },
  {
    title: "Improve the discussion collectively",
    icon: UsersRound,
  },
];

const whyCards = [
  {
    title: "Structured input",
    text: "Challenges, solutions and arguments remain organised instead of disappearing inside long comment threads.",
  },
  {
    title: "Reasoned participation",
    text: "Citizens can support a solution while still acknowledging its risks by voting on individual pros and cons.",
  },
  {
    title: "A foundation for action",
    text: "Structured public input can be reviewed, refined and shared with experts and institutions responsible for implementation.",
  },
];

export function HeroSection() {
  return (
    <main>
      <section className="overflow-hidden bg-[#111312]">
        <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
          <div className="min-w-0 max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase text-[#ff9a6c]">
              Collective intelligence for civic action
            </p>
            <h1 className="break-words text-4xl font-bold leading-[1.08] text-[#fbf5ed] sm:text-5xl lg:text-[3.6rem]">
              Move from public voices to{" "}
              <span className="font-serif italic text-[#ff6b3d]">
                shared solutions.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#b8c3c8] sm:text-lg">
              Raise a challenge, propose solutions, examine their pros and cons,
              and help communities understand not only what people support - but
              why.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-md border-0 bg-[#ff4f0f] px-6 text-base font-semibold text-white shadow-none hover:bg-[#ff6b3d] focus-visible:ring-[#ff9a6c] sm:w-auto"
                asChild
              >
                <Link href="/dashboard">
                  Explore civic challenges
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full rounded-md border-white/[0.15] bg-transparent px-6 text-base font-semibold text-[#f7f2ea] hover:bg-white/10 hover:text-white focus-visible:ring-[#ff9a6c] sm:w-auto"
                asChild
              >
                <Link href="/signin">Sign in</Link>
              </Button>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-6 text-[#8f9da4]">
              Built for constructive participation, reasoned discussion and
              visible public input.
            </p>
          </div>

          <div className="min-w-0 rounded-lg border border-white/[0.12] bg-[#181b1a] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <span className="rounded-full border border-[#ff6b3d]/30 bg-[#ff4f0f]/[0.12] px-3 py-1 text-xs font-semibold text-[#ffb08a]">
                Mobility pilot &middot; Demonstration
              </span>
              <span className="text-xs font-medium text-[#8f9da4]">
                Sample data
              </span>
            </div>

            <div className="py-5">
              <h2 className="break-words text-2xl font-semibold leading-snug text-[#fbf5ed]">
                How can we improve last-mile connectivity from Raidurg Metro to
                the Financial District?
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#b8c3c8]">
                Explore proposed solutions, compare their strengths and risks,
                and contribute your reasoning.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {challengeMetrics.map((metric) => (
                <div
                  key={metric}
                  className="rounded-md border border-white/10 bg-[#202322] px-3 py-3"
                >
                  <p className="text-sm font-semibold leading-5 text-[#f7f2ea]">
                    {metric}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-md border border-[#ff6b3d]/25 bg-[#ff4f0f]/10 px-3 py-2 text-xs font-medium text-[#ffc4aa]">
              Sample data for demonstration only.
            </p>

            <Button
              className="mt-5 h-11 w-full rounded-md border-0 bg-[#f7f2ea] font-semibold text-[#151615] shadow-none hover:bg-white focus-visible:ring-[#ff9a6c]"
              asChild
            >
              <Link href="/dashboard">
                View challenge
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#171a19] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold leading-tight text-[#fbf5ed] sm:text-4xl">
              How Vayam works
            </h2>
            <p className="mt-4 text-base leading-7 text-[#b8c3c8]">
              A poll tells us which option received the most votes. Vayam helps
              reveal which arguments people agree with, which risks concern them
              and where common understanding may begin.
            </p>
          </div>

          <div className="mt-9 grid gap-3 lg:grid-cols-5">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="rounded-lg border border-white/10 bg-[#202322] p-4"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#ff4f0f]/[0.14] text-[#ff8a5e]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-[#7f8a91]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold leading-6 text-[#f7f2ea]">
                    {step.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why-vayam" className="bg-[#111312] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold leading-tight text-[#fbf5ed] sm:text-4xl">
              Participation should produce more than a vote count.
            </h2>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {whyCards.map((card) => (
              <div
                key={card.title}
                className="rounded-lg border border-white/10 bg-[#181b1a] p-5"
              >
                <CheckCircle2
                  className="mb-5 h-6 w-6 text-[#ff7a45]"
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold text-[#fbf5ed]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#b8c3c8]">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-experts" className="bg-[#171a19] py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-lg border border-white/10 bg-[#202322] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-[#ff4f0f]/[0.14] text-[#ff8a5e]">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-semibold leading-tight text-[#fbf5ed] sm:text-3xl">
                Citizens bring lived experience. Experts bring context and
                feasibility.
              </h2>
              <p className="mt-4 text-base leading-7 text-[#b8c3c8]">
                Vayam is designed to bring citizens, subject-matter experts and
                decision-makers into the same problem-solving process - without
                treating popularity alone as a policy decision.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12 rounded-md border-0 bg-[#ff4f0f] px-6 text-base font-semibold text-white shadow-none hover:bg-[#ff6b3d] focus-visible:ring-[#ff9a6c]"
              asChild
            >
              <Link href="/invite-sme">Learn about expert participation</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[#111312] py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold leading-tight text-[#fbf5ed] sm:text-4xl">
            Start with a challenge that matters.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#b8c3c8]">
            Explore current discussions, contribute a possible solution or help
            examine the trade-offs within an existing proposal.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-md border-0 bg-[#ff4f0f] px-6 text-base font-semibold text-white shadow-none hover:bg-[#ff6b3d] focus-visible:ring-[#ff9a6c]"
              asChild
            >
              <Link href="/dashboard">Explore challenges</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-md border-white/[0.15] bg-transparent px-6 text-base font-semibold text-[#f7f2ea] hover:bg-white/10 hover:text-white focus-visible:ring-[#ff9a6c]"
              asChild
            >
              <Link href="/signup">Create an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
