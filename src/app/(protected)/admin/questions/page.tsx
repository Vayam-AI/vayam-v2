"use client";

import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Users,
  Plus,
  Edit,
  ArrowLeft,
  Activity,
  Clock,
  Trash2,
  Share2,
  Eye,
  Mail,
  Shield,
} from "lucide-react";
import { LoaderOne } from "@/components/ui/loader";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
import { QuestionCard } from "@/components/admin/question-card";
import { QuestionDialogs } from "@/components/admin/question-dialogs";
import { QuestionAccessDialog } from "@/components/admin/question-access-dialog";
import { EmailTemplateDialog } from "@/components/admin/email-template-dialog";

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string[];
  participantCount: number;
  allowedEmails: string[];
  owner: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerUsername: string | null;
}

export default function AdminQuestionsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [questionToShare, setQuestionToShare] = useState<Question | null>(null);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [questionForAccess, setQuestionForAccess] = useState<Question | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [questionForTemplate, setQuestionForTemplate] = useState<Question | null>(null);
  const [accessEmails, setAccessEmails] = useState<{ email: string; name: string; department: string | null; inviteStatus: string }[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const isAdmin = isAdminUser(session?.user?.role);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(
        (q) =>
          q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

  const fetchQuestions = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const response = await axios.get("/api/questions");
      if (response.data.success) {
        const allQuestions = response.data.data || [];
        setQuestions(allQuestions);
        setFilteredQuestions(allQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
      setQuestions([]);
      setFilteredQuestions([]);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/signin");
      return;
    }
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (status === "authenticated" && isAdmin) fetchQuestions();
  }, [status, isAdmin, router, fetchQuestions]);

  // Fetch full access list from questionAccess table
  const fetchAccessList = useCallback(async (questionId: number) => {
    setAccessLoading(true);
    try {
      const res = await axios.get(`/api/admin/questions/${questionId}/access`);
      const data = res.data.data || [];
      setAccessEmails(
        data.map((a: { companyUser: { email: string; name: string; department: string | null }; inviteStatus: string }) => ({
          email: a.companyUser.email,
          name: a.companyUser.name,
          department: a.companyUser.department,
          inviteStatus: a.inviteStatus,
        }))
      );
    } catch {
      setAccessEmails([]);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  const handleSelect = (question: Question) => {
    setSelected(question);
    setSelectedId(question.id);
    fetchAccessList(question.id);
  };
  const openCreateDialog = () => setShowCreateDialog(true);
  const openEditDialog = (question: Question) => {
    setQuestionToEdit(question);
    setShowEditDialog(true);
  };
  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteDialog(true);
  };
  const openShareDialog = (question: Question) => {
    setQuestionToShare(question);
    setShowShareDialog(true);
  };
  const openAccessDialog = (question: Question) => {
    setQuestionForAccess(question);
    setShowAccessDialog(true);
  };
  const openTemplateDialog = (question: Question) => {
    setQuestionForTemplate(question);
    setShowTemplateDialog(true);
  };

  const handleQuestionCreated = () => fetchQuestions();
  const handleQuestionUpdated = () => fetchQuestions();
  const handleQuestionDeleted = () => {
    fetchQuestions();
    setSelected(null);
    setSelectedId(null);
  };

  if (status === "loading" || dashboardLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }
  if (status === "unauthenticated" || !isAdmin) return null;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {selected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSelected(null); setSelectedId(null); }}
              className="mb-3 -ml-2 text-muted-foreground hover:text-foreground h-8 text-xs gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Questions
            </Button>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {selected ? selected.title : "Questions"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {selected
                  ? "Manage this question's settings and access"
                  : "Create, manage, and share your questions."}
              </p>
            </div>
            {!selected && (
              <Button
                onClick={openCreateDialog}
                size="sm"
                className="h-9 gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> New Question
              </Button>
            )}
          </div>
        </motion.div>

        {!selected ? (
          <>
            {/* Search */}
            {questions.length > 0 && (
              <div className="relative max-w-sm">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            )}

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredQuestions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full flex flex-col items-center justify-center py-16 text-center"
                  >
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <h3 className="text-base font-medium text-foreground mb-1">
                      {searchQuery
                        ? "No matching questions"
                        : "No questions yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Get started by creating your first question"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={openCreateDialog}
                        size="sm"
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" /> Create Question
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  filteredQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onClick={() => handleSelect(question)}
                      selected={selectedId === question.id}
                      onEdit={openEditDialog}
                      onDelete={openDeleteDialog}
                      onShare={openShareDialog}
                      onManageAccess={openAccessDialog}
                      onEmailTemplate={openTemplateDialog}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Detail View */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={selected.isActive ? "default" : "secondary"}
                className="text-xs font-normal gap-1"
              >
                <Activity className="h-3 w-3" />
                {selected.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal gap-1">
                <Eye className="h-3 w-3" /> Private
              </Badge>
              <Badge variant="outline" className="text-xs font-normal gap-1">
                <Clock className="h-3 w-3" />
                {new Date(selected.createdAt).toLocaleDateString()}
              </Badge>
            </div>

            {/* Description */}
            <Card className="border-border/40">
              <CardContent className="p-5">
                <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {selected.tags && selected.tags.length > 0 && (
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card className="border-border/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      {selected.participantCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Participants
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold">
                      {accessLoading ? "…" : accessEmails.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Access List</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 col-span-2 sm:col-span-1">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Mail className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium truncate">
                      {selected.ownerEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Access List */}
            {accessLoading ? (
              <Card className="border-border/40">
                <CardContent className="p-5 flex items-center justify-center">
                  <LoaderOne />
                </CardContent>
              </Card>
            ) : accessEmails.length > 0 ? (
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Access List ({accessEmails.length})
                  </h3>
                  <div className="divide-y divide-border/40">
                    {accessEmails.map((entry) => (
                      <div
                        key={entry.email}
                        className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{entry.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {entry.department && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                              {entry.department}
                            </Badge>
                          )}
                          <Badge
                            variant={entry.inviteStatus === "accepted" ? "default" : "secondary"}
                            className="text-[10px] px-1.5 py-0 h-5"
                          >
                            {entry.inviteStatus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => openEditDialog(selected)}
                className="h-9 gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAccessDialog(selected)}
                className="h-9 gap-1.5"
              >
                <Users className="h-3.5 w-3.5" /> Manage Access
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openTemplateDialog(selected)}
                className="h-9 gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" /> Email Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openShareDialog(selected)}
                className="h-9 gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => openDeleteDialog(selected)}
                className="h-9 gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </motion.div>
        )}

        {/* Dialogs */}
        <QuestionDialogs
          showCreateDialog={showCreateDialog}
          setShowCreateDialog={setShowCreateDialog}
          showEditDialog={showEditDialog}
          setShowEditDialog={setShowEditDialog}
          questionToEdit={questionToEdit}
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          questionToDelete={questionToDelete}
          showShareDialog={showShareDialog}
          setShowShareDialog={setShowShareDialog}
          questionToShare={questionToShare}
          adminEmail={session?.user?.email || ""}
          onQuestionCreated={handleQuestionCreated}
          onQuestionUpdated={handleQuestionUpdated}
          onQuestionDeleted={handleQuestionDeleted}
        />
        <QuestionAccessDialog
          open={showAccessDialog}
          onOpenChange={(open) => {
            setShowAccessDialog(open);
            // Refresh access list when dialog closes and a question is selected
            if (!open && selected) {
              fetchAccessList(selected.id);
            }
          }}
          questionId={questionForAccess?.id ?? null}
          questionTitle={questionForAccess?.title}
        />
        <EmailTemplateDialog
          open={showTemplateDialog}
          onOpenChange={setShowTemplateDialog}
          questionId={questionForTemplate?.id ?? null}
          questionTitle={questionForTemplate?.title}
        />
      </div>
    </div>
  );
}
