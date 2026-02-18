"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <main className="relative z-10 flex-1 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff4f0f]/20 border border-[#ff4f0f]/30 rounded-full text-[#ff8560] text-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            <span>New</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="block">
              Collective Intelligence for a Sustainable{" "}
              <span className="font-serif italic bg-linear-to-r from-[#ff8560] via-[#ff4f0f] to-[#ff8560] bg-clip-text text-transparent">
                Solutions
              </span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Shape powerful, inclusive solutions through shared knowledge.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="bg-linear-to-r from-[#ff4f0f] to-[#ff6b3d] hover:from-[#ff6b3d] hover:to-[#ff8560] text-white border-0 shadow-lg shadow-[#ff4f0f]/30 px-8 h-12 text-base group"
              asChild
            >
              <Link href="/signup" className="flex items-center gap-2">
                Get in touch
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 bg-transparent hover:bg-white/5 text-white px-8 h-12 text-base backdrop-blur-sm"
              asChild
            >
              <Link href="/about">View services</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
