"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderOne } from "@/components/ui/loader";
import { LandingNavbar } from "@/components/landing-navbar";
import { HeroSection } from "@/components/hero-section";
import { Footer } from "@/components/footer";

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

  if (status === "authenticated") return null;

  return (
    <div className="h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col">
      {/* Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-small"></div>
        <div className="stars-medium"></div>
        <div className="stars-large"></div>
      </div>

      <LandingNavbar />
      <HeroSection />
      <Footer />
    </div>
  );
}
