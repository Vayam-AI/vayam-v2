"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoaderOne } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Settings,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfile {
  uid: number;
  email: string;
  mobile: string | null;
  provider: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    mobile: "",
  });

  // Fetch profile data from API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/profile");
      
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData({
          mobile: profileData.mobile || "",
        });
      } else {
        toast.error("Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/signin");
      return;
    }

    fetchProfile();
  }, [session, status, router]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put("/api/profile", {
        mobile: formData.mobile || null,
      });
      
      if (response.data.success) {
        setProfile(response.data.data);
        toast.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        mobile: profile.mobile || "",
      });
    }
    setIsEditing(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Failed to load profile</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
             
            </div>
            
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <User className="w-10 h-10 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Profile
              </h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
          </motion.div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{profile.email}</span>
                    {profile.isEmailVerified ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Mobile */}
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  {isEditing ? (
                    <div className="space-y-1">
                      <Input
                        id="mobile"
                        type="tel"
                        placeholder="Enter mobile number (e.g., 9876543210 or +919876543210)"
                        value={formData.mobile}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                        }
                        className="max-w-md"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter 10 digits or with country code (+91)
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {profile.mobile ? (
                        <>
                          <span className="text-foreground">{profile.mobile}</span>
                          {profile.isMobileVerified ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Not Verified
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Not provided</span>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Provider */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sign-in Method</Label>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground capitalize">
                      {profile.provider === "google" ? "Google Account" : "Email & Password"}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Account Created */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Member Since</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSave} size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm" disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
}