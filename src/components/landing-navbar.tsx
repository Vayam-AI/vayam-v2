"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type LandingNavbarProps = {
  variant?: "dark" | "notation";
};

export function LandingNavbar({ variant = "dark" }: LandingNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isNotation = variant === "notation";

  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { href: "/#discussions", label: "Discussions" },
    { href: "/#learn", label: "Learn" },
    { href: "/#why-vayam", label: "Why Vayam" },
  ];

  if (isNotation) {
    return (
      <nav className="sticky top-0 z-50 border-b border-[#DAD7D1] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-sm text-xl font-semibold tracking-normal text-[#201D1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
              onClick={closeMenu}
            >
              vayam
            </Link>

            <div className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm text-sm font-medium text-[#201D1A] transition-colors hover:text-[#8A857D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signin"
                className="rounded-sm text-sm font-medium text-[#201D1A] transition-colors hover:text-[#8A857D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
              >
                Sign in
              </Link>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-sm text-[#201D1A] hover:bg-[#F6F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A] md:hidden"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              aria-controls="landing-mobile-menu"
              onClick={() => setIsOpen((current) => !current)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {isOpen && (
            <div
              id="landing-mobile-menu"
              className="border-t border-[#DAD7D1] py-4 md:hidden"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-sm px-1 py-3 text-base font-medium text-[#201D1A] hover:bg-[#F6F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#201D1A]"
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/signin"
                  className="rounded-sm px-1 py-3 text-base font-medium text-[#201D1A] hover:bg-[#F6F5F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#201D1A]"
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#131514]/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f2ea]"
            onClick={closeMenu}
          >
            <span className="text-xl font-semibold tracking-normal text-[#f7f2ea]">
              vayam
            </span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md text-sm font-medium text-[#cbd4d8] transition-colors hover:text-[#f7f2ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f2ea]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/signin"
              className="rounded-md text-sm font-semibold text-[#f7f2ea] transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f2ea]"
            >
              Sign in
            </Link>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-[#f7f2ea] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f2ea] md:hidden"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
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
                  className="rounded-md px-2 py-3 text-sm font-medium text-[#d6dcdf] hover:bg-white/[0.08] hover:text-[#f7f2ea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7f2ea]"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signin"
                className="rounded-md px-2 py-3 text-sm font-semibold text-[#f7f2ea] hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f7f2ea]"
                onClick={closeMenu}
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
