"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createQuestionSchema, type CreateQuestionData } from "@/validators/vayam";

// Available tags for questions
const AVAILABLE_TAGS = [
  "Civic Issues",
  "Public Safety",
  "Infrastructure",
  "Environment",
  "Transportation",
  "Healthcare",
  "Education",
  "Economic Development",
  "Community Services",
  "Technology",
  "Housing",
  "Social Issues",
];

type FormData = CreateQuestionData;

export const CreateQuestion = () => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [emailInput, setEmailInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(createQuestionSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      allowedEmails: [],
      isActive: true,
    },
  });

  const handleTagToggle = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    form.setValue("tags", newTags);
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !(form.getValues("tags") || []).includes(customTag)) {
      form.setValue("tags", [...(form.getValues("tags") || []), customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleAddEmail = () => {
    if (emailInput.trim()) {
      const currentEmails = form.getValues("allowedEmails") || [];
      if (!currentEmails.includes(emailInput.trim())) {
        form.setValue("allowedEmails", [...currentEmails, emailInput.trim()]);
        setEmailInput("");
      } else {
        toast.error("This email is already added");
      }
    }
  };

  const handleRemoveEmail = (email: string) => {
    const currentEmails = form.getValues("allowedEmails") || [];
    form.setValue(
      "allowedEmails",
      currentEmails.filter((e) => e !== email)
    );
  };

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    try {
      setIsLoading(true);
      
      if (!values.allowedEmails || values.allowedEmails.length === 0) {
        toast.error("You must specify at least one allowed email for SME access");
        setIsLoading(false);
        return;
      }

      const response = await axios.post("/api/questions", values, {
        validateStatus: (status) => status < 500,
      });

      if (response.status === 400) {
        const errorMessages = Object.entries(
          response.data.errors?.fieldErrors || {}
        )
          .map(
            ([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`
          )
          .join("\n");
        throw new Error(errorMessages || response.data.message || "Validation failed");
      }

      if (response.status === 403) {
        throw new Error("Unauthorized: Only admins can create questions");
      }

      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || "Failed to create question");
      }

      toast.success("Question created successfully!");
      form.reset();
      setOpen(false);
      // Optionally refresh the page or trigger a refetch
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create question. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="rounded-full" 
          variant="default" 
          size="lg"
          type="button"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Question
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., How can we make women feel safer in your area?" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    What is the main question you want to address?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed context and background for this question..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain the problem in detail to help SMEs and users understand the context.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormDescription>
                    Select relevant tags to help categorize this question.
                  </FormDescription>

                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium">Available Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_TAGS.map((tag) => (
                        <Badge
                          key={tag}
                          variant={
                            (field.value || []).includes(tag) ? "default" : "outline"
                          }
                          className={`cursor-pointer transition-all ${
                            (field.value || []).includes(tag)
                              ? "bg-primary hover:bg-primary/90"
                              : "hover:bg-secondary"
                          }`}
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="mb-3 text-sm font-medium">Custom Tags</h3>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add your own tag"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        onClick={handleAddCustomTag}
                        disabled={!customTag.trim() || isLoading}
                        variant="outline"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(field.value || [])
                        .filter((tag) => !AVAILABLE_TAGS.includes(tag))
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="default"
                            className="cursor-pointer bg-primary hover:bg-primary/90"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Should this question be active immediately?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="allowedEmails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowed SME Emails *</FormLabel>
                    <FormDescription>
                      Add emails of Subject Matter Experts who should be able to contribute solutions. All questions are private and require SME access.
                    </FormDescription>
                    <div className="flex gap-2 mt-2">
                        <Input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddEmail();
                            }
                          }}
                          placeholder="Enter SME email address"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          onClick={handleAddEmail}
                          disabled={!emailInput.trim() || isLoading}
                          variant="outline"
                        >
                          Add Email
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(field.value || []).map((email) => (
                          <Badge
                            key={email}
                            variant="default"
                            className="cursor-pointer bg-primary hover:bg-primary/90"
                          >
                            {email}
                            <X
                              className="ml-1 h-3 w-3"
                              onClick={() => handleRemoveEmail(email)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Question"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};