"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { LoaderOne } from "@/components/ui/loader";
import Loading from "@/components/ui/loading";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { PasswordStrength } from "@/components/ui/password-strength";
import { signIn } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { 
  emailSignupSchema, 
  otpVerificationSchema, 
  type EmailSignupData, 
  type OTPVerificationData 
} from "@/validators/auth";

function SignUpPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<"signup" | "verify">("signup");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [hasStartedEmailSignup, setHasStartedEmailSignup] = useState(false);

  const signupForm = useForm<EmailSignupData>({
    resolver: zodResolver(emailSignupSchema),
  });

  const otpForm = useForm<OTPVerificationData>({
    resolver: zodResolver(otpVerificationSchema),
  });

  const passwordValue = signupForm.watch("password") || "";

  const onSignupSubmit = async (data: EmailSignupData) => {
    setIsLoading(true);

    try {
      await axios.post('/api/auth/signup', {
        email: data.email,
        password: data.password,
        username: data.email.split('@')[0] // Generate username from email
      });

      toast.success("Account created! Please check your email for the verification code.");
      setUserEmail(data.email);
      setUserPassword(data.password);
      setHasStartedEmailSignup(true);
      setCurrentStep("verify");
      otpForm.setValue("email", data.email);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Handle specific error cases with user-friendly messages
        if (errorMessage.includes("already exists") && errorMessage.includes("Google")) {
          toast.error("This email is already registered with Google. Please sign in with Google instead.");
        } else if (errorMessage.includes("already exists")) {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else if (errorMessage.includes("Invalid email format")) {
          toast.error("Please enter a valid email address.");
        } else if (errorMessage.includes("Password validation failed")) {
          toast.error("Password is too weak. Please choose a stronger password.");
        } else if (errorMessage.includes("Failed to send verification email")) {
          toast.error("Unable to send verification email. Please try again.");
        } else if (errorMessage.includes("required")) {
          toast.error("Please fill in all required fields.");
        } else {
          // Show the exact error message from the API
          toast.error(errorMessage);
        }
      } else if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          toast.error("Request timed out. Please check your connection and try again.");
        } else if (error.response?.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to create account. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (data: OTPVerificationData) => {
    setIsLoading(true);

    try {
      await axios.post('/api/auth/verify-otp', {
        email: data.email,
        otp: data.otp,
      });
      toast.success("Email verified successfully! Signing you in...");
      
      const signInResult = await signIn("credentials", {
        email: userEmail,
        password: userPassword,
        redirect: false,
      });
      
      if (signInResult?.ok) {
        setUserPassword("");
        router.push(redirectTo);
      } else {
        toast.success("Email verified successfully! Please sign in with your credentials.");
        router.push(`/signin?redirect=${encodeURIComponent(redirectTo)}`);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Handle specific OTP error cases
        if (errorMessage.includes("Invalid or expired OTP")) {
          toast.error("The verification code is invalid or has expired. Please request a new one.");
        } else if (errorMessage.includes("User not found")) {
          toast.error("Account not found. Please sign up again.");
        } else if (errorMessage.includes("required")) {
          toast.error("Please enter the verification code.");
        } else {
          toast.error(errorMessage);
        }
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error("Invalid verification code. Please check and try again.");
        } else if (error.response?.status === 404) {
          toast.error("Account not found. Please sign up again.");
        } else {
          toast.error("Verification failed. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred during verification.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      await axios.post('/api/auth/send-otp', {
        email: userEmail,
      });
      toast.success("New verification code sent to your email!");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        
        // Handle specific resend OTP error cases
        if (errorMessage.includes("already sent")) {
          const retryAfter = error.response.data.retryAfter;
          const seconds = Math.ceil(retryAfter || 180);
          toast.error(`Please wait ${seconds} seconds before requesting a new code.`);
        } else if (errorMessage.includes("Invalid email format")) {
          toast.error("Invalid email address.");
        } else if (errorMessage.includes("Failed to send email")) {
          toast.error("Unable to send verification email. Please check your email address.");
        } else if (errorMessage.includes("required")) {
          toast.error("Email address is required.");
        } else {
          toast.error(errorMessage);
        }
      } else if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          toast.error("Too many requests. Please wait before requesting a new code.");
        } else if (error.response?.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to send verification code. Please try again.");
        }
      } else {
        toast.error("An unexpected error occurred while sending the code.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToSignup = () => {
    setCurrentStep("signup");
    setUserPassword("");
    setHasStartedEmailSignup(false);
    otpForm.reset();
  };

  if (isLoading) {
    return (
      <Loading/>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center space-x-2">
            {currentStep === "verify" && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 p-2"
                onClick={goBackToSignup}
                disabled={isLoading}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardTitle className="text-3xl font-bold tracking-tight text-primary">
              {currentStep === "signup" ? "Create Account" 
               : currentStep === "verify" ? "Verify Email" 
               : "Add Mobile Number"}
            </CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            {currentStep === "signup" 
              ? "Create your account to get started"
              : currentStep === "verify" 
              ? "Enter the verification code sent to your email"
              : "Add your mobile number for better security (optional)"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentStep === "signup" ? (
            <>
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
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
                      {...signupForm.register("email")}
                    />
                  </div>
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive font-medium">
                      {signupForm.formState.errors.email.message}
                    </p>
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
                      placeholder="Create a strong password"
                      className="pl-10 pr-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                      {...signupForm.register("password")}
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
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive font-medium">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                  <PasswordStrength password={passwordValue} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                      {...signupForm.register("confirmPassword")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive font-medium">
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-md" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                   "Creating..."
                  ) : (
                    "Create Account"
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
                mode="signup" 
                disabled={isLoading || hasStartedEmailSignup}
                onLoadingChange={setIsLoading}
                className={hasStartedEmailSignup ? "opacity-50" : ""}
              />
              
              {hasStartedEmailSignup && (
                <p className="text-xs text-muted-foreground text-center">
                  Please complete your email verification to proceed
                </p>
              )}
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={userEmail}
                      className="pl-10 h-11 bg-muted/50"
                      disabled
                    />
                  </div>
                </div>

                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otpForm.watch("otp") || ""}
                        onChange={(value) => otpForm.setValue("otp", value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {otpForm.formState.errors.otp && (
                      <p className="text-sm text-destructive font-medium text-center">
                        {otpForm.formState.errors.otp.message}
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-md" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoaderOne />
                      </>
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </form>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 text-base font-medium"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoaderOne />
                    ) : (
                      "Resend Code"
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link 
                href="/signin" 
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SignUpPageContent />
    </Suspense>
  );
}