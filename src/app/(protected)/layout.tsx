"use client"
import Navbar from "@/components/navbar";
import { MobileVerificationChecker } from "@/components/auth/mobile-verification-checker";
import { useSession } from "next-auth/react";
import Loading from "@/components/ui/loading";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

    // Show loading while checking auth
  if (status === "loading") {
    return <Loading />;
  }

  // Don't show navbar for unauthenticated users
  if (!session) {
    return <div>{children}</div>;
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
