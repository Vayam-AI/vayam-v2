"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Eye, EyeOff, Building2, Globe, ArrowLeft } from "lucide-react";
import Loading from "@/components/ui/loading";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { PasswordStrength } from "@/components/ui/password-strength";
import { signIn } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { otpVerificationSchema, type OTPVerificationData } from "@/validators/auth";

// ---------- Validation ----------
const adminSignupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^\w\s]/, "Must include a special character"),
    confirmPassword: z.string(),
    companyName: z.string().min(2, "Company name is required"),
    companyDomain: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type AdminSignupData = z.infer<typeof adminSignupSchema>;

// ---------- Component ----------
function AdminSignupContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");

  const form = useForm<AdminSignupData>({
    resolver: zodResolver(adminSignupSchema),
  });

  const otpForm = useForm<OTPVerificationData>({
    resolver: zodResolver(otpVerificationSchema),
  });

  const passwordValue = form.watch("password") || "";

  // ---- Step 1: Create admin account ----
  const onSubmit = async (data: AdminSignupData) => {
    setIsLoading(true);
    try {
      await axios.post("/api/auth/admin-signup", {
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        companyDomain: data.companyDomain || undefined,
      });

      toast.success("Admin account created! Check your email for the verification code.");
      setUserEmail(data.email);
      setUserPassword(data.password);
      setStep("verify");
      otpForm.setValue("email", data.email);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to create admin account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Step 2: Verify OTP ----
  const onOtpSubmit = async (data: OTPVerificationData) => {
    setIsVerifying(true);
    try {
      await axios.post("/api/auth/verify-otp", {
        email: data.email,
        otp: data.otp,
      });

      toast.success("Email verified! Signing you in…");

      const result = await signIn("credentials", {
        email: userEmail,
        password: userPassword,
        redirect: false,
      });

      if (result?.ok) {
        setUserPassword("");
        router.push("/admin/company-users");
      } else {
        toast.success("Verified! Please sign in.");
        router.push("/signin");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await axios.post("/api/auth/send-otp", { email: userEmail });
      toast.success("New verification code sent!");
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to resend code.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          {step === "verify" && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 p-2"
              onClick={() => {
                setStep("form");
                setUserPassword("");
              }}
              disabled={isVerifying || isResending}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">
            {step === "form" ? "Admin Sign Up" : "Verify Email"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === "form"
              ? "Create your company admin account"
              : "Enter the code sent to your email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "form" ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyName"
                    placeholder="Acme Inc."
                    className="pl-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                    {...form.register("companyName")}
                  />
                </div>
                {form.formState.errors.companyName && (
                  <p className="text-sm text-destructive font-medium">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Company Domain (optional) */}
              <div className="space-y-2">
                <Label htmlFor="companyDomain" className="text-sm font-medium">
                  Company Domain{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyDomain"
                    placeholder="acme.com"
                    className="pl-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                    {...form.register("companyDomain")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Users with this email domain will auto-join your organization.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Admin Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    className="pl-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                    {...form.register("email")}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive font-medium">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="pl-10 pr-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                    {...form.register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive font-medium">
                    {form.formState.errors.password.message}
                  </p>
                )}
                <PasswordStrength password={passwordValue} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-11 border-input bg-background/50 focus:bg-background transition-colors"
                    {...form.register("confirmPassword")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive font-medium">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-all duration-200 hover:shadow-md"
                disabled={isLoading}
              >
                {isLoading ? "Creating…" : "Create Admin Account"}
              </Button>
            </form>
          ) : (
            /* ---- OTP Verification ---- */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={userEmail}
                    className="pl-10 h-11 bg-muted/50"
                    disabled
                  />
                </div>
              </div>

              <form
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpForm.watch("otp") || ""}
                      onChange={(v) => otpForm.setValue("otp", v)}
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
                  disabled={isVerifying || isResending}
                >
                  {isVerifying ? "Verifying…" : "Verify Email"}
                </Button>
              </form>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-medium"
                onClick={handleResendOTP}
                disabled={isVerifying || isResending}
              >
                {isResending ? "Resending…" : "Resend Code"}
              </Button>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Not an admin?{" "}
              <Link
                href="/signup"
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign up as a user
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminSignupContent />
    </Suspense>
  );
}
