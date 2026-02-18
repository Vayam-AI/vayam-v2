"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Building2,
  Globe,
  Link2,
  Save,
  RefreshCw,
  Copy,
  Check,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoaderOne } from "@/components/ui/loader";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";

interface OrgSettings {
  id: number;
  name: string;
  domain: string | null;
  accessLink: string | null;
  isActive: boolean;
  isLinkAccessEnabled: boolean;
  accessLinkExpiresAt: string | null;
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<OrgSettings | null>(null);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [orgName, setOrgName] = useState("");
  const [domain, setDomain] = useState("");
  const [linkEnabled, setLinkEnabled] = useState(true);

  const isAdmin = isAdminUser(session?.user?.role);

  const fetchOrg = useCallback(async () => {
    try {
      const res = await axios.get("/api/organizations/me");
      if (res.data.success && res.data.data) {
        const o = res.data.data;
        setOrg(o);
        setOrgName(o.name);
        setDomain(o.domain || "");
        setLinkEnabled(o.isLinkAccessEnabled);
      }
    } catch {
      toast.error("Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchOrg();
  }, [isAdmin, fetchOrg]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await axios.patch(`/api/organizations/${org.id}`, {
        name: orgName.trim(),
        domain: domain.trim() || null,
        isLinkAccessEnabled: linkEnabled,
      });
      toast.success("Settings saved");
      fetchOrg();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to save settings";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateLink = async () => {
    if (!org) return;
    if (!confirm("Regenerate access link? The old link will stop working."))
      return;
    try {
      const res = await axios.post(`/api/organizations/${org.id}/regenerate-link`);
      if (res.data.success) {
        toast.success("Access link regenerated");
        fetchOrg();
      }
    } catch {
      toast.error("Failed to regenerate link");
    }
  };

  const copyAccessLink = () => {
    if (!org?.accessLink) return;
    const url = `${window.location.origin}/join/${org.accessLink}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderOne />
      </div>
    );

  if (!org)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No organization found.</p>
      </div>
    );

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization settings and access controls.
          </p>
        </motion.div>

          {/* Organization Info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" /> Organization Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>
              <div>
                <Label>Domain</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="company.com"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Users with this email domain can auto-join your organization.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Status</Label>
                  <p className="text-xs text-muted-foreground">
                    Organization active status
                  </p>
                </div>
                <Badge
                  variant={org.isActive ? "default" : "secondary"}
                  className={org.isActive ? "bg-green-600" : ""}
                >
                  {org.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Access Link */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 className="h-5 w-5" /> Access Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Link Access Enabled</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow users to join via access link or QR code
                  </p>
                </div>
                <Switch
                  checked={linkEnabled}
                  onCheckedChange={setLinkEnabled}
                />
              </div>
              {org.accessLink && (
                <div>
                  <Label className="text-sm mb-1 block">Current Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/join/${org.accessLink}`}
                      className="text-sm font-mono"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyAccessLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {org.accessLinkExpiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires: {new Date(org.accessLinkExpiresAt).toLocaleDateString()}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateLink}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Regenerate Link
              </Button>
            </CardContent>
          </Card>

          {/* Admin Info */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" /> Admin Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Email</span>
                <span className="text-sm font-medium">
                  {session?.user?.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Org ID</span>
                <span className="text-sm font-mono">{org.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Role</span>
                <Badge variant="default" className="text-xs">{session?.user?.role || "admin"}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Settings"}
            </Button>
          </div>
      </div>
    </div>
  );
}
