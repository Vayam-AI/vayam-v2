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
  Mail,
} from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { toast } from "sonner";
import {
  createQuestionSchema,
  updateQuestionSchema,
  inviteSmeSchema,
  type CreateQuestionData,
  type UpdateQuestionData,
  type InviteSmeData
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

  // Invite Dialog
  showInviteDialog: boolean;
  setShowInviteDialog: (show: boolean) => void;
  questionToInvite: Question | null;

  // Callbacks for parent component
  onQuestionCreated?: () => void;
  onQuestionUpdated?: () => void;
  onQuestionDeleted?: () => void;
  onInvitesSent?: () => void;
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
  showInviteDialog,
  setShowInviteDialog,
  questionToInvite,
  onQuestionCreated,
  onQuestionUpdated,
  onQuestionDeleted,
  onInvitesSent,
}: QuestionDialogsProps) {
  const [loading, setLoading] = useState(false);

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

  // Invite form
  const inviteForm = useForm<InviteSmeData>({
    resolver: zodResolver(inviteSmeSchema),
    defaultValues: {
      emails: [], // instead of smes
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

  useEffect(() => {
    if (!showInviteDialog) {
      inviteForm.reset();
    }
  }, [showInviteDialog, inviteForm]);

  // API call handlers
  const handleCreate = async (data: CreateQuestionData) => {
    setLoading(true);
    try {
      const response = await axios.post("/api/questions", {
        title: data.title.trim(),
        description: data.description.trim(),
        tags: data.tags,
        allowedEmails: data.allowedEmails,
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
      // Check if there are new emails to invite
      const oldEmails = questionToEdit.allowedEmails || [];
      const newEmails = (data.allowedEmails || []).filter(
        (email: string) => !oldEmails.includes(email)
      );

      const response = await axios.put(`/api/questions/${questionToEdit.id}`, {
        title: data.title?.trim(),
        description: data.description?.trim(),
        tags: data.tags,
        allowedEmails: data.allowedEmails,
        isPublic: false,
        isActive: data.isActive,
      });

      if (response.data.success) {
        // Send invitations to new emails if any
        if (newEmails.length > 0) {
          try {
            await axios.post("/api/invite-sme", {
              emails: newEmails,
              questionTitle: data.title,
              questionId: questionToEdit.id,
              questionDescription: data.description,
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

  const handleInviteSME = async (data: InviteSmeData) => {
    if (!questionToInvite) return;
    setLoading(true);

    try {
      const smes = data.emails.map((email) => {
        const namePart = email.split("@")[0];
        const formattedName =
          namePart.charAt(0).toUpperCase() + namePart.slice(1);
        return { name: formattedName, email };
      });

      const updatedAllowedEmails = [
        ...(questionToInvite.allowedEmails || []),
        ...smes.map((s) => s.email),
      ].filter((email, index, arr) => arr.indexOf(email) === index);

      const updateResponse = await axios.put(`/api/questions/${questionToInvite.id}`, {
        title: questionToInvite.title,
        description: questionToInvite.description,
        tags: questionToInvite.tags,
        allowedEmails: updatedAllowedEmails,
        isPublic: false,
        isActive: questionToInvite.isActive,
      });

      if (updateResponse.data.success) {
        const inviteResponse = await axios.post("/api/invite-sme", {
          smes,
          questionTitle: questionToInvite.title,
          questionId: questionToInvite.id,
          questionDescription: questionToInvite.description,
        });
        
        if (inviteResponse.data.success) {
          setShowInviteDialog(false);
          inviteForm.reset();
          toast.success(
            `Invitations sent to ${smes.length} SME${smes.length > 1 ? "s" : ""}!`
          );
          onInvitesSent?.();
        }
      }
    } catch (error: unknown) {
      console.error("Error sending invitations:", error);
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to send invitations");
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
                  name="allowedEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SME Email Addresses</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add email addresses..."
                        />
                      </FormControl>
                      <FormDescription>
                        SMEs will receive email invitations to contribute to this question ({(field.value || []).length}/50 emails)
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
                  name="allowedEmails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SME Email Addresses</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add email addresses..."
                        />
                      </FormControl>
                      <FormDescription>
                        SMEs will receive email invitations to contribute to this question. New emails will be automatically invited. ({(field.value || []).length}/50 emails)
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

      {/* Invite SME Dialog - SCROLLABLE */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-6">
          <div className="overflow-y-auto">
            <DialogHeader className="pb-4">
              <DialogTitle>Invite SMEs</DialogTitle>
            </DialogHeader>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(handleInviteSME)} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send email invitations to Subject Matter Experts for this
                  question:
                </p>
                {questionToInvite && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="font-medium text-sm">
                      {questionToInvite.title}
                    </p>
                  </div>
                )}
                <FormField
                  control={inviteForm.control}
                  name="emails"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Email Addresses *</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add email addresses..."
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground">
                        These users will receive email invitations to contribute to this question ({(field.value || []).length}/20 emails)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => setShowInviteDialog(false)}
              className="px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={inviteForm.handleSubmit(handleInviteSME)}
              disabled={(inviteForm.watch("emails") || []).length === 0 || loading}
              className="px-4"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Invitations
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}