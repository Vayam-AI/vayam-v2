"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: number | null;
  questionTitle?: string;
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  questionId,
  questionTitle,
}: EmailTemplateDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variables, setVariables] = useState<string[]>([]);

  const fetchTemplate = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/admin/questions/${questionId}/email-template`
      );
      const data = res.data.data;
      if (data) {
        setSubject(data.subject || "");
        setBody(data.body || "");
      } else {
        // Use defaults from API
        setSubject(res.data.defaults?.subject || "");
        setBody(res.data.defaults?.body || "");
      }
      setVariables(res.data.availableVariables || []);
    } catch {
      toast.error("Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (open && questionId) fetchTemplate();
  }, [open, questionId, fetchTemplate]);

  const handleSave = async () => {
    if (!questionId) return;
    setSaving(true);
    try {
      await axios.put(`/api/admin/questions/${questionId}/email-template`, {
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success("Template saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Email Template
            {questionTitle && (
              <span className="block text-sm font-normal text-muted-foreground mt-1 truncate">
                {questionTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="You've been invited to share your expertise"
              />
            </div>

            <div>
              <Label>Body</Label>
              <Textarea
                rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email body here…"
                className="font-mono text-sm"
              />
            </div>

            {variables.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Available variables (use in subject or body):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <Badge
                      key={v}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => {
                        setBody((prev) => prev + `{{${v}}}`);
                      }}
                    >
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
