"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

interface CompanyUser {
  id: number;
  department: string | null;
  name: string;
  email: string;
  isRegistered: boolean;
}

interface AccessEntry {
  id: number;
  companyUserId: number;
  inviteStatus: string;
  companyUser: CompanyUser;
}

interface QuestionAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: number | null;
  questionTitle?: string;
}

export function QuestionAccessDialog({
  open,
  onOpenChange,
  questionId,
  questionTitle,
}: QuestionAccessDialogProps) {
  const [allUsers, setAllUsers] = useState<CompanyUser[]>([]);
  const [accessList, setAccessList] = useState<AccessEntry[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [page, setPage] = useState(1);
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  // Batch tracking for real-time progress
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    done: boolean;
    progress: number;
    failedEmails: string[];
  } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const accessCompanyUserIds = new Set(
    accessList.map((a) => a.companyUserId)
  );

  const fetchData = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const [usersRes, accessRes] = await Promise.all([
        axios.get("/api/admin/company-users"),
        axios.get(`/api/admin/questions/${questionId}/access`),
      ]);
      setAllUsers(usersRes.data.data || []);
      setAccessList(accessRes.data.data || []);
      // Pre-select users who already have access
      const existing = new Set<number>(
        (accessRes.data.data || []).map((a: AccessEntry) => a.companyUserId)
      );
      setSelected(existing);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (open && questionId) {
      setSearch("");
      setPage(1);
      fetchData();
    }
  }, [open, questionId, fetchData]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!questionId) return;
    setSaving(true);
    try {
      // Find newly added
      const toAdd = [...selected].filter((id) => !accessCompanyUserIds.has(id));
      // Find removed
      const toRemove = [...accessCompanyUserIds].filter(
        (id) => !selected.has(id)
      );

      // Grant access to new users
      if (toAdd.length > 0) {
        await axios.post(`/api/admin/questions/${questionId}/access`, {
          companyUserIds: toAdd,
        });
      }

      // Revoke access for removed users
      for (const cuId of toRemove) {
        await axios.delete(`/api/admin/questions/${questionId}/access`, {
          data: { companyUserId: cuId },
        });
      }

      toast.success("Access updated");
      fetchData();
    } catch {
      toast.error("Failed to update access");
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvites = async () => {
    if (!questionId) return;
    setSendingInvites(true);
    setBatchStatus(null);
    setBatchId(null);

    // Clear any previous polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    try {
      const res = await axios.post(
        `/api/admin/questions/${questionId}/send-invites`
      );
      const count = res.data.queued ?? 0;
      const newBatchId = res.data.batchId as string | undefined;

      if (count === 0) {
        toast.info("No pending invites to send");
        setSendingInvites(false);
        return;
      }

      toast.success(`${count} invite(s) queued — tracking progress…`);

      if (newBatchId) {
        setBatchId(newBatchId);
        setBatchStatus({
          total: count,
          completed: 0,
          failed: 0,
          pending: count,
          done: false,
          progress: 0,
          failedEmails: [],
        });

        // Start polling every 2 seconds
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              `/api/admin/email-status/${newBatchId}`
            );
            const d = statusRes.data.data;
            setBatchStatus({
              total: d.total,
              completed: d.completed,
              failed: d.failed,
              pending: d.pending,
              done: d.done,
              progress: d.progress,
              failedEmails: d.failedEmails || [],
            });

            if (d.done) {
              if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
              setSendingInvites(false);
              fetchData();

              if (d.failed === 0) {
                toast.success(
                  `All ${d.completed} invite(s) sent successfully!`
                );
              } else {
                toast.warning(
                  `${d.completed} sent, ${d.failed} failed`
                );
              }
            }
          } catch {
            // Silently continue polling
          }
        }, 2000);
      } else {
        setSendingInvites(false);
      }
    } catch {
      toast.error("Failed to send invites");
      setSendingInvites(false);
    }
  };

  // Clean up polling on unmount or dialog close
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
      setBatchStatus(null);
      setBatchId(null);
      setSendingInvites(false);
    }
  }, [open]);

  // Get unique departments
  const departments = Array.from(
    new Set(allUsers.map((u) => u.department).filter(Boolean) as string[])
  ).sort();

  const filtered = allUsers.filter((u) => {
    const matchesSearch = search
      ? u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department?.toLowerCase() ?? "").includes(search.toLowerCase())
      : true;
    const matchesDept = deptFilter
      ? u.department === deptFilter
      : true;
    return matchesSearch && matchesDept;
  });

  // Select all / deselect helpers
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((u) => selected.has(u.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        // Deselect all currently filtered
        filtered.forEach((u) => next.delete(u.id));
      } else {
        // Select all currently filtered
        filtered.forEach((u) => next.add(u.id));
      }
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !p-0 !gap-0 [&>button]:top-4 [&>button]:right-4">
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <DialogTitle className="text-lg font-semibold">
            Manage Access
          </DialogTitle>
          {questionTitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {questionTitle}
            </p>
          )}
        </div>

        <div className="border-t" />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="px-6 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Department filter pills + Select All */}
            <div className="px-6 pb-2 space-y-2">
              {/* Select All */}
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={allFilteredSelected}
                  // @ts-expect-error indeterminate is valid
                  indeterminate={someFilteredSelected}
                  onCheckedChange={toggleSelectAll}
                  className="shrink-0"
                />
                <span className="text-sm font-medium">
                  {allFilteredSelected
                    ? `Deselect all (${filtered.length})`
                    : `Select all${deptFilter ? ` in ${deptFilter}` : ""} (${filtered.length})`}
                </span>
              </label>

              {/* Department pills */}
              {departments.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <button
                    onClick={() => {
                      setDeptFilter(null);
                      setPage(1);
                    }}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      deptFilter === null
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    All
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => {
                        setDeptFilter(deptFilter === dept ? null : dept);
                        setPage(1);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                        deptFilter === dept
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User list — fixed height, native scroll */}
            <div className="mx-6 border rounded-md overflow-y-auto max-h-[280px]">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No users found.
                </p>
              ) : (
                <div className="divide-y divide-border/40">
                  {paginated.map((u) => {
                    const hasAccess = accessCompanyUserIds.has(u.id);
                    const entry = accessList.find(
                      (a) => a.companyUserId === u.id
                    );
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selected.has(u.id)}
                          onCheckedChange={() => toggle(u.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-snug truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-muted-foreground leading-snug truncate">
                            {u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {u.department && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {u.department}
                            </Badge>
                          )}
                          {u.isRegistered ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                          {hasAccess && entry && (
                            <Badge
                              variant={
                                entry.inviteStatus === "accepted"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px] px-1.5 py-0 h-5"
                            >
                              {entry.inviteStatus}
                            </Badge>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination + count */}
            <div className="px-6 py-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selected.size} selected · {filtered.length} total
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums min-w-[48px] text-center">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Real-time email sending progress */}
            {batchStatus && (
              <div className="mx-6 mb-2 rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {batchStatus.done ? (
                      batchStatus.failed === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    <span className="text-sm font-medium">
                      {batchStatus.done
                        ? "Sending Complete"
                        : "Sending Invites…"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {batchStatus.completed + batchStatus.failed} / {batchStatus.total}
                  </span>
                </div>

                <Progress value={batchStatus.progress} className="h-2" />

                <div className="flex gap-4 text-xs">
                  <span className="text-green-600 font-medium">
                    ✓ {batchStatus.completed} sent
                  </span>
                  {batchStatus.failed > 0 && (
                    <span className="text-red-500 font-medium">
                      ✗ {batchStatus.failed} failed
                    </span>
                  )}
                  {batchStatus.pending > 0 && (
                    <span className="text-muted-foreground">
                      ⏳ {batchStatus.pending} pending
                    </span>
                  )}
                </div>

                {batchStatus.done && batchStatus.failedEmails.length > 0 && (
                  <div className="mt-1 p-2 bg-red-500/10 rounded text-xs">
                    <p className="font-medium text-red-600 mb-1">
                      Failed to deliver to:
                    </p>
                    <ul className="list-disc list-inside text-red-500/80 space-y-0.5">
                      {batchStatus.failedEmails.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="border-t px-6 py-3 flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendInvites}
            disabled={sendingInvites || loading || (batchStatus !== null && !batchStatus.done)}
            className="gap-1.5"
          >
            {sendingInvites ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Invites
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save Access"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
