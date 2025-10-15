"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import Loading from "../ui/loading";

export function MobileVerificationChecker({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const hasChecked = useRef(false);
  const lastSessionId = useRef<string | null>(null);
  const hasShownToast = useRef(false);

  useEffect(() => {
    const checkMobileVerification = async () => {
      // Skip check if not authenticated, already on mobile-auth page, or on auth pages
      if (status === "loading") {
        setIsChecking(true);
        setShouldRender(false);
        return;
      }

      if (!session || 
          pathname === "/mobile-auth" || 
          pathname.startsWith("/signin") || 
          pathname.startsWith("/signup") ||
          pathname.startsWith("/auth/") ||
          pathname === "/") {
        setIsChecking(false);
        setShouldRender(true);
        hasChecked.current = true;
        return;
      }

      // Check if this is a new session
      const currentSessionId = session.user?.id;
      const isNewSession = lastSessionId.current !== currentSessionId;
      
      if (isNewSession) {
        // Reset flags for new session
        hasChecked.current = false;
        hasShownToast.current = false;
        lastSessionId.current = currentSessionId || null;
      }

      // Prevent multiple checks for the same session
      if (hasChecked.current) {
        return;
      }

      hasChecked.current = true;
      setIsChecking(true);
      setShouldRender(false);

      try {
        const response = await axios.get('/api/auth/check-mobile-status', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        const data = response.data;
        
        if (data.needsMobileVerification) {
          // Only show toast once per session
          if (!hasShownToast.current) {
            toast("Please verify your mobile number to continue");
            hasShownToast.current = true;
          }
          router.replace("/mobile-auth");
          return;
        }
        
        setShouldRender(true);
      } catch (error) {
        console.error("Mobile verification check failed:", error);
        // If check fails, allow access anyway
        setShouldRender(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkMobileVerification();
  }, [session, status, router, pathname]);

  if (isChecking || !shouldRender) {
    return (
     <Loading/>
    );
  }

  return <>{children}</>;
}