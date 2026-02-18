"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LandingNavbar() {
    return (
        <nav className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logo.png"
                                alt="Vayam Logo"
                                width={100}
                                height={16}
                                className="rounded-lg cursor-pointer"
                            />
                        </Link>
                    </div>
                    <div className="flex gap-5">
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                                About
                            </Link>
                            <Link href="/invite-sme" className="text-gray-300 hover:text-white transition-colors">
                                Become an SME
                            </Link>
                            <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                                Contact
                            </Link>
                        </div>
                        <Button
                            className="bg-linear-to-r from-[#ff4f0f] to-[#ff6b3d] hover:from-[#ff6b3d] hover:to-[#ff8560] text-white border-0 shadow-lg shadow-[#ff4f0f]/30"
                            asChild
                        >
                            <Link href="/signin">Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
