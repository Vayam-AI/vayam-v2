"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserInfo {
  email: string;
  personalEmail: string | null;
  userType: string;
}

export function ExplorePublicButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [showPersonalEmailDialog, setShowPersonalEmailDialog] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [personalEmail, setPersonalEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserInfo();
    }
  }, [session]);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch("/api/users/personal-email");
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (err) {
      console.error("Failed to fetch user info:", err);
    }
  };

  const handleExploreClick = () => {
    if (!userInfo) return;

    // If regular user, just navigate
    if (userInfo.userType === "regular") {
      router.push("/dashboard");
      return;
    }

    // If private user with personal email, navigate
    if (userInfo.personalEmail) {
      router.push("/dashboard");
      return;
    }

    // If private user without personal email, show warning
    setShowWarning(true);
  };

  const handleAddPersonalEmail = async () => {
    if (!personalEmail || !personalEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/users/personal-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPersonalEmailDialog(false);
        setShowWarning(false);
        setUserInfo({ ...userInfo!, personalEmail });
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to add personal email");
      }
    } catch {
      setError("Failed to add personal email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show button for private users
  if (!userInfo || userInfo.userType === "regular") {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleExploreClick}
        className="flex items-center gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Explore Public Conversations
      </Button>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Company Email Detected
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p>
                You are currently using your company email ({userInfo?.email}).
                To access public conversations, please switch to your personal
                email.
              </p>
              <p className="font-medium text-foreground">
                Would you like to add a personal email address now?
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWarning(false)}>
              Not Now
            </Button>
            <Button
              onClick={() => {
                setShowWarning(false);
                setShowPersonalEmailDialog(true);
              }}
            >
              Add Personal Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Personal Email Dialog */}
      <Dialog
        open={showPersonalEmailDialog}
        onOpenChange={setShowPersonalEmailDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Personal Email</DialogTitle>
            <DialogDescription>
              Add your personal email address to access public conversations
              and retain account access even if you lose access to your work
              email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="work-email">Current Work Email</Label>
              <Input
                id="work-email"
                value={userInfo?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal-email">Personal Email</Label>
              <Input
                id="personal-email"
                type="email"
                placeholder="your.email@example.com"
                value={personalEmail}
                onChange={(e) => {
                  setPersonalEmail(e.target.value);
                  setError("");
                }}
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPersonalEmailDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddPersonalEmail} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
