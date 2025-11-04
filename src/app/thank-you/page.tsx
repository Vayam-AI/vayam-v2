"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import { X, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FeedbackForm } from "@/components/feedback-form";
import { Suspense } from "react";

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionLink = searchParams.get("link");
  const userName = searchParams.get("name");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const handleCopyLink = async () => {
    const linkToCopy = questionLink as string
    try {
      await navigator.clipboard.writeText(linkToCopy)
      toast.success("Link Copied to Clipboard!", { duration: 2500 })
    } catch (err) {
      console.error("Failed to copy link:", err)
      toast.error("Failed to copy link", { duration: 2500 })
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1 border border-black/15 rounded-full bg-white/60 backdrop-blur-md p-1 sm:top-6 sm:right-6">

        {/* X Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl text-center space-y-6 sm:space-y-8 px-2"
      >
        {/* Check Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-black rounded-full opacity-10 blur-xl" />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-20 w-20 sm:h-24 sm:w-24 text-black stroke-[1.5]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Thank You Message */}
        <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Thank You, {userName}
          </h1>
          <div className="h-1 w-12 sm:w-16 bg-black mx-auto" />
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-md sm:max-w-lg mx-auto font-light">
            Your voice matters and has been recorded.
            <br className="hidden sm:block" />
            We appreciate your contribution to building a thoughtful community.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center mt-8"
        >
          <FeedbackForm />
          <Button
            onClick={handleCopyLink}
            className={`bg-black text-white hover:bg-black/90 px-6 h-11 sm:h-12 rounded-lg text-sm sm:text-base font-medium flex items-center justify-center
              }`}
          >
            <Share2 size={18} />
            Invite Friends to Ideate
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-black text-white hover:bg-black/90 px-6 h-11 sm:h-12 rounded-lg text-sm sm:text-base font-medium flex items-center justify-center"
          >
            Explore More Questions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
