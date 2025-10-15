import Navbar from "@/components/navbar";
import { MobileVerificationChecker } from "@/components/auth/mobile-verification-checker";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileVerificationChecker>
      <div className="flex flex-col h-screen">
        {/* Fixed navbar at the top */}
        <Navbar />
        
        {/* Main content area with calculated height */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </MobileVerificationChecker>
  );
}
