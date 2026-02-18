"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Upload,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Shield,
  ShieldOff,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderOne } from "@/components/ui/loader";
import { toast } from "sonner";
import { isAdminUser } from "@/lib/admin";

/* ---------- Types ---------- */

interface AccessStats {
  totalAccess: number;
  pendingCount: number;
  sentCount: number;
  acceptedCount: number;
}

interface CompanyUser {
  id: number;
  department: string | null;
  name: string;
  email: string;
  isRegistered: boolean;
  userId: number | null;
  createdAt: string;
  accessStats: AccessStats;
}

interface OrgQuestion {
  id: number;
  title: string;
  isActive: boolean;
}

interface UserAccess {
  accessId: number;
  questionId: number;
  inviteStatus: string;
  invitedAt: string | null;
  createdAt: string;
  questionTitle: string;
  questionIsActive: boolean;
}

/* ---------- Component ---------- */

export default function CompanyUsersPage() {
  const { data: session } = useSession();

  // Data
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [orgQuestions, setOrgQuestions] = useState<OrgQuestion[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [regFilter, setRegFilter] = useState("all");
  const [questionFilter, setQuestionFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Expanded row → per-user access
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [userAccessMap, setUserAccessMap] = useState<Record<number, UserAccess[]>>({});
  const [loadingAccess, setLoadingAccess] = useState<number | null>(null);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantUserId, setGrantUserId] = useState<number | null>(null);
  const [grantQuestionId, setGrantQuestionId] = useState("");

  // Form states
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleDept, setSingleDept] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const isAdmin = isAdminUser(session?.user?.role);

  /* ---------- Fetch users (enriched) ---------- */
  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/company-users/with-access", {
        params: searchQuery ? { search: searchQuery } : {},
      });
      if (res.data.success) {
        setUsers(res.data.data);
        setOrgQuestions(res.data.questions ?? []);
        setDepartments(res.data.departments ?? []);
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  /* ---------- Fetch per-user access (lazy) ---------- */
  const fetchUserAccess = useCallback(async (userId: number) => {
    if (userAccessMap[userId]) return; // cached
    setLoadingAccess(userId);
    try {
      const res = await axios.get(`/api/admin/company-users/${userId}/access`);
      if (res.data.success) {
        setUserAccessMap((prev) => ({ ...prev, [userId]: res.data.data.access }));
      }
    } catch {
      toast.error("Failed to load access details");
    } finally {
      setLoadingAccess(null);
    }
  }, [userAccessMap]);

  const toggleExpand = (userId: number) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      fetchUserAccess(userId);
    }
  };

  /* ---------- Grant access ---------- */
  const openGrantDialog = (userId: number) => {
    setGrantUserId(userId);
    setGrantQuestionId("");
    setShowGrantDialog(true);
  };

  const handleGrantAccess = async () => {
    if (!grantUserId || !grantQuestionId) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/admin/company-users/${grantUserId}/access`, {
        questionId: parseInt(grantQuestionId, 10),
      });
      toast.success("Access granted");
      // Refresh cached access for this user
      setUserAccessMap((prev) => {
        const updated = { ...prev };
        delete updated[grantUserId];
        return updated;
      });
      fetchUserAccess(grantUserId);
      setShowGrantDialog(false);
      fetchUsers(); // refresh stats
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to grant access";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Revoke access ---------- */
  const handleRevokeAccess = async (userId: number, questionId: number) => {
    if (!confirm("Revoke this user's access to this question?")) return;
    try {
      await axios.delete(`/api/admin/company-users/${userId}/access?questionId=${questionId}`);
      toast.success("Access revoked");
      setUserAccessMap((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      fetchUserAccess(userId);
      fetchUsers();
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  /* ---------- Add single user ---------- */
  const handleAddSingle = async () => {
    if (!singleEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/admin/company-users", {
        users: [
          {
            name: singleName.trim() || singleEmail.split("@")[0],
            email: singleEmail.trim().toLowerCase(),
            department: singleDept.trim() || undefined,
          },
        ],
      });
      toast.success("User added");
      setSingleName("");
      setSingleEmail("");
      setSingleDept("");
      setShowAddDialog(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to add user";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Bulk paste ---------- */
  const handleBulkPaste = async () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("Paste at least one entry");
      return;
    }

    const parsed = lines.map((line) => {
      const parts = line.split(/[,\t]+/).map((p) => p.trim());
      if (parts.length >= 3)
        return { department: parts[0], name: parts[1], email: parts[2] };
      if (parts.length === 2) return { name: parts[0], email: parts[1] };
      return { name: parts[0].split("@")[0], email: parts[0] };
    });

    const valid = parsed.filter((u) => u.email.includes("@"));
    if (valid.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post("/api/admin/company-users", {
        users: valid,
      });
      toast.success(
        `Added ${res.data.inserted ?? valid.length} user(s). ${
          res.data.skipped ? `${res.data.skipped} duplicates skipped.` : ""
        }`
      );
      setBulkText("");
      setShowBulkDialog(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to add users";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Excel import ---------- */
  const handleImport = async () => {
    if (!importFile) {
      toast.error("Select a file");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      const res = await axios.post("/api/admin/company-users/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(
        `Imported ${res.data.inserted} user(s). ${
          res.data.skipped ? `${res.data.skipped} skipped.` : ""
        } ${
          res.data.errors?.length ? `${res.data.errors.length} errors.` : ""
        }`
      );
      setImportFile(null);
      setShowImportDialog(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Failed to import file";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- Delete user ---------- */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user? This will also remove all question access."))
      return;
    try {
      await axios.delete(`/api/admin/company-users/${id}`);
      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  /* ---------- Filtering ---------- */
  const filteredUsers = users.filter((u) => {
    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesText =
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department?.toLowerCase() ?? "").includes(q);
      if (!matchesText) return false;
    }
    // Department filter
    if (deptFilter !== "all") {
      if (deptFilter === "__none__") {
        if (u.department) return false;
      } else if (u.department !== deptFilter) return false;
    }
    // Registration filter
    if (regFilter === "registered" && !u.isRegistered) return false;
    if (regFilter === "unregistered" && u.isRegistered) return false;
    // Question access filter
    if (questionFilter !== "all") {
      // We need to check if user has access to this specific question
      // We'll use accessStats for "any" and per-user access for specific question
      if (questionFilter === "__has_access__") {
        if (u.accessStats.totalAccess === 0) return false;
      } else if (questionFilter === "__no_access__") {
        if (u.accessStats.totalAccess > 0) return false;
      }
      // Specific question filter requires fetching per-user access — handled server-side via search if needed
    }
    return true;
  });

  const activeFilterCount = [
    deptFilter !== "all",
    regFilter !== "all",
    questionFilter !== "all",
  ].filter(Boolean).length;

  /* ---------- Loading ---------- */
  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderOne />
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Company Users
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your company user directory and question access.{" "}
            {users.length} user(s) total.
          </p>
        </motion.div>

        {/* Actions bar */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, dept…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={showFilters ? "secondary" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full bg-primary text-primary-foreground"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBulkDialog(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-4 w-4" /> Bulk Paste
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="gap-1.5"
              >
                <Upload className="h-4 w-4" /> Import Excel
              </Button>
            </div>
          </div>

          {/* Filter bar — collapsible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                  {/* Department filter */}
                  <div className="min-w-40">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Department
                    </Label>
                    <Select value={deptFilter} onValueChange={setDeptFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="__none__">No Department</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Registration filter */}
                  <div className="min-w-40">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Registration
                    </Label>
                    <Select value={regFilter} onValueChange={setRegFilter}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="registered">Registered</SelectItem>
                        <SelectItem value="unregistered">
                          Not Registered
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question access filter */}
                  <div className="min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Question Access
                    </Label>
                    <Select
                      value={questionFilter}
                      onValueChange={setQuestionFilter}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="__has_access__">
                          Has Access (any)
                        </SelectItem>
                        <SelectItem value="__no_access__">
                          No Access
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear filters */}
                  {activeFilterCount > 0 && (
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => {
                          setDeptFilter("all");
                          setRegFilter("all");
                          setQuestionFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results count */}
        {(searchQuery || activeFilterCount > 0) && (
          <p className="text-xs text-muted-foreground mb-2">
            Showing {filteredUsers.length} of {users.length} users
          </p>
        )}

        {/* Table */}
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-10" />
                <TableHead className="w-[140px]">Department</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-20 text-center">
                  Registered
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  Access
                </TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isExpanded={expandedUserId === u.id}
                    onToggle={() => toggleExpand(u.id)}
                    accessList={userAccessMap[u.id]}
                    loadingAccess={loadingAccess === u.id}
                    onGrantAccess={() => openGrantDialog(u.id)}
                    onRevokeAccess={(qId) => handleRevokeAccess(u.id, qId)}
                    onDelete={() => handleDelete(u.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ---- Add Single Dialog ---- */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Email *</Label>
              <Input
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                placeholder="user@company.com"
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Input
                value={singleDept}
                onChange={(e) => setSingleDept(e.target.value)}
                placeholder="Engineering"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSingle} disabled={submitting}>
              {submitting ? "Adding…" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Bulk Paste Dialog ---- */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Paste Users</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            One entry per line. Formats accepted:
          </p>
          <ul className="text-xs text-muted-foreground list-disc list-inside mb-2">
            <li>
              <code>department, name, email</code>
            </li>
            <li>
              <code>name, email</code>
            </li>
            <li>
              <code>email</code>
            </li>
          </ul>
          <Textarea
            rows={8}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={
              "Engineering, John Doe, john@company.com\nHR, Jane Smith, jane@company.com"
            }
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkPaste} disabled={submitting}>
              {submitting ? "Adding…" : "Add Users"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Import Excel Dialog ---- */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Excel</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Upload an <code>.xlsx</code> or <code>.csv</code> file with columns:{" "}
            <strong>Department</strong>, <strong>Name</strong>,{" "}
            <strong>Email</strong>
          </p>
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={submitting || !importFile}>
              {submitting ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Grant Access Dialog ---- */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Question Access</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Select a question to grant access to this user.
            </p>
            <Select value={grantQuestionId} onValueChange={setGrantQuestionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a question…" />
              </SelectTrigger>
              <SelectContent>
                {orgQuestions.map((q) => (
                  <SelectItem key={q.id} value={String(q.id)}>
                    <span className="flex items-center gap-2">
                      {q.title}
                      {!q.isActive && (
                        <Badge variant="outline" className="text-[10px] ml-1">
                          Inactive
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
                {orgQuestions.length === 0 && (
                  <SelectItem value="__empty__" disabled>
                    No questions available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGrantDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGrantAccess}
              disabled={submitting || !grantQuestionId || grantQuestionId === "__empty__"}
            >
              {submitting ? "Granting…" : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ========== User Row sub-component ========== */

function UserRow({
  user,
  isExpanded,
  onToggle,
  accessList,
  loadingAccess,
  onGrantAccess,
  onRevokeAccess,
  onDelete,
}: {
  user: CompanyUser;
  isExpanded: boolean;
  onToggle: () => void;
  accessList: UserAccess[] | undefined;
  loadingAccess: boolean;
  onGrantAccess: () => void;
  onRevokeAccess: (questionId: number) => void;
  onDelete: () => void;
}) {
  return (
    <>
      {/* Main row */}
      <motion.tr
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <TableCell className="w-10 px-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell className="text-sm">
          {user.department ? (
            <Badge variant="outline" className="text-xs">
              {user.department}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="font-medium text-sm">{user.name}</TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {user.email}
        </TableCell>
        <TableCell className="text-center">
          {user.isRegistered ? (
            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground/50 mx-auto" />
          )}
        </TableCell>
        <TableCell className="text-center">
          {user.accessStats.totalAccess > 0 ? (
            <Badge variant="secondary" className="text-xs">
              {user.accessStats.totalAccess} question
              {user.accessStats.totalAccess !== 1 ? "s" : ""}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Grant question access"
              onClick={onGrantAccess}
            >
              <Shield className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete user"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </motion.tr>

      {/* Expanded access panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <TableCell colSpan={7} className="bg-muted/10 px-4 py-3">
              <div className="ml-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    Question Access
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={onGrantAccess}
                  >
                    <Shield className="h-3 w-3" /> Grant Access
                  </Button>
                </div>

                {loadingAccess && (
                  <p className="text-xs text-muted-foreground py-2">
                    Loading…
                  </p>
                )}

                {!loadingAccess && accessList && accessList.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    No question access granted yet.
                  </p>
                )}

                {!loadingAccess && accessList && accessList.length > 0 && (
                  <div className="space-y-1.5">
                    {accessList.map((a) => (
                      <div
                        key={a.accessId}
                        className="flex items-center justify-between py-1.5 px-3 rounded-md bg-background border border-border/40 text-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate font-medium text-xs">
                            {a.questionTitle}
                          </span>
                          <Badge
                            variant={
                              a.inviteStatus === "accepted"
                                ? "default"
                                : a.inviteStatus === "sent"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px] shrink-0"
                          >
                            {a.inviteStatus}
                          </Badge>
                          {!a.questionIsActive && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                          title="Revoke access"
                          onClick={() => onRevokeAccess(a.questionId)}
                        >
                          <ShieldOff className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary badges */}
                {user.accessStats.totalAccess > 0 && (
                  <div className="flex gap-2 mt-2 text-[10px]">
                    {user.accessStats.pendingCount > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {user.accessStats.pendingCount} pending
                      </Badge>
                    )}
                    {user.accessStats.sentCount > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        {user.accessStats.sentCount} sent
                      </Badge>
                    )}
                    {user.accessStats.acceptedCount > 0 && (
                      <Badge className="text-[10px]">
                        {user.accessStats.acceptedCount} accepted
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </TableCell>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
