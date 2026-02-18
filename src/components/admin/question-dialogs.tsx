"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Save,
  X,
  Trash2,
  Share2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";
import {
  createQuestionSchema,
  updateQuestionSchema,
  type CreateQuestionData,
  type UpdateQuestionData,
} from "@/validators/vayam";

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

interface QuestionDialogsProps {
  // Create Dialog
  showCreateDialog: boolean;
  setShowCreateDialog: (show: boolean) => void;

  // Edit Dialog
  showEditDialog: boolean;
  setShowEditDialog: (show: boolean) => void;
  questionToEdit: Question | null;

  // Delete Dialog
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  questionToDelete: Question | null;

  // Share Dialog
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  questionToShare: Question | null;

  // Admin email — auto-added to allowedEmails on create
  adminEmail: string;

  // Callbacks for parent component
  onQuestionCreated?: () => void;
  onQuestionUpdated?: () => void;
  onQuestionDeleted?: () => void;
}

export function QuestionDialogs({
  showCreateDialog,
  setShowCreateDialog,
  showEditDialog,
  setShowEditDialog,
  questionToEdit,
  showDeleteDialog,
  setShowDeleteDialog,
  questionToDelete,
  showShareDialog,
  setShowShareDialog,
  questionToShare,
  adminEmail,
  onQuestionCreated,
  onQuestionUpdated,
  onQuestionDeleted,
}: QuestionDialogsProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create form
  const createForm = useForm<CreateQuestionData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      allowedEmails: [],
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<UpdateQuestionData>({
    resolver: zodResolver(updateQuestionSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      allowedEmails: [],
      isActive: true,
    },
  });

  // Initialize edit form when questionToEdit changes
  useEffect(() => {
    if (questionToEdit && showEditDialog) {
      editForm.reset({
        title: questionToEdit.title || "",
        description: questionToEdit.description || "",
        tags: Array.isArray(questionToEdit.tags) ? questionToEdit.tags : [],
        allowedEmails: Array.isArray(questionToEdit.allowedEmails) ? questionToEdit.allowedEmails : [],
        isActive: questionToEdit.isActive,
      });
    }
  }, [questionToEdit, showEditDialog, editForm]);

  // Reset forms when dialogs close
  useEffect(() => {
    if (!showCreateDialog) {
      createForm.reset();
    }
  }, [showCreateDialog, createForm]);

  useEffect(() => {
    if (!showEditDialog) {
      editForm.reset();
    }
  }, [showEditDialog, editForm]);

  // API call handlers
  const handleCreate = async (data: CreateQuestionData) => {
    setLoading(true);
    try {
      // Auto-include admin email in allowedEmails
      const emails = [adminEmail.toLowerCase()];

      const response = await axios.post("/api/questions", {
        title: data.title.trim(),
        description: data.description.trim(),
        tags: data.tags,
        allowedEmails: emails,
        isPublic: false,
        isActive: data.isActive,
      });

      if (response.data.success) {
        setShowCreateDialog(false);
        createForm.reset();
        toast.success("Question created successfully!");
        onQuestionCreated?.();
      }
    } catch (error: unknown) {
      console.error("Error creating question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (data: UpdateQuestionData) => {
    if (!questionToEdit) return;

    setLoading(true);
    try {
      const response = await axios.put(`/api/questions/${questionToEdit.id}`, {
        title: data.title?.trim(),
        description: data.description?.trim(),
        tags: data.tags,
        allowedEmails: questionToEdit.allowedEmails, // preserve existing
        isPublic: false,
        isActive: data.isActive,
      });

      if (response.data.success) {
        toast.success("Question updated successfully!");
        setShowEditDialog(false);
        editForm.reset();
        onQuestionUpdated?.();
      }
    } catch (error: unknown) {
      console.error("Error updating question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to update question");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/questions/${questionToDelete.id}`);

      if (response.data.success) {
        setShowDeleteDialog(false);
        toast.success("Question deleted successfully!");
        onQuestionDeleted?.();
      }
    } catch (error: unknown) {
      console.error("Error deleting question:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to delete question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Create Dialog - SCROLLABLE */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6">
          <div className="overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle>Create New Question</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)} className="grid gap-4 px-1 py-4">
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Title</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your question title..."
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/200 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide additional context and details..."
                          className="min-h-[100px] max-h-[300px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add tags..."
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value || []).length}/10 tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="isActive">Active question</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="px-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Question
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - SCROLLABLE */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6">
          <div className="overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle>Edit Question</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="grid gap-4 py-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Title *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your question title..."
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value || "").length}/200 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide additional context and details..."
                          className="min-h-[100px] max-h-[300px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value || "").length}/1000 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add tags..."
                        />
                      </FormControl>
                      <FormDescription>
                        {(field.value || []).length}/10 tags
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="edit-isActive">Active question</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="px-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Update Question
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog - SCROLLABLE */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col ">
          <div className="overflow-y-auto">
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
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Question
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Question</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {questionToShare && (
              <>
                <div className="p-3 bg-muted rounded-md text-sm">
                  <span className="font-semibold">{questionToShare.title}</span>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    {/* QR Code using the same reliable external API as the backend */}
                    <Image 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/questions/${questionToShare.id}`)}`}
                      alt="Question QR Code"
                      width={200}
                      height={200}
                      className="w-48 h-48"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Scan to view on mobile
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Public Link</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 bg-muted rounded border text-sm font-mono truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/questions/${questionToShare.id}` : `/questions/${questionToShare.id}`}
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(typeof window !== 'undefined' ? `${window.location.origin}/questions/${questionToShare.id}` : "")}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => window.open(`/questions/${questionToShare.id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}