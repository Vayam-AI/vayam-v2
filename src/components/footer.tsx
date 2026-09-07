import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#DAD7D1] bg-white">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex rounded-sm text-lg font-semibold text-[#201D1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
            >
              vayam
            </Link>
            <p className="mt-3 text-sm leading-6 text-[#8A857D]">
              A question first. Then what people see.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm text-[#8A857D] sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <Link
              href="/contact"
              className="rounded-sm transition-colors hover:text-[#201D1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#201D1A]"
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
