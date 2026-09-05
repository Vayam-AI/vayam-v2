"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  if (status === "authenticated") return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#201D1A] [font-family:var(--vayam-sans)]">
      <LandingNavbar variant="notation" />
      <HeroSection />
      <Footer />
    </div>
  );
}
