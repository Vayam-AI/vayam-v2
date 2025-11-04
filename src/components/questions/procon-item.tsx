"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface ProConItemProps {
  item: {
    id: number;
    content: string;
    upvotes: number;
    downvotes: number;
    userVote: number | null;
  };
  type: "pro" | "con";
  index: number;
}

export function ProConItem({ item, type, index }: ProConItemProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [optimisticVote, setOptimisticVote] = useState<{
    userVote: number | null;
    upvotes: number;
    downvotes: number;
  }>({
    userVote: item.userVote,
    upvotes: item.upvotes,
    downvotes: item.downvotes,
  });

  // Sync optimistic state when item props change (e.g., after adding new pros/cons)
  useEffect(() => {
    setOptimisticVote({
      userVote: item.userVote,
      upvotes: item.upvotes,
      downvotes: item.downvotes,
    });
  }, [item.userVote, item.upvotes, item.downvotes]);

  const handleVote = async (voteType: 1 | -1) => {
    if (isVoting) return;

    // Check if user is clicking the same vote
    if (optimisticVote.userVote === voteType) {
      toast.info("Vote already recorded");
      return;
    }

    setIsVoting(true);

    // Store previous state for rollback
    const previousState = { ...optimisticVote };

    // Calculate new vote counts
    let newUpvotes = optimisticVote.upvotes;
    let newDownvotes = optimisticVote.downvotes;

    if (optimisticVote.userVote === null) {
      // First time voting
      if (voteType === 1) {
        newUpvotes += 1;
      } else {
        newDownvotes += 1;
      }
    } else {
      // Changing vote
      if (optimisticVote.userVote === 1 && voteType === -1) {
        newUpvotes = Math.max(0, newUpvotes - 1);
        newDownvotes += 1;
      } else if (optimisticVote.userVote === -1 && voteType === 1) {
        newDownvotes = Math.max(0, newDownvotes - 1);
        newUpvotes += 1;
      }
    }

    // Optimistically update UI
    setOptimisticVote({
      userVote: voteType,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
    });

    try {
      const response = await axios.post("/api/vote", {
        type,
        id: item.id,
        vote: voteType,
      });

      if (response.data.success) {
        const voteMessage = voteType === 1 ? "👍 Upvoted!" : "👎 Downvoted!";
        toast.success(voteMessage);
        // No need to refetch - optimistic update already handled it
      } else {
        // Revert on failure
        setOptimisticVote(previousState);
        toast.error(response.data.message || "Failed to vote");
      }
    } catch (error: unknown) {
      // Revert on error
      setOptimisticVote(previousState);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = optimisticVote.upvotes + optimisticVote.downvotes;
  const colorClass =
    type === "pro"
      ? optimisticVote.userVote === 1
        ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20"
        : optimisticVote.userVote === -1
        ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
        : "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/20 border border-green-200/60 dark:border-green-800/30 hover:shadow-lg hover:border-green-300/80 dark:hover:border-green-700/50"
      : optimisticVote.userVote === 1
      ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20"
      : optimisticVote.userVote === -1
      ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
      : "bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-950/10 dark:to-red-900/20 border border-red-200/60 dark:border-red-800/30 hover:shadow-lg hover:border-red-300/80 dark:hover:border-red-700/50";

  const badgeColor = type === "pro" ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30" : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
  const borderColor = type === "pro" ? "border-green-200/50 dark:border-green-800/30" : "border-red-200/50 dark:border-red-800/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={`relative rounded-xl p-4 sm:p-6 transition-all duration-200 hover:shadow-md ${colorClass}`}
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
          <p className="text-sm sm:text-base text-foreground leading-relaxed font-medium flex-1">
            {item.content}
          </p>
          {totalVotes > 0 && (
            <div className="flex items-center">
              <span className={`text-xs sm:text-sm font-bold ${badgeColor} px-2 py-1 rounded-full whitespace-nowrap`}>
                {totalVotes} votes
              </span>
            </div>
          )}
        </div>

        <div className={`flex items-center justify-end pt-2 border-t ${borderColor}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(1)}
              disabled={isVoting}
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                optimisticVote.userVote === 1
                  ? "bg-green-500 hover:bg-green-600 text-white shadow-lg ring-2 ring-green-300"
                  : "hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600"
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{optimisticVote.upvotes || 0}</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full transition-all duration-200 ${
                optimisticVote.userVote === -1
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg ring-2 ring-red-300"
                  : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"
              }`}
            >
              <div className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{optimisticVote.downvotes || 0}</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
