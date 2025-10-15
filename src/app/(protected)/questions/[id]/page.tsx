"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoaderOne } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MessageSquare,
  Users,
  Clock,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

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

interface User {
  uid: number;
  username: string | null;
  email: string;
}

interface ProCon {
  id: number;
  solutionId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  voteCount: number;
  userVote: number | null;
}

interface Solution {
  id: number;
  questionId: number;
  userId: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  pros: ProCon[];
  cons: ProCon[];
  voteCount: number;
  userVote: number | null;
}

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
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  // Collapsible states
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set());

  // Pagination states for pros and cons
  const [prosCurrentPage, setProsCurrentPage] = useState<{[solutionId: number]: number}>({});
  const [consCurrentPage, setConsCurrentPage] = useState<{[solutionId: number]: number}>({});
  const ITEMS_PER_PAGE = 5;

  // Helper function to shuffle array (Fisher-Yates algorithm)
  const shuffleArray = (array: Solution[]): Solution[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Authentication check effect
  useEffect(() => {
    if (status === "loading") return; // Still checking authentication
    
    if (status === "unauthenticated") {
      // Show new user message and start countdown
      setShowNewUserMessage(true);
      setAuthChecked(true); // Mark auth as checked for unauthenticated users
      setRedirectCountdown(10);
      
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          const newCount = prev - 1;
          if (newCount <= 0) {
            clearInterval(countdownInterval);
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              router.push(`/signup?redirect=/questions/${questionId}`);
            }, 0);
            return 0;
          }
          return newCount;
        });
      }, 1000);
      
      // Cleanup interval on component unmount
      return () => clearInterval(countdownInterval);
    }
    
    // For authenticated users, mark auth as checked
    if (status === "authenticated") {
      setAuthChecked(true);
      setShowNewUserMessage(false); // Ensure message is hidden for authenticated users
    }
  }, [status, router, questionId]);

  // Helper function to toggle solution expansion
  const toggleSolutionExpansion = (solutionId: number) => {
    setExpandedSolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(solutionId)) {
        newSet.delete(solutionId);
      } else {
        newSet.add(solutionId);
      }
      return newSet;
    });
  };

  // Helper functions for pagination
  const getProsCurrentPage = (solutionId: number) => prosCurrentPage[solutionId] || 1;
  const getConsCurrentPage = (solutionId: number) => consCurrentPage[solutionId] || 1;
  
  const setProsPage = (solutionId: number, page: number) => {
    setProsCurrentPage(prev => ({ ...prev, [solutionId]: page }));
  };
  
  const setConsPage = (solutionId: number, page: number) => {
    setConsCurrentPage(prev => ({ ...prev, [solutionId]: page }));
  };

  // Helper function to sort and paginate pros/cons by vote count
  const getSortedAndPaginatedItems = (items: ProCon[], currentPage: number) => {
    if (!items || items.length === 0) return { paginatedItems: [], totalPages: 0 };
    
    // Sort by vote count (highest first) - total number of votes regardless of type
    const sortedItems = [...items].sort((a, b) => {
      const aVotes = Math.abs(a.voteCount || 0);
      const bVotes = Math.abs(b.voteCount || 0);
      return bVotes - aVotes;
    });
    
    const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    
    return { paginatedItems, totalPages };
  };

  // Dialog states
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [showProDialog, setShowProDialog] = useState(false);
  const [showConDialog, setShowConDialog] = useState(false);
  const [selectedSolutionId, setSelectedSolutionId] = useState<number | null>(null);
  const [solutionTitle, setSolutionTitle] = useState("");
  const [solutionContent, setSolutionContent] = useState("");
  const [proConContent, setProConContent] = useState("");
  const [submittingSolution, setSubmittingSolution] = useState(false);
  const [submittingProCon, setSubmittingProCon] = useState(false);

  const canAddSolution = question?.allowedEmails.includes(session?.user?.email || "") || false;

  const fetchQuestionDetails = useCallback(async () => {
    if (dataFetched) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/questions/${questionId}`);
      if (response.data.success) {
        setQuestion(response.data.data.question);
        // Randomize solutions order for better user experience
        const randomizedSolutions = shuffleArray(response.data.data.solutions || []);
        setSolutions(randomizedSolutions);
        setDataFetched(true);
      } else {
        setError(response.data.message || "Failed to fetch question details");
      }
    } catch (err: unknown) {
      console.error("Error fetching question details:", err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error?.response?.data?.message || "Failed to fetch question details");
      toast.error("Failed to load question details");
    } finally {
      setLoading(false);
    }
  }, [questionId, dataFetched]);

  useEffect(() => {
    if (questionId && session && authChecked && !dataFetched) {
      fetchQuestionDetails();
    }
  }, [questionId, session, authChecked, fetchQuestionDetails, dataFetched]);

  const handleVote = async (type: "pro" | "con", itemId: number, voteType: 1 | -1) => {
    try {
      const response = await axios.post("/api/vote", {
        type,
        id: itemId,
        vote: voteType,
      });

      if (response.data.success) {
        // Update local state with the new vote
        setSolutions(prevSolutions => 
          prevSolutions.map(solution => ({
            ...solution,
            pros: type === "pro" 
              ? (solution.pros || []).map(pro => 
                  pro.id === itemId 
                    ? { ...pro, userVote: voteType, voteCount: response.data.data?.voteCount || pro.voteCount }
                    : pro
                )
              : solution.pros,
            cons: type === "con"
              ? (solution.cons || []).map(con => 
                  con.id === itemId 
                    ? { ...con, userVote: voteType, voteCount: response.data.data?.voteCount || con.voteCount }
                    : con
                )
              : solution.cons,
          }))
        );
        
        const voteMessage = voteType === 1 ? "👍 Upvoted!" : "👎 Downvoted!";
        toast.success(voteMessage);
      } else {
        toast.error(response.data.message || "Failed to vote");
      }
    } catch (err: unknown) {
      console.error("Error voting:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to vote");
    }
  };

  const handleAddSolution = async () => {
    if (!solutionTitle.trim() || !solutionContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setSubmittingSolution(true);
      const response = await axios.post(`/api/questions/${questionId}/solutions`, {
        title: solutionTitle,
        content: solutionContent,
      });

      if (response.data.success) {
        toast.success("Solution added successfully!");
        setSolutionTitle("");
        setSolutionContent("");
        setShowSolutionDialog(false);
        // Add new solution to local state
        setSolutions(prev => [...prev, response.data.data]);
      } else {
        toast.error(response.data.message || "Failed to add solution");
      }
    } catch (err: unknown) {
      console.error("Error adding solution:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to add solution");
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleAddProCon = async (type: "pro" | "con") => {
    if (!proConContent.trim() || !selectedSolutionId) {
      toast.error("Please enter content");
      return;
    }

    try {
      setSubmittingProCon(true);
      const endpoint = type === "pro" 
        ? `/api/solutions/${selectedSolutionId}/pros`
        : `/api/solutions/${selectedSolutionId}/cons`;
      
      const response = await axios.post(endpoint, {
        content: proConContent,
      });

      if (response.data.success) {
        toast.success(`${type === "pro" ? "Pro" : "Con"} added successfully!`);
        setProConContent("");
        setShowProDialog(false);
        setShowConDialog(false);
        setSelectedSolutionId(null);
        
        // Add new pro/con to local state
        setSolutions(prev => 
          prev.map(solution => 
            solution.id === selectedSolutionId
              ? {
                  ...solution,
                  [type === "pro" ? "pros" : "cons"]: [
                    ...(solution[type === "pro" ? "pros" : "cons"] || []),
                    response.data.data
                  ]
                }
              : solution
          )
        );
      } else {
        toast.error(response.data.message || `Failed to add ${type}`);
      }
    } catch (err: unknown) {
      console.error(`Error adding ${type}:`, err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || `Failed to add ${type}`);
    } finally {
      setSubmittingProCon(false);
    }
  };

  // Show new user message for unauthenticated users (highest priority)
  if (status === "unauthenticated" && showNewUserMessage) {
    return (
      <div className="h-full bg-background flex items-center justify-center relative z-[9999]">
        <div className="max-w-md mx-auto text-center p-8 bg-card border border-border rounded-lg shadow-lg relative z-[10000]">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-info/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-info" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome! New User Detected</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are a new user and haven&apos;t created an account yet. Please create an account first to start viewing and contributing to questions.
            </p>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-muted-foreground mb-2">Redirecting to signup in:</div>
            <div className="text-3xl font-bold text-info">{redirectCountdown}s</div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push(`/signup?redirect=/questions/${questionId}`)}
              className="w-full"
              size="lg"
            >
              Create Account Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/signin")}
              className="w-full"
            >
              Already have an account? Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner only when status is loading OR when authenticated but auth not yet checked
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
      <div className="h-full bg-background flex items-center justify-center">
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
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          {/* Navigation Bar */}
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="hover:bg-muted/80 text-muted-foreground transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/thank-you")}
                className="hover:bg-muted/80 text-muted-foreground transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Exit
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Question Title Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-lg mb-8"
          >
            <Collapsible open={isQuestionExpanded} onOpenChange={setIsQuestionExpanded}>
              <CollapsibleTrigger className="w-full">
                <motion.div 
                  className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all duration-300 rounded-lg cursor-pointer"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <h1 className="text-2xl font-bold text-foreground text-left">{question.title}</h1>
                  <motion.div className="relative">
                    <motion.div
                      initial={false}
                      animate={{ 
                        opacity: isQuestionExpanded ? 1 : 0,
                        scale: isQuestionExpanded ? 1 : 0.8
                      }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Minus className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                    </motion.div>
                    <motion.div
                      initial={false}
                      animate={{ 
                        opacity: !isQuestionExpanded ? 1 : 0,
                        scale: !isQuestionExpanded ? 1 : 0.8
                      }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="flex items-center justify-center"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </CollapsibleTrigger>
              
              <CollapsibleContent asChild>
                <motion.div
                  initial={false}
                  animate={{ opacity: isQuestionExpanded ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="px-6 pb-6 border-t border-border/50">
                    <motion.p 
                      className="text-muted-foreground text-base leading-relaxed mb-4 mt-4"
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      {question.description}
                    </motion.p>
                    
                    <motion.div 
                      className="flex items-center gap-6 text-sm text-muted-foreground mb-4"
                      initial={{ y: -10 }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{question.participantCount} participants</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{solutions.length} solutions</span>
                      </div>
                    </motion.div>

                    {question.tags && question.tags.length > 0 && (
                      <motion.div 
                        className="flex flex-wrap gap-2"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                      >
                        {question.tags.map((tag, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.1 }}
                          >
                            <Badge variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>

          {/* Solutions List */}
          {solutions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No solutions yet</h3>
              <p className="text-muted-foreground text-base">
                {canAddSolution
                  ? "Be the first to add a solution to this question"
                  : "Solutions will appear here when experts add them"}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Solutions Header */}
              <motion.div 
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h2 className="text-xl font-semibold text-foreground">
                  Solutions ({solutions.length})
                </h2>
              </motion.div>

              {/* All Solutions */}
              {solutions.map((solution, index) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <Collapsible 
                    open={expandedSolutions.has(solution.id)} 
                    onOpenChange={() => toggleSolutionExpansion(solution.id)}
                  >
                    {/* Solution Header */}
                    <CollapsibleTrigger className="w-full">
                      <motion.div 
                        className="flex items-center justify-between p-6 hover:bg-muted/30 transition-all duration-300 cursor-pointer"
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                      >
                        <h3 className="text-xl font-bold text-foreground text-left">
                          {solution.title}
                        </h3>
                        <motion.div className="relative">
                          <motion.div
                            initial={false}
                            animate={{ 
                              opacity: expandedSolutions.has(solution.id) ? 1 : 0,
                              scale: expandedSolutions.has(solution.id) ? 1 : 0.8
                            }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Minus className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                          </motion.div>
                          <motion.div
                            initial={false}
                            animate={{ 
                              opacity: !expandedSolutions.has(solution.id) ? 1 : 0,
                              scale: !expandedSolutions.has(solution.id) ? 1 : 0.8
                            }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex items-center justify-center"
                          >
                            <Plus className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
                          </motion.div>
                        </motion.div>
                      </motion.div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent asChild>
                      <motion.div
                        initial={false}
                        animate={{ opacity: expandedSolutions.has(solution.id) ? 1 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 border-t border-border/50">
                          <motion.p 
                            className="text-muted-foreground text-base leading-relaxed mb-4 mt-4"
                            initial={{ y: -10 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                          >
                            {solution.content}
                          </motion.p>
                          <motion.div 
                            className="text-sm text-muted-foreground mb-4"
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                          >
                            Added on {new Date(solution.createdAt).toLocaleDateString()}
                          </motion.div>

                          {/* Pros and Cons Grid */}
                          <motion.div 
                            className="grid grid-cols-1 lg:grid-cols-2 border-t border-border/50"
                            initial={{ y: -10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                          >
                          {/* Pros Section */}
                          <div className="p-6 border-r border-border/50">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                                  Pros
                                </h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSolutionId(solution.id);
                                  setShowProDialog(true);
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 w-8 p-0 rounded-full"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Pros List */}
                            {!solution.pros || solution.pros.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic text-center py-8">
                                No pros yet. Be the first to add one!
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {(() => {
                                  const currentPage = getProsCurrentPage(solution.id);
                                  const { paginatedItems: prosToShow, totalPages } = getSortedAndPaginatedItems(solution.pros, currentPage);
                                  
                                  return (
                                    <>

                                      {/* Pros Items */}
                                      {prosToShow.map((pro, proIndex) => (
                                        <motion.div
                                          key={pro.id}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.3, delay: proIndex * 0.05 }}
                                          className={`relative rounded-xl p-6 transition-all duration-500 backdrop-blur-sm ${
                                            pro.userVote === 1 
                                              ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20" 
                                              : pro.userVote === -1
                                              ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
                                              : "bg-gradient-to-r from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/20 border border-green-200/60 dark:border-green-800/30 hover:shadow-lg hover:border-green-300/80 dark:hover:border-green-700/50"
                                          }`}
                                        >
                                          <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                              <p className="text-base text-foreground leading-relaxed font-medium flex-1">
                                                {pro.content}
                                              </p>
                                              {pro.voteCount !== 0 && (
                                                <div className="ml-4 flex items-center">
                                                  <span className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                    {Math.abs(pro.voteCount || 0)} votes
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-green-200/50 dark:border-green-800/30">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(pro.createdAt).toLocaleDateString()}
                                              </span>
                                              
                                              <div className="flex items-center gap-3">
                                                <motion.div
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleVote("pro", pro.id, 1)}
                                                    className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                                      pro.userVote === 1 
                                                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg ring-2 ring-green-300" 
                                                        : "hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600"
                                                    }`}
                                                  >
                                                    <motion.div
                                                      animate={{ 
                                                        y: pro.userVote === 1 ? -1 : 0,
                                                        scale: pro.userVote === 1 ? 1.1 : 1
                                                      }}
                                                      transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                      <ArrowUp className="h-4 w-4" />
                                                    </motion.div>
                                                  </Button>
                                                </motion.div>
                                                
                                                <motion.div
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleVote("pro", pro.id, -1)}
                                                    className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                                      pro.userVote === -1 
                                                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg ring-2 ring-red-300" 
                                                        : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"
                                                    }`}
                                                  >
                                                    <motion.div
                                                      animate={{ 
                                                        y: pro.userVote === -1 ? 1 : 0,
                                                        scale: pro.userVote === -1 ? 1.1 : 1
                                                      }}
                                                      transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                      <ArrowDown className="h-4 w-4" />
                                                    </motion.div>
                                                  </Button>
                                                </motion.div>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      ))}

                                      {/* Bottom Pros Pagination */}
                                      {totalPages > 1 && (
                                        <motion.div 
                                          className="flex justify-between items-center mt-4 p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg border border-green-200/30 dark:border-green-800/20"
                                          initial={{ scale: 0.95, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          transition={{ duration: 0.3, delay: 0.2 }}
                                        >
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setProsPage(solution.id, Math.max(1, currentPage - 1))}
                                              disabled={currentPage === 1}
                                              className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-green-200 dark:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <ChevronLeft className="h-5 w-5 text-green-600" />
                                            </Button>
                                          </motion.div>
                                          <motion.div 
                                            className="text-center"
                                            initial={{ y: -5 }}
                                            animate={{ y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.1 }}
                                          >
                                            <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                              Page {currentPage} of {totalPages}
                                            </span>
                                            <p className="text-xs text-green-600/80 dark:text-green-400/80">
                                              {solution.pros.length} Pro Arguments (sorted by votes)
                                            </p>
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setProsPage(solution.id, Math.min(totalPages, currentPage + 1))}
                                              disabled={currentPage === totalPages}
                                              className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-green-200 dark:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <ChevronRight className="h-5 w-5 text-green-600" />
                                            </Button>
                                          </motion.div>
                                        </motion.div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Cons Section */}
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <h4 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                                  Cons
                                </h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSolutionId(solution.id);
                                  setShowConDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 rounded-full"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {/* Cons List */}
                            {!solution.cons || solution.cons.length === 0 ? (
                              <p className="text-sm text-muted-foreground italic text-center py-8">
                                No cons yet. Be the first to add one!
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {(() => {
                                  const currentPage = getConsCurrentPage(solution.id);
                                  const { paginatedItems: consToShow, totalPages } = getSortedAndPaginatedItems(solution.cons, currentPage);
                                  
                                  return (
                                    <>
                                      

                                      {/* Cons Items */}
                                      {consToShow.map((con, conIndex) => (
                                        <motion.div
                                          key={con.id}
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.3, delay: conIndex * 0.05 }}
                                          className={`relative rounded-xl p-6 transition-all duration-500 backdrop-blur-sm ${
                                            con.userVote === 1 
                                              ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/40 border-2 border-green-300 dark:border-green-600 shadow-xl shadow-green-200/30 dark:shadow-green-900/20" 
                                              : con.userVote === -1
                                              ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/40 border-2 border-red-300 dark:border-red-600 shadow-xl shadow-red-200/30 dark:shadow-red-900/20"
                                              : "bg-gradient-to-r from-red-50/50 to-red-100/50 dark:from-red-950/10 dark:to-red-900/20 border border-red-200/60 dark:border-red-800/30 hover:shadow-lg hover:border-red-300/80 dark:hover:border-red-700/50"
                                          }`}
                                        >
                                          <div className="space-y-4">
                                            <div className="flex items-start justify-between">
                                              <p className="text-base text-foreground leading-relaxed font-medium flex-1">
                                                {con.content}
                                              </p>
                                              {con.voteCount !== 0 && (
                                                <div className="ml-4 flex items-center">
                                                  <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                                    {Math.abs(con.voteCount || 0)} votes
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                            
                                            <div className="flex items-center justify-between pt-2 border-t border-red-200/50 dark:border-red-800/30">
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(con.createdAt).toLocaleDateString()}
                                              </span>
                                              
                                              <div className="flex items-center gap-3">
                                                <motion.div
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleVote("con", con.id, 1)}
                                                    className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                                      con.userVote === 1 
                                                        ? "bg-green-500 hover:bg-green-600 text-white shadow-lg ring-2 ring-green-300" 
                                                        : "hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600"
                                                    }`}
                                                  >
                                                    <motion.div
                                                      animate={{ 
                                                        y: con.userVote === 1 ? -1 : 0,
                                                        scale: con.userVote === 1 ? 1.1 : 1
                                                      }}
                                                      transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                      <ArrowUp className="h-4 w-4" />
                                                    </motion.div>
                                                  </Button>
                                                </motion.div>
                                                
                                                <motion.div
                                                  whileHover={{ scale: 1.1 }}
                                                  whileTap={{ scale: 0.95 }}
                                                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                                >
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleVote("con", con.id, -1)}
                                                    className={`h-10 w-10 rounded-full transition-all duration-300 group ${
                                                      con.userVote === -1 
                                                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg ring-2 ring-red-300" 
                                                        : "hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"
                                                    }`}
                                                  >
                                                    <motion.div
                                                      animate={{ 
                                                        y: con.userVote === -1 ? 1 : 0,
                                                        scale: con.userVote === -1 ? 1.1 : 1
                                                      }}
                                                      transition={{ type: "spring", stiffness: 300 }}
                                                    >
                                                      <ArrowDown className="h-4 w-4" />
                                                    </motion.div>
                                                  </Button>
                                                </motion.div>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      ))}

                                      {/* Bottom Cons Pagination */}
                                      {totalPages > 1 && (
                                        <motion.div 
                                          className="flex justify-between items-center mt-4 p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg border border-red-200/30 dark:border-red-800/20"
                                          initial={{ scale: 0.95, opacity: 0 }}
                                          animate={{ scale: 1, opacity: 1 }}
                                          transition={{ duration: 0.3, delay: 0.2 }}
                                        >
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setConsPage(solution.id, Math.max(1, currentPage - 1))}
                                              disabled={currentPage === 1}
                                              className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-200 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <ChevronLeft className="h-5 w-5 text-red-600" />
                                            </Button>
                                          </motion.div>
                                          <motion.div 
                                            className="text-center"
                                            initial={{ y: -5 }}
                                            animate={{ y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.1 }}
                                          >
                                            <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                              Page {currentPage} of {totalPages}
                                            </span>
                                            <p className="text-xs text-red-600/80 dark:text-red-400/80">
                                              {solution.cons.length} Con Arguments (sorted by votes)
                                            </p>
                                          </motion.div>
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                          >
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => setConsPage(solution.id, Math.min(totalPages, currentPage + 1))}
                                              disabled={currentPage === totalPages}
                                              className="h-10 w-10 p-0 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border border-red-200 dark:border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <ChevronRight className="h-5 w-5 text-red-600" />
                                            </Button>
                                          </motion.div>
                                        </motion.div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </motion.div>
                        </div>
                      </motion.div>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Solution Button */}
      {canAddSolution && (
        <motion.div 
          className="fixed bottom-8 right-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setShowSolutionDialog(true)}
            size="lg"
            title="Add Solution"
            className="rounded-full h-16 w-16 shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="h-8 w-8" />
          </Button>
        </motion.div>
      )}

      {/* Add Solution Dialog */}
      <Dialog open={showSolutionDialog} onOpenChange={setShowSolutionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Solution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Solution Title
              </label>
              <Input
                value={solutionTitle}
                onChange={(e) => setSolutionTitle(e.target.value)}
                placeholder="Enter solution title"
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Solution Description
              </label>
              <Textarea
                value={solutionContent}
                onChange={(e) => setSolutionContent(e.target.value)}
                placeholder="Describe your solution in detail"
                className="w-full min-h-[120px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSolutionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSolution}
                disabled={submittingSolution}
                className="flex-1"
              >
                {submittingSolution ? "Adding..." : "Add Solution"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pro Dialog */}
      <Dialog open={showProDialog} onOpenChange={setShowProDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Pro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pro Description
              </label>
              <Textarea
                value={proConContent}
                onChange={(e) => setProConContent(e.target.value)}
                placeholder="Describe the positive aspect of this solution"
                className="w-full min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddProCon("pro")}
                disabled={submittingProCon}
                className="flex-1"
              >
                {submittingProCon ? "Adding..." : "Add Pro"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Con Dialog */}
      <Dialog open={showConDialog} onOpenChange={setShowConDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Con</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Con Description
              </label>
              <Textarea
                value={proConContent}
                onChange={(e) => setProConContent(e.target.value)}
                placeholder="Describe the negative aspect of this solution"
                className="w-full min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleAddProCon("con")}
                disabled={submittingProCon}
                className="flex-1"
              >
                {submittingProCon ? "Adding..." : "Add Con"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}