"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#171a19]">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
            >
              <Image
                src="/logo.png"
                alt="Vayam"
                width={92}
                height={35}
                className="h-auto w-[92px] rounded-lg"
              />
            </Link>
            <p className="mt-3 text-sm leading-6 text-[#a7b2b7]">
              Collective intelligence for constructive civic participation.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-[#a7b2b7] sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <Link
              href="/contact"
              className="rounded-md transition-colors hover:text-[#f7f2ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a45]"
            >
              Contact
            </Link>
            <span>&copy; {year} Vayam</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
