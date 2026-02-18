"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderTwo as Loader } from "@/components/ui/loader";
import { AlertCircle, CheckCircle } from "lucide-react";

interface OrganizationInfo {
  id: number;
  name: string;
}

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const accessLink = params.accessLink as string;
  
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateAccessLink();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLink]);

  const validateAccessLink = async () => {
    try {
      const response = await fetch(`/api/organizations/validate/${accessLink}`);
      const data = await response.json();

      if (data.valid && data.organization) {
        setOrganization(data.organization);
      } else {
        setError(data.error || "Invalid access link");
      }
    } catch {
      setError("Failed to validate access link");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    router.push(`/signup?accessLink=${accessLink}`);
  };

  const handleSignIn = () => {
    router.push(`/signin?accessLink=${accessLink}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Join {organization?.name}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join {organization?.name}&apos;s workspace on Vayam. 
            You can register with any email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">What you&apos;ll get access to:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Access to {organization?.name}&apos;s conversations</li>
              <li>Participate in surveys and discussions</li>
              <li>Collaborate with team members</li>
              <li>Access to all public civic conversations</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
              Link/QR Access
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Anyone with this link or QR code can join and participate. You&apos;ll be treated as a regular user 
              with access to both this organization&apos;s content and public community discussions.
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleJoin} className="w-full" size="lg">
              Create Account
            </Button>
            <Button 
              onClick={handleSignIn} 
              variant="outline" 
              className="w-full"
            >
              Already have an account? Sign In
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By joining, you agree to Vayam&apos;s Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
