"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const addSolutionSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title too long"),
  content: z
    .string()
    .min(10, "Solution must be at least 10 characters")
    .max(500, "Solution must not exceed 500 characters"),
});

type AddSolutionFormData = z.infer<typeof addSolutionSchema>;

interface Solution {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AddSolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionId: string;
  onSolutionAdded: (solution: Solution) => void;
}

export function AddSolutionDialog({
  open,
  onOpenChange,
  questionId,
  onSolutionAdded,
}: AddSolutionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddSolutionFormData>({
    resolver: zodResolver(addSolutionSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const onSubmit = async (data: AddSolutionFormData) => {
    try {
      setIsSubmitting(true);
      const response = await axios.post(
        `/api/questions/${questionId}/solutions`,
        data
      );

      if (response.data.success) {
        toast.success("Solution added successfully!");
        form.reset();
        onOpenChange(false);
        onSolutionAdded(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to add solution");
      }
    } catch (error: unknown) {
      console.error("Error adding solution:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to add solution");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentValue = form.watch("content");
  const contentLength = contentValue?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Solution</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter a clear and concise title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your solution (max 500 characters)"
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs mt-1">
                    <span
                      className={
                        contentLength >= 500
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {contentLength}/500
                    </span>
                    <span
                      className={
                        contentLength >= 500
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {Math.max(500 - contentLength, 0)} characters left
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Adding..." : "Add Solution"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
