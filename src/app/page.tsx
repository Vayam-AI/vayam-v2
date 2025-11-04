"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderOne } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import LandingNavbar from "@/components/landing-navbar";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <LoaderOne />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col">
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      {/* Animated Gradient Orbs - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large center gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff4f0f]/40 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Navigation */}
      <LandingNavbar />

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block">
                Collective Intelligence for Sustainable Solutions{" "}
                <span className="font-birthstone text-8xl sm:text-9xl bg-clip-text "></span>
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Shape powerful, inclusive solutions through shared knowledge.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                size="lg"
                className="bg-linear-to-r from-[#ff4f0f] to-[#ff6b3d] hover:from-[#ff6b3d] hover:to-[#ff8560] text-white border-0 shadow-lg shadow-[#ff4f0f]/30 px-8 h-12 text-base group"
                asChild
              >
                <Link href="/signup" className="flex items-center gap-2">
                  Join the Community
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-700 bg-transparent text-white px-8 h-12 text-base backdrop-blur-sm"
                asChild
              >
                <Link href="/about">View More</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-sm text-gray-400">
              © 2025 Vayam. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
