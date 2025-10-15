"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

const errorMessages = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "This email is already registered with a different provider. Please use the correct sign-in method.",
  Verification: "The verification link is invalid or has expired.",
  OAuthAccountNotLinked: "This email is already registered with a different provider. Please sign in with your email and password instead.",
  OAuthCallbackError: "This email is already registered with a different provider. Please use the correct sign-in method.",
  CredentialsSignin: "Invalid credentials or this email is registered with Google. Please use the correct sign-in method.",
  Default: "An error occurred during authentication.",
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  
  const errorMessage = errorMessages[error as keyof typeof errorMessages] || errorMessages.Default;
  
  // Determine which provider the user should use
  const isProviderMismatch = [
    "OAuthAccountNotLinked", 
    "OAuthCallbackError", 
    "CredentialsSignin"
  ].includes(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isProviderMismatch ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Try signing in with the correct method:
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/signin">Sign In with Email & Password</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/api/auth/signin/google">Sign In with Google</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/signin">Try Sign In</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">Create New Account</Link>
              </Button>
            </div>
          )}
          
          <div className="mt-4 text-center text-sm">
            <Link href="/" className="text-blue-600 hover:underline">
              Go back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}