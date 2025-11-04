"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Send, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function FeedbackForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) {
      toast.error("Please enter your feedback", { duration: 2500 })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback")
      }

      setSubmitted(true)
      toast.success("Thank you for your feedback!", { duration: 2500 })

      setTimeout(() => {
        setComment("")
        setSubmitted(false)
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      console.error("Feedback submission error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit feedback", { duration: 2500 })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-black text-white hover:bg-black/90 px-6 h-12 rounded-lg text-base font-medium flex items-center justify-center gap-2"
      >
        <MessageSquare className="h-4 w-4" />
        Share Feedback
      </Button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md border border-black/10 rounded-2xl p-8 bg-white shadow-xl"
          >
            {/* X button (closes modal) */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-black" />
            </button>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <p className="text-lg text-green-600 font-medium">
                  We appreciate your feedback!
                </p>
              </motion.div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-black mb-4">
                  Your input helps us enhance in harnessing collective intelligence. Tell us what worked well and what could be better
                </h3>

                {/* Comment Input */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-32 resize-none"
                    maxLength={2000}
                    required
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !comment.trim()}
                    className="w-full bg-black text-white hover:bg-black/90 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Feedback"}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </>
  )
}