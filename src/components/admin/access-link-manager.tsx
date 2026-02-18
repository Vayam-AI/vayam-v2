"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderOne } from "@/components/ui/loader";
import { Copy, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface AccessLinkManagerProps {
  organizationId: number;
  organizationName: string;
}

export function AccessLinkManager({ organizationId, organizationName }: AccessLinkManagerProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [linkData, setLinkData] = useState<{
    token?: string;
    shareUrl?: string;
    isEnabled: boolean;
    usageCount: number;
    expiresAt?: string;
  } | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const loadAccessLink = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/access-links?organizationId=${organizationId}`);
      const data = await response.json();

      if (response.ok) {
        setLinkData(data);
        if (data.token) {
          // Load QR code
          setQrCodeUrl(`/api/organizations/access-links/qr?token=${data.token}`);
        }
      }
    } catch (error) {
      console.error("Error loading access link:", error);
      toast.error("Failed to load access link");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadAccessLink();
  }, [loadAccessLink]);

  const generateLink = async () => {
    try {
      setGenerating(true);
      const response = await fetch("/api/organizations/access-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organizationId,
          options: {
            accessType: "public_link",
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Access link generated successfully");
        await loadAccessLink();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error generating link:", error);
      toast.error("Failed to generate access link");
    } finally {
      setGenerating(false);
    }
  };

  const revokeLink = async () => {
    if (!confirm("Are you sure you want to revoke this access link? This will prevent new users from joining via this link.")) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/access-links?organizationId=${organizationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Access link revoked successfully");
        await loadAccessLink();
      }
    } catch (error) {
      console.error("Error revoking link:", error);
      toast.error("Failed to revoke access link");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoaderOne />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link/QR Access</CardTitle>
        <CardDescription>
          Share a public link or QR code to allow anyone to join {organizationName}. 
          Users joining via this link can use any email address and will be treated as regular users.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!linkData?.token ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No access link has been generated yet.
            </p>
            <Button onClick={generateLink} disabled={generating}>
              {generating ? "Generating..." : "Generate Access Link"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shareUrl">Share Link</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="shareUrl"
                    value={linkData.shareUrl || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(linkData.shareUrl || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(linkData.shareUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Usage Count</Label>
                  <p className="text-2xl font-bold">{linkData.usageCount}</p>
                </div>
                {linkData.expiresAt && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Expires</Label>
                    <p className="text-sm">
                      {new Date(linkData.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {qrCodeUrl && (
                <div className="space-y-2">
                  <Label>QR Code</Label>
                  <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg border">
                    <Image
                      src={qrCodeUrl}
                      alt="QR Code"
                      width={256}
                      height={256}
                      className="w-64 h-64"
                    />
                    <p className="text-xs text-center text-muted-foreground">
                      Scan this QR code to join {organizationName}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={generateLink}
                disabled={generating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Link
              </Button>
              <Button
                variant="destructive"
                onClick={revokeLink}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Revoke Link
              </Button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Anyone with this link or QR code can join your organization. 
                They can register with any email address and will have access to your organization&apos;s content 
                as well as public conversations.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
