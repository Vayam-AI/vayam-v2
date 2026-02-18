"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, QrCode } from "lucide-react";
import { AccessMethod, Organization } from "@/types/vayam";

export function CreateOrganization() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    organization: Organization;
    accessUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    accessMethod: "link_qr" as AccessMethod,
    domain: "",
    whitelistedEmails: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const whitelistedEmailsArray = formData.whitelistedEmails
        .split("\n")
        .map(email => email.trim())
        .filter(email => email.length > 0);

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          accessMethod: formData.accessMethod,
          domain: formData.accessMethod === "domain" ? formData.domain : undefined,
          whitelistedEmails: formData.accessMethod === "whitelist" ? whitelistedEmailsArray : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data);
        setFormData({
          name: "",
          accessMethod: "link_qr",
          domain: "",
          whitelistedEmails: "",
        });
      } else {
        setError(data.error || "Failed to create organization");
      }
    } catch {
      setError("Failed to create organization. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Set up a new organization workspace with controlled access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corporation"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-3">
              <Label>Access Method</Label>
              <RadioGroup
                value={formData.accessMethod}
                onValueChange={(value) =>
                  setFormData({ ...formData, accessMethod: value as AccessMethod })
                }
                disabled={isSubmitting}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="link_qr" id="link_qr" />
                  <Label htmlFor="link_qr" className="flex-1 cursor-pointer">
                    <div className="font-medium">Link / QR Code</div>
                    <div className="text-sm text-muted-foreground">
                      Anyone with the link can join (public access)
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="domain" id="domain" />
                  <Label htmlFor="domain" className="flex-1 cursor-pointer">
                    <div className="font-medium">Company Email Domain</div>
                    <div className="text-sm text-muted-foreground">
                      Only users with @company.com emails can join
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="whitelist" id="whitelist" />
                  <Label htmlFor="whitelist" className="flex-1 cursor-pointer">
                    <div className="font-medium">Email Whitelist</div>
                    <div className="text-sm text-muted-foreground">
                      Only pre-approved emails can join
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.accessMethod === "domain" && (
              <div className="space-y-2">
                <Label htmlFor="domain">Company Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="company.com"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Enter only the domain (e.g., company.com, not @company.com)
                </p>
              </div>
            )}

            {formData.accessMethod === "whitelist" && (
              <div className="space-y-2">
                <Label htmlFor="emails">Whitelisted Emails</Label>
                <Textarea
                  id="emails"
                  value={formData.whitelistedEmails}
                  onChange={(e) => setFormData({ ...formData, whitelistedEmails: e.target.value })}
                  placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                  rows={6}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  Enter one email address per line
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating..." : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {success && (
        <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Organization Created Successfully!
            </CardTitle>
            <CardDescription>
              {success.organization.name} is now ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Organization ID</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  {success.organization.id}
                </code>
              </div>
            </div>

            {success.accessUrl && (
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Access Link
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                    {success.accessUrl}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(success.accessUrl!)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this link or generate a QR code for users to join
                </p>
              </div>
            )}

            {formData.accessMethod === "domain" && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <p className="text-sm">
                  <strong>Domain Access:</strong> Users with emails ending in{" "}
                  <Badge variant="secondary">@{success.organization.domain}</Badge> can now register
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
