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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const addProConSchema = z.object({
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(200, "Content must not exceed 200 characters"),
});

type AddProConFormData = z.infer<typeof addProConSchema>;

interface AddProConDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solutionId: number | null;
  type: "pro" | "con";
  onProConAdded: (data: unknown, type: "pro" | "con") => void;
}

export function AddProConDialog({
  open,
  onOpenChange,
  solutionId,
  type,
  onProConAdded,
}: AddProConDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddProConFormData>({
    resolver: zodResolver(addProConSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = async (data: AddProConFormData) => {
    if (!solutionId) {
      toast.error("Solution ID is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const endpoint =
        type === "pro"
          ? `/api/solutions/${solutionId}/pros`
          : `/api/solutions/${solutionId}/cons`;

      const response = await axios.post(endpoint, data);

      if (response.data.success) {
        toast.success(`${type === "pro" ? "Pro" : "Con"} added successfully!`);
        form.reset();
        onOpenChange(false);
        onProConAdded(response.data.data, type);
      } else {
        toast.error(response.data.message || `Failed to add ${type}`);
      }
    } catch (error: unknown) {
      console.error(`Error adding ${type}:`, error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || `Failed to add ${type}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contentValue = form.watch("content");
  const contentLength = contentValue?.length || 0;
  const isLimitReached = contentLength >= 200;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {type === "pro" ? "Pro" : "Con"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{type === "pro" ? "Pro" : "Con"} Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`Write your ${type} (max 200 characters)`}
                      className="min-h-[80px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs mt-1">
                    <span
                      className={
                        isLimitReached
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {contentLength}/200
                    </span>
                    <span
                      className={
                        isLimitReached
                          ? "text-red-500 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {Math.max(200 - contentLength, 0)} characters left
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
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Adding..." : `Add ${type === "pro" ? "Pro" : "Con"}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
