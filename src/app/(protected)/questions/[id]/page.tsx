"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LoaderOne } from "@/components/ui/loader";
import { ArrowLeft, X, MessageSquare, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { QuestionHeader } from "@/components/questions/question-header";
import { SolutionCard } from "@/components/questions/solution-card";
import { AddSolutionDialog } from "@/components/questions/add-solution-dialog";
import { AddProConDialog } from "@/components/questions/add-procon-dialog";
import type { Question, Solution, ApiSolutionResponse, ApiProConResponse } from "@/components/questions/types";

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function QuestionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const questionId = params.id as string;

  const [question, setQuestion] = useState<Question | null>(null);
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set());

  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [showProDialog, setShowProDialog] = useState(false);
  const [showConDialog, setShowConDialog] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState<number | null>(null);

  const toastShownRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated" && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.error("Please sign in to continue");
      router.push(`/signin?callbackUrl=/questions/${questionId}`);
      return;
    }

    if (status === "authenticated") {
      setAuthChecked(true);
    }
  }, [status, router, questionId]);

  // If the API returned the question, the user has passed the access check
  // (owner, allowedEmails, or questionAccess) — so they can add solutions
  const canAddSolution = question?.hasAccess || false;

  const fetchQuestionDetails = useCallback(
    async (forceRefetch = false) => {
      if (dataFetched && !forceRefetch) return;

      try {
        if (!forceRefetch) setLoading(true);
        const response = await axios.get(`/api/questions/${questionId}`);

        if (response.data.success) {
          setQuestion(response.data.data.question);

          const processedSolutions = (response.data.data.solutions || []).map(
            (solution: ApiSolutionResponse) => ({
              ...solution,
              voteCount: Number(solution.voteCount) || 0,
              pros: (solution.pros || []).map((pro: ApiProConResponse) => ({
                ...pro,
                upvotes: Number(pro.upvotes) || 0,
                downvotes: Number(pro.downvotes) || 0,
                voteCount: Number(pro.voteCount) || 0,
                userVote: pro.userVote !== null ? Number(pro.userVote) : null,
              })),
              cons: (solution.cons || []).map((con: ApiProConResponse) => ({
                ...con,
                upvotes: Number(con.upvotes) || 0,
                downvotes: Number(con.downvotes) || 0,
                voteCount: Number(con.voteCount) || 0,
                userVote: con.userVote !== null ? Number(con.userVote) : null,
              })),
            })
          );

          const finalSolutions = forceRefetch ? processedSolutions : shuffleArray(processedSolutions);
          setSolutions(finalSolutions);
          if (!forceRefetch) setDataFetched(true);
        } else {
          setError(response.data.message || "Failed to fetch question details");
        }
      } catch (err: unknown) {
        console.error("Error fetching question details:", err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error?.response?.data?.message || "Failed to fetch question details");
        toast.error("Failed to load question details");
      } finally {
        if (!forceRefetch) setLoading(false);
      }
    },
    [questionId, dataFetched]
  );

  useEffect(() => {
    if (questionId && session && authChecked && !dataFetched) {
      fetchQuestionDetails();
    }
  }, [questionId, session, authChecked, fetchQuestionDetails, dataFetched]);

  const toggleSolutionExpansion = (solutionId: number) => {
    setExpandedSolutions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(solutionId)) {
        newSet.delete(solutionId);
      } else {
        newSet.add(solutionId);
      }
      return newSet;
    });
  };

  const handleSolutionAdded = (newSolution: Partial<Solution>) => {
    // Construct a full Solution object with default values for missing properties
    const fullSolution: Solution = {
      id: newSolution.id!,
      questionId: newSolution.questionId!,
      userId: newSolution.userId!,
      title: newSolution.title!,
      content: newSolution.content!,
      isActive: newSolution.isActive ?? true,
      createdAt: newSolution.createdAt!,
      updatedAt: newSolution.updatedAt!,
      user: newSolution.user || {
        uid: newSolution.userId!,
        username: session?.user?.name || null,
        email: session?.user?.email || "",
      },
      pros: newSolution.pros || [],
      cons: newSolution.cons || [],
      voteCount: newSolution.voteCount ?? 0,
      userVote: newSolution.userVote ?? null,
    };
    setSolutions((prev) => [...prev, fullSolution]);
  };

  const handleProConAdded = (data: unknown, type: "pro" | "con") => {
    if (!selectedSolutionId) return;
    setSolutions((prev) =>
      prev.map((solution) =>
        solution.id === selectedSolutionId
          ? {
            ...solution,
            [type === "pro" ? "pros" : "cons"]: [
              ...(solution[type === "pro" ? "pros" : "cons"] || []),
              data,
            ],
          }
          : solution
      )
    );
  };

  const handleAddPro = (solutionId: number) => {
    setSelectedSolutionId(solutionId);
    setShowProDialog(true);
  };

  const handleAddCon = (solutionId: number) => {
    setSelectedSolutionId(solutionId);
    setShowConDialog(true);
  };

  const handleClose = () => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const userName = session?.user?.name || "User"
    router.push(`/thank-you?link=${encodeURIComponent(currentUrl)}&name=${encodeURIComponent(userName)}`);
  };

  if (status === "loading" || (status === "authenticated" && !authChecked)) {
    return (
      <div className="h-full bg-background flex items-center justify-center relative z-10">
        <LoaderOne />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <LoaderOne />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Question not found"}</p>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
          <motion.div
            className="flex items-center justify-between mb-4 sm:mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")} className="hover:bg-muted/80 text-muted-foreground transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={handleClose} className="hover:bg-muted/80 text-muted-foreground transition-all duration-200">
                <X className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </motion.div>
          </motion.div>

          <QuestionHeader
            question={question}
            solutionCount={solutions.length}
            isExpanded={isQuestionExpanded}
            onToggle={() => setIsQuestionExpanded(!isQuestionExpanded)}
          />

          <div className="space-y-6">
            <motion.div className="flex items-center justify-between" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Solutions</h2>
              {canAddSolution && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 200 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => setShowSolutionDialog(true)} size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Add Solution</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {solutions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 sm:py-16">
                <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No solutions yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {canAddSolution ? "Be the first to add a solution to this question" : "Solutions will appear here when experts add them"}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {solutions.map((solution, index) => (
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    index={index}
                    isExpanded={expandedSolutions.has(solution.id)}
                    onToggleExpand={() => toggleSolutionExpansion(solution.id)}
                    onAddPro={handleAddPro}
                    onAddCon={handleAddCon}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddSolutionDialog
        open={showSolutionDialog}
        onOpenChange={setShowSolutionDialog}
        questionId={questionId}
        onSolutionAdded={handleSolutionAdded}
      />

      <AddProConDialog
        open={showProDialog}
        onOpenChange={setShowProDialog}
        solutionId={selectedSolutionId}
        type="pro"
        onProConAdded={handleProConAdded}
      />

      <AddProConDialog
        open={showConDialog}
        onOpenChange={setShowConDialog}
        solutionId={selectedSolutionId}
        type="con"
        onProConAdded={handleProConAdded}
      />
    </div>
  );
}