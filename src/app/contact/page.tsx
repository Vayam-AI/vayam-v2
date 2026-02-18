"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Mail, Linkedin } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useState } from "react";
import { LandingNavbar } from "@/components/landing-navbar";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">

      {/* Navigation */}
      <LandingNavbar />

      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Can we <span className="text-[#ff4f0f]">ideate together</span> ?
              </h1>
            </section>

            {/* Founder's Message */}
            <section className="space-y-8">
              <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-6">
                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  As a statistics graduate and data science student I believe in
                  the power of data. Not just numerical data, but the
                  fundamental data of human life: our thoughts, perspectives,
                  and experiences.
                </p>

                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  I&apos;ve always loved humans in all their complexity. Every
                  person holds a fragment of truth, a story, a perspective, an
                  idea shaped by their lived experience. As a self-proclaimed
                  dataist, I see the fusion of human insight and machine
                  capability as the key to driving real, sustainable change.
                  Technology alone is not enough. It&apos;s our diversity of
                  experiences and viewpoints that make solutions lasting and
                  meaningful rather than mechanical or disconnected.
                </p>

                <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                  I don&apos;t have all the answers yet, but I&apos;m deeply
                  hopeful about what we can create when humans come together to
                  build thoughtful, sustainable solutions.
                </p>

                <p className="text-xl sm:text-2xl text-white font-semibold leading-relaxed pt-4">
                  I&apos;d love to hear your thoughts: How do you think we can
                  build this platform to truly harness our collective
                  intelligence?
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center">
                Get in <span className="text-[#ff4f0f]">Touch</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Email Card */}
                <a
                  href="mailto:keerthi@vayam.ai"
                  className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#ff4f0f]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff4f0f]/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#ff4f0f]/20 to-[#cc3f0c]/20 flex items-center justify-center border border-[#ff4f0f]/30 group-hover:scale-110 transition-transform">
                      <Mail className="w-6 h-6 text-[#ff6b3d]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Email</h3>
                      <p className="text-gray-400 group-hover:text-[#ff6b3d] transition-colors">
                        keerthi@vayam.ai
                      </p>
                    </div>
                  </div>
                </a>

                {/* LinkedIn Card */}
                <a
                  href="https://www.linkedin.com/in/keerthikolla/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#ff4f0f]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff4f0f]/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-linear-to-br from-[#ff4f0f]/20 to-[#cc3f0c]/20 flex items-center justify-center border border-[#ff4f0f]/30 group-hover:scale-110 transition-transform">
                      <Linkedin className="w-6 h-6 text-[#ff6b3d]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1">LinkedIn</h3>
                      <p className="text-gray-400 group-hover:text-[#ff6b3d] transition-colors">
                        Connect with me
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </section>

            {/* Contact Form Section */}
            <section className="space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-center">
                Share your <span className="text-[#ff4f0f]">Thoughts</span>
              </h2>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  const form = e.currentTarget;
                  const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                  const description = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

                  try {
                    const res = await fetch("/api/contact", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, description }),
                    });

                    const data = await res.json();
                    if (res.ok) {
                      toast.success("Message sent successfully!");
                      form.reset();
                    } else {
                      toast.error(data.error || "Failed to send message.");
                    }
                  } catch (error) {
                    toast.error("Something went wrong. Please try again.");
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="max-w-2xl mx-auto space-y-6 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl"
              >
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2">
                    Your Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-transparent border border-gray-700 focus:border-[#ff4f0f] outline-none text-white"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Write your message here..."
                    className="w-full px-4 py-3 rounded-lg bg-transparent border border-gray-700 focus:border-[#ff4f0f] outline-none text-white resize-none"
                  ></textarea>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full h-12 bg-linear-to-r from-[#ff4f0f] to-[#ff6b3d] hover:from-[#ff6b3d] hover:to-[#ff8560] text-white shadow-lg shadow-[#ff4f0f]/30 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {isSubmitting ? "Submitting..." : "Send Message"}
                </Button>
              </form>
            </section>


            {/* CTA Section */}
            <section className="text-center space-y-6 pt-8">
              <p className="text-xl sm:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
                Ready to contribute your perspective and help shape the future?
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-linear-to-r from-[#ff4f0f] to-[#ff6b3d] hover:from-[#ff6b3d] hover:to-[#ff8560] text-white border-0 shadow-lg shadow-[#ff4f0f]/30 px-8 h-12 text-base"
                  asChild
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-700 bg-transparent hover:bg-white/5 text-white px-8 h-12 text-base backdrop-blur-sm"
                  asChild
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-black/20 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Vayam. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/about"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

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
          background-image: radial-gradient(
              1px 1px at 20% 30%,
              white,
              transparent
            ),
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
          background-image: radial-gradient(
              2px 2px at 25% 45%,
              white,
              transparent
            ),
            radial-gradient(2px 2px at 65% 15%, white, transparent),
            radial-gradient(2px 2px at 45% 75%, white, transparent);
          background-size: 300% 300%;
          animation: twinkle 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
