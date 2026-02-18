"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoaderOne as Loader } from "@/components/ui/loader";
import { CreateOrganization } from "@/components/create-organization";
import { AccessLinkManager } from "@/components/admin/access-link-manager";
import { Copy, Check, Users, Link as LinkIcon, Shield } from "lucide-react";
import { Organization } from "@/types/vayam";

export default function OrganizationManagementPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      }
    } catch (error) {
      console.error("Failed to fetch organization:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your organization workspace
          </p>
        </div>
        <CreateOrganization />
      </div>
    );
  }

  const accessUrl = organization.accessLink
    ? `${window.location.origin}/join/${organization.accessLink}`
    : null;

  const getAccessMethodBadge = () => {
    if (organization.accessLink) {
      return <Badge variant="outline"><LinkIcon className="h-3 w-3 mr-1" />Link/QR Access</Badge>;
    }
    if (organization.domain) {
      return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Domain: @{organization.domain}</Badge>;
    }
    if (organization.whitelistedEmails && organization.whitelistedEmails.length > 0) {
      return <Badge variant="outline"><Users className="h-3 w-3 mr-1" />Whitelist ({organization.whitelistedEmails.length} emails)</Badge>;
    }
    return null;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization workspace and access settings
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{organization.name}</CardTitle>
                <CardDescription>
                  Organization ID: {organization.id}
                </CardDescription>
              </div>
              {getAccessMethodBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={organization.isActive ? "default" : "destructive"}>
                    {organization.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {accessUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Access Link</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                      {accessUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(accessUrl)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this link with users to allow them to join your organization
                  </p>
                </div>
              )}

              {organization.domain && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company Domain</label>
                  <div className="mt-1">
                    <code className="p-2 bg-muted rounded text-sm">@{organization.domain}</code>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only users with this email domain can register
                  </p>
                </div>
              )}

              {organization.whitelistedEmails && organization.whitelistedEmails.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Whitelisted Emails ({organization.whitelistedEmails.length})
                  </label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    <div className="space-y-1">
                      {organization.whitelistedEmails.map((email, index) => (
                        <div key={index} className="text-sm font-mono">
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="mt-1 text-sm">
                  {new Date(organization.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for managing your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href="/admin/questions">
                <Users className="h-4 w-4 mr-2" />
                Manage Questions
              </a>
            </Button>
            {accessUrl && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.open(accessUrl, '_blank')}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Preview Join Page
              </Button>
            )}
          </CardContent>
        </Card>

        <AccessLinkManager 
          organizationId={organization.id} 
          organizationName={organization.name} 
        />

        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>For assistance with organization management:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Contact support at support@vayam.app</li>
              <li>Check the documentation for detailed guides</li>
              <li>Visit our help center for FAQs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
