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
  Mail,
  Trash2,
} from "lucide-react";
import { LoaderOne } from "@/components/ui/loader";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
import { QuestionCard } from "@/components/admin/question-card";
import { QuestionDialogs } from "@/components/admin/question-dialogs";

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

  // Dialog handlers
  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const openEditDialog = (question: Question) => {
    setQuestionToEdit(question);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setShowDeleteDialog(true);
  };

  const openInviteDialog = (question: Question) => {
    setQuestionToInvite(question);
    setShowInviteDialog(true);
  };

  // Callback handlers for when operations complete
  const handleQuestionCreated = () => {
    fetchQuestions();
  };

  const handleQuestionUpdated = () => {
    fetchQuestions();
  };

  const handleQuestionDeleted = () => {
    fetchQuestions();
    setSelected(null); // Clear selected if it was deleted
  };

  const handleInvitesSent = () => {
    fetchQuestions();
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
                      <p className="text-foreground leading-relaxed break-words whitespace-pre-wrap overflow-hidden">
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

          {/* Question Dialogs */}
          <QuestionDialogs
            showCreateDialog={showCreateDialog}
            setShowCreateDialog={setShowCreateDialog}
            showEditDialog={showEditDialog}
            setShowEditDialog={setShowEditDialog}
            questionToEdit={questionToEdit}
            showDeleteDialog={showDeleteDialog}
            setShowDeleteDialog={setShowDeleteDialog}
            questionToDelete={questionToDelete}
            showInviteDialog={showInviteDialog}
            setShowInviteDialog={setShowInviteDialog}
            questionToInvite={questionToInvite}
            onQuestionCreated={handleQuestionCreated}
            onQuestionUpdated={handleQuestionUpdated}
            onQuestionDeleted={handleQuestionDeleted}
            onInvitesSent={handleInvitesSent}
          />
        </div>
      </div>
    </div>
  );
}
