"use client";

import { FlipWords } from "@/components/ui/flip-words";
import LandingNavbar from "@/components/landing-navbar";

export default function AboutPage() {
  const words = [
    "complexity.",
    "perspectives.",
    "why.",
    "together.",
    "the bigger picture.",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Hero Section with Flip Words */}
            <section className="text-center space-y-8">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Understanding{" "}
                <FlipWords
                  words={words}
                  duration={3000}
                  className="text-[#ff4f0f] font-bold"
                />
              </h1>
            </section>

            {/* Main Description */}
            <section className="space-y-8">
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-6">
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  Vayam is a thinking system built for complexity. It helps
                  people, teams, and institutions see the full picture. Not just
                  the loudest voices or the most obvious answers. By mapping
                  diverse reasoning and real-world context, Vayam transforms
                  fragmented input into structured understanding.
                </p>

                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  In a world overflowing with opinions, information, and noise,
                  Vayam creates coherence, showing not just{" "}
                  <span className="italic text-white">what people think</span>,
                  but <span className="italic text-white">why</span> they think
                  it. The result isn&apos;t just consensus, it&apos;s clarity. A
                  shared map of ideas that helps communities and organizations
                  make more grounded, transparent decisions.
                </p>
              </div>
            </section>

            {/* CTA Section */}
          
          </div>
        </div>
      </main>

      {/* Footer */}
    

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        .stars-small,
        .stars-medium,
        .stars-large {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .stars-small {
          background-image: radial-gradient(1px 1px at 20% 30%, white, transparent),
            radial-gradient(1px 1px at 60% 70%, white, transparent),
            radial-gradient(1px 1px at 50% 50%, white, transparent),
            radial-gradient(1px 1px at 80% 10%, white, transparent),
            radial-gradient(1px 1px at 90% 60%, white, transparent),
            radial-gradient(1px 1px at 30% 80%, white, transparent),
            radial-gradient(1px 1px at 70% 40%, white, transparent);
          background-size: 200% 200%;
          animation: twinkle 3s ease-in-out infinite;
        }

        .stars-medium {
          background-image: radial-gradient(
              1.5px 1.5px at 40% 20%,
              white,
              transparent
            ),
            radial-gradient(1.5px 1.5px at 75% 85%, white, transparent),
            radial-gradient(1.5px 1.5px at 15% 60%, white, transparent),
            radial-gradient(1.5px 1.5px at 85% 45%, white, transparent);
          background-size: 250% 250%;
          animation: twinkle 4s ease-in-out infinite;
        }

        .stars-large {
          background-image: radial-gradient(2px 2px at 25% 45%, white, transparent),
            radial-gradient(2px 2px at 65% 15%, white, transparent),
            radial-gradient(2px 2px at 45% 75%, white, transparent);
          background-size: 300% 300%;
          animation: twinkle 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
