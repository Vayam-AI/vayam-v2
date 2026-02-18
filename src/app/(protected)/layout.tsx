"use client"
import Navbar from "@/components/navbar";
import { MobileVerificationChecker } from "@/components/auth/mobile-verification-checker";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/ui/loading";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users to sign in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/signin");
    }
  }, [status, router]);

  // Show loading while checking auth
  if (status === "loading") {
    return <Loading />;
  }

  // Block rendering until authenticated
  if (!session) {
    return <Loading />;
  }

  return (
    <MobileVerificationChecker>
      <div className="flex flex-col h-screen">
        {/* Fixed navbar at the top */}
        <Navbar />

        {/* Main content area with calculated height */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">{children}</div>
        </main>
      </div>
    </MobileVerificationChecker>
  );
}
