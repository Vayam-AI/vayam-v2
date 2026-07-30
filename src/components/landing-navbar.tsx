"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { href: "/#how-it-works", label: "How it works" },
    { href: "/#why-vayam", label: "Why Vayam" },
    { href: "/invite-sme", label: "For Experts" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#131514]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
            onClick={closeMenu}
          >
            <Image
              src="/logo.png"
              alt="Vayam"
              width={100}
              height={38}
              className="h-auto w-[100px] rounded-lg"
              priority
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md text-sm font-medium text-[#cbd4d8] transition-colors hover:text-[#f7f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signin"
              className="rounded-md text-sm font-semibold text-[#f7f2ea] transition-colors hover:text-[#ffb08a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
            >
              Sign in
            </Link>
            <Button
              className="h-10 rounded-md border-0 bg-[#ff4f0f] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#ff6b3d] focus-visible:ring-[#ff9a6c]"
              asChild
            >
              <Link href="/dashboard">Explore Challenges</Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md text-[#f7f2ea] hover:bg-white/10 focus-visible:ring-[#ff7a45] md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isOpen && (
          <div
            id="landing-mobile-menu"
            className="border-t border-white/10 py-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-2 py-3 text-sm font-medium text-[#d6dcdf] hover:bg-white/[0.08] hover:text-[#f7f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signin"
                className="rounded-md px-2 py-3 text-sm font-semibold text-[#f7f2ea] hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
                onClick={closeMenu}
              >
                Sign in
              </Link>
              <Button
                className="mt-2 h-11 rounded-md border-0 bg-[#ff4f0f] text-sm font-semibold text-white shadow-none hover:bg-[#ff6b3d] focus-visible:ring-[#ff9a6c]"
                asChild
              >
                <Link href="/dashboard" onClick={closeMenu}>
                  Explore Challenges
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
