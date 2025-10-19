"use client";

import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageSquare,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Activity,
  Clock,
  Mail,
} from "lucide-react";
import { LoaderOne } from "@/components/ui/loader";
import { isAdminUser } from "@/lib/admin";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";

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

function QuestionCard({
  question,
  onClick,
  selected,
  onEdit,
  onDelete,
  onInvite,
}: {
  question: Question;
  onClick: () => void;
  selected: boolean;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  onInvite: (question: Question) => void;
}) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(question);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(question);
  };

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInvite(question);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`w-full cursor-pointer ${
        selected ? "ring-2 ring-primary/50" : ""
      }`}
      onClick={onClick}
    >
      <Card
        className={`relative overflow-hidden group transition-all duration-300 border-border/50 hover:border-primary/30 hover:shadow-md ${
          !question.isActive ? "opacity-75 border-dashed" : ""
        }`}
      >
        <CardHeader className="flex flex-row items-start gap-3 pb-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <CardTitle className="text-base font-semibold line-clamp-2 text-foreground">
                {question.title}
                {!question.isActive && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs text-muted-foreground"
                  >
                    Inactive
                  </Badge>
                )}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {question.description}
            </p>
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {question.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs bg-muted/50 border-border/50"
                  >
                    {tag}
                  </Badge>
                ))}
                {question.tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-muted/50 border-border/50"
                  >
                    +{question.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{question.participantCount}</span>
              </div>

             
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleInvite}
                className="h-7 w-7 p-0 hover:bg-blue-500/10"
              >
                <Mail className="h-3 w-3 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleEdit}
                className="h-7 w-7 p-0 hover:bg-blue-500/10"
              >
                <Edit className="h-3 w-3 text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-7 w-7 p-0 hover:bg-red-500/10"
              >
                <Trash2 className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function AdminQuestionsDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  // CRUD dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(
    null
  );
  const [questionToInvite, setQuestionToInvite] = useState<Question | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    allowedEmails: [] as string[],
    isActive: true,
  });

  const [inviteEmails, setInviteEmails] = useState<string[]>([]);

  const isAdmin = isAdminUser(session?.user?.email);

  // Filter questions based on search query - show all questions including inactive ones
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(
        (question) =>
          question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          question.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
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

        // Filter questions to show only those created by the current admin
        const adminQuestions = allQuestions.filter(
          (question: Question) => question.ownerEmail === session?.user?.email
        );

        setQuestions(adminQuestions);
        setFilteredQuestions(adminQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
      setQuestions([]);
      setFilteredQuestions([]);
    } finally {
      setDashboardLoading(false);
    }
  }, [session?.user?.email]);

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

    if (status === "authenticated" && isAdmin) {
      fetchQuestions();
    }
  }, [status, isAdmin, router, fetchQuestions]);

  const handleSelect = (question: Question) => {
    setSelected(question);
  };

  // CRUD functions
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      tags: [],
      allowedEmails: [],
      isActive: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) return;

    setDashboardLoading(true);
    try {
      const response = await axios.post("/api/questions", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
        allowedEmails: formData.allowedEmails,
        isPublic: false,
        isActive: formData.isActive,
      });

      if (response.data.success) {
        await fetchQuestions();
        setShowCreateDialog(false);
        resetForm();
        toast.success("Question created successfully!");
      }
    } catch (error: unknown) {
      console.error("Error creating question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to create question");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!formData.title.trim() || !questionToEdit) return;

    setDashboardLoading(true);
    try {
      // Check if there are new emails to invite
      const oldEmails = questionToEdit.allowedEmails || [];
      const newEmails = formData.allowedEmails.filter(
        (email) => !oldEmails.includes(email)
      );

      const response = await axios.put(`/api/questions/${questionToEdit.id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
        allowedEmails: formData.allowedEmails,
        isPublic: false,
        isActive: formData.isActive,
      });

      if (response.data.success) {
        // Send invitations to new emails if any
        if (newEmails.length > 0) {
          try {
            await axios.post("/api/invite-sme", {
              emails: newEmails,
              questionTitle: formData.title,
              questionId: questionToEdit.id,
              questionDescription: formData.description,
            });
            toast.success(
              `Question updated and invitations sent to ${newEmails.length} new SME(s)!`
            );
          } catch (emailError) {
            console.error("Error sending invitations:", emailError);
            toast.success(
              "Question updated successfully, but some invitations failed to send"
            );
          }
        } else {
          toast.success("Question updated successfully!");
        }

        await fetchQuestions();
        setShowEditDialog(false);
        setQuestionToEdit(null);
        resetForm();
      }
    } catch (error: unknown) {
      console.error("Error updating question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to update question");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    setDashboardLoading(true);
    try {
      const response = await axios.delete(
        `/api/questions/${questionToDelete.id}`
      );

      if (response.data.success) {
        await fetchQuestions();
        setShowDeleteDialog(false);
        setQuestionToDelete(null);
        toast.success("Question deleted successfully!");
      }
    } catch (error: unknown) {
      console.error("Error deleting question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to delete question");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleInviteSME = async () => {
    if (!questionToInvite || inviteEmails.length === 0) return;

    setDashboardLoading(true);
    try {
      const response = await axios.post("/api/invite-sme", {
        emails: inviteEmails,
        questionTitle: questionToInvite.title,
        questionId: questionToInvite.id,
        questionDescription: questionToInvite.description,
      });

      if (response.data.success) {
        setShowInviteDialog(false);
        setQuestionToInvite(null);
        setInviteEmails([]);
        toast.success(response.data.message);
      }
    } catch (error: unknown) {
      console.error("Error sending invitations:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to send invitations");
    } finally {
      setDashboardLoading(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (question: Question) => {
    setFormData({
      title: question.title || "",
      description: question.description || "",
      tags: Array.isArray(question.tags) ? question.tags : [],
      allowedEmails: Array.isArray(question.allowedEmails)
        ? question.allowedEmails
        : [],
      isActive: question.isActive,
    });
    setQuestionToEdit(question);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteDialog(true);
  };

  const openInviteDialog = (question: Question) => {
    setQuestionToInvite(question);
    setInviteEmails([]);
    setShowInviteDialog(true);
  };

  if (status === "loading" || dashboardLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-full bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8 h-full">
        <div className="max-w-7xl mx-auto h-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {selected && (
              <Button
                variant="ghost"
                onClick={() => setSelected(null)}
                className="mb-4 text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Questions Dashboard
              </Button>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  {selected ? selected.title : "Admin Questions Dashboard"}
                </h1>
                <p className="text-muted-foreground">
                  {selected
                    ? "Manage this question"
                    : "Manage all questions and their settings"}
                </p>
              </div>
              {!selected && (
                <Button
                  onClick={openCreateDialog}
                  className="flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create New Question</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              )}
            </div>
          </motion.div>

          {!selected ? (
            <>
              {/* Search Bar */}
              {filteredQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <Input
                    placeholder="Search questions by title, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </motion.div>
              )}
              {/* Questions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredQuestions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="col-span-full flex flex-col items-center justify-center py-12 text-center"
                    >
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No questions found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {searchQuery
                          ? "Try adjusting your search terms"
                          : "Get started by creating your first question"}
                      </p>
                      {!searchQuery && (
                        <Button
                          onClick={openCreateDialog}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Question
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    filteredQuestions.map((question) => {
                      const selectedQuestion = selected as Question | null;
                      const isSelected = selectedQuestion
                        ? selectedQuestion.id === question.id
                        : false;
                      return (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          onClick={() => handleSelect(question)}
                          selected={isSelected}
                          onEdit={openEditDialog}
                          onDelete={openDeleteDialog}
                          onInvite={openInviteDialog}
                        />
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            /* Selected Question Detail View */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 lg:p-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Question Description
                      </p>
                      <p className="text-foreground leading-relaxed">
                        {selected.description}
                      </p>
                    </div>

                    {selected.tags && selected.tags.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selected.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-muted/50 border-border/50"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-xl">
                        <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-foreground">
                          {selected.participantCount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Participants
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-xl">
                        <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-bold text-foreground">
                          {new Date(selected.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Created</p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-xl">
                        <p className="text-sm font-bold text-foreground">
                          Private
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Visibility
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-xl">
                        {selected.isActive ? (
                          <Activity className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        ) : (
                          <Activity className="h-6 w-6 text-red-500 mx-auto mb-2" />
                        )}
                        <p className="text-sm font-bold text-foreground">
                          {selected.isActive ? "Active" : "Inactive"}
                        </p>
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                    </div>

                    {selected.allowedEmails.length > 0 && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                        <h4 className="font-medium text-foreground mb-2">
                          SME Access List:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selected.allowedEmails.map((email: string) => (
                            <Badge key={email} variant="secondary">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => openEditDialog(selected)}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Question
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openInviteDialog(selected)}
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Invite SMEs
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => openDeleteDialog(selected)}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Create Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Question Title *</Label>
                  <Textarea
                    id="title"
                    placeholder="Enter your question title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide additional context and details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    placeholder="Add tags..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allowedEmails">SME Email Addresses</Label>
                  <TagInput
                    tags={formData.allowedEmails}
                    onChange={(emails) =>
                      setFormData({ ...formData, allowedEmails: emails })
                    }
                    placeholder="Add email addresses..."
                  />
                  <p className="text-xs text-muted-foreground">
                    SMEs will receive email invitations to contribute to this
                    question
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active question</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.title.trim() || dashboardLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Edit Question</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Question Title *</Label>
                  <Textarea
                    id="edit-title"
                    placeholder="Enter your question title..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Provide additional context and details..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-tags">Tags</Label>
                  <TagInput
                    tags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    placeholder="Add tags..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-allowedEmails">
                    SME Email Addresses
                  </Label>
                  <TagInput
                    tags={formData.allowedEmails}
                    onChange={(emails) =>
                      setFormData({ ...formData, allowedEmails: emails })
                    }
                    placeholder="Add email addresses..."
                  />
                  <p className="text-xs text-muted-foreground">
                    SMEs will receive email invitations to contribute to this
                    question. New emails will be automatically invited.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="edit-isActive">Active question</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEdit}
                  disabled={!formData.title.trim() || dashboardLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Question</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this question? This action
                  cannot be undone and will remove all associated data.
                </p>
                {questionToDelete && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="font-medium text-sm">
                      {questionToDelete.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {questionToDelete.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={dashboardLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Question
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Invite SME Dialog */}
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Invite SMEs</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Send email invitations to Subject Matter Experts for this
                  question:
                </p>
                {questionToInvite && (
                  <div className="mb-4 p-3 bg-muted rounded-md">
                    <p className="font-medium text-sm">
                      {questionToInvite.title}
                    </p>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="invite-emails">Email Addresses</Label>
                  <TagInput
                    tags={inviteEmails}
                    onChange={setInviteEmails}
                    placeholder="Add email addresses..."
                  />
                  <p className="text-xs text-muted-foreground">
                    These users will receive email invitations to contribute to
                    this question
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteSME}
                  disabled={inviteEmails.length === 0 || dashboardLoading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitations
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
