"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { emailSigninSchema, type EmailSigninData } from "@/validators/auth";
import { toast } from "sonner";
import Link from "next/link";
import Loading from "@/components/ui/loading";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailSigninData>({
    resolver: zodResolver(emailSigninSchema),
  });

  const onSubmit = async (data: EmailSigninData) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Handle specific authentication errors with clear messages
        if (result.error === 'CredentialsSignin') {
          toast.error("Invalid email or password. Please check your credentials and try again.");
        } else if (result.error.includes("Google account")) {
          toast.error("This email is registered with Google. Please use the 'Sign in with Google' button instead.");
        } else if (result.error.includes("verify your email")) {
          toast.error("Please verify your email address before signing in. Check your inbox for the verification code.");
        } else if (result.error.includes("Email and password are required")) {
          toast.error("Please enter both email and password.");
        } else if (result.error.includes("Invalid email or password")) {
          toast.error("The email or password you entered is incorrect. Please try again.");
        } else if (result.error === "OAuthAccountNotLinked") {
          toast.error("This email is registered with a different sign-in method. Please use the correct sign-in option.");
        } else if (result.error === "Configuration") {
          toast.error("Authentication service is temporarily unavailable. Please try again later.");
        } else if (result.error.includes("Database error")) {
          toast.error("Server error occurred. Please try again in a moment.");
        } else {
          // Show the exact error message for any other cases
          toast.error(result.error);
        }
      } else if (result?.ok) {
        toast.success("Welcome back! Redirecting...");
        
        // Use Next.js router for navigation
        try {
          const response = await fetch('/api/auth/check-mobile-status');
          const data = await response.json();
          
          if (data.needsMobileVerification) {
            router.push("/mobile-auth");
          } else {
            router.push("/dashboard");
          }
        } catch {
          // If check fails, redirect to dashboard anyway
          router.push("/dashboard");
        }
      } else {
        toast.error("Sign in failed. Please check your credentials and try again.");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-md" 
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing In..."
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <GoogleAuthButton 
            mode="signin" 
            disabled={isLoading}
            onLoadingChange={setIsLoading}
          />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link 
                href="/signup" 
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}