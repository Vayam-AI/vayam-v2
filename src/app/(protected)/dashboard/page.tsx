"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateQuestion } from "@/components/questions/create-question";
import { Users, MessageCircle, Search } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import { toast } from "sonner";
import Loading from "@/components/ui/loading";

interface Question {
  id: number;
  title: string;
  description: string;
  tags: string[];
  participantCount: number;
  allowedEmails: string[];
  owner: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  ownerEmail: string;
  ownerUsername: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const toastShownRef = useRef(false);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  

  // Check if user is admin
  const isAdmin = isAdminUser(session?.user?.role);

useEffect(() => {
  if (status === "unauthenticated" && !toastShownRef.current) {
    // Show toast notification
    toastShownRef.current = true;
    toast.error("Session expired. Please sign in again.", {
      duration: 3000,
    });

    // Redirect after toast
    redirectTimerRef.current = setTimeout(() => {
      router.push("/signin");
    }, 2000);
  }

  // Only proceed if authenticated
  if (status !== "authenticated" || !session) {
    return;
  }
  
  async function fetchQuestions() {
    setLoading(true);
    try {
      const response = await axios.get("/api/questions");
      if (response.data.success) {
        const questionsData = response.data.data || [];
        // Filter out inactive questions
        const activeQuestions = questionsData.filter(
          (question: Question) => question.isActive
        );
        setQuestions(activeQuestions);
        setFilteredQuestions(activeQuestions);
      } else {
        // Handle API error response
        const errorMessage =
          response.data.message ||
          response.data.error ||
          "Failed to fetch questions";
        if (response.data.data && Array.isArray(response.data.data)) {
          // If we have data but success is false, still show the data but filter out inactive ones
          const activeQuestions = response.data.data.filter(
            (question: Question) => question.isActive
          );
          setQuestions(activeQuestions);
          setFilteredQuestions(activeQuestions);
        } else {
          setError(errorMessage);
        }
      }
      setError(null);
    } catch (err: unknown) {
      console.error("Error fetching questions:", err);
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to fetch questions";
      setError(errorMessage);
      // Don't show toast for empty state
      if (!error?.response?.data?.message?.includes("No questions")) {
        toast.error("Failed to load questions");
      }
    } finally {
      setLoading(false);
      setHasInitialized(true);
    }
  }
  
  // Only fetch data once when session is available and we haven't initialized yet
  if (session && !hasInitialized) {
    fetchQuestions();
  }
}, [status, session, hasInitialized, router]); // 
  // Filter questions based on search query (questions are already filtered to show only active ones)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(
        (question) =>
          question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          question.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          question.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredQuestions(filtered);
    }
  }, [searchQuery, questions]);

  if (status === "loading") {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  // Only show data loading if user is authenticated
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/40 bg-card/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Welcome Text Section */}
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="font-roboto-slab text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-3"
              >
                Welcome to The VayBoard 
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="font-nunito-sans text-muted-foreground max-w-2xl leading-relaxed"
              >
                Explore, Reason, and Shape impactful solutions 
              </motion.p>
            </div>

            {/* Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 lg:items-center"
            >
              {/* Search Bar */}
              <div className="relative lg:w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border/50 focus:border-primary/50"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Error State */}
          {error && !error.includes("No questions") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-destructive mb-8"
            >
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                <p>{error}</p>
              </div>
            </motion.div>
          )}

          {/* Questions Grid */}
          {filteredQuestions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No questions found" : "No questions available"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : isAdmin
                  ? "Create your first question to get started"
                  : "Check back later for new questions"}
              </p>
              {isAdmin && !searchQuery && (
                <div className="mt-6">
                  <CreateQuestion />
                </div>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ y: -4 }}
                    className="h-full"
                  >
                    <div className="space-y-4 h-full">
                      <Card
                        className="group h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-border/50 hover:border-l-4 hover:border-l-orange-500 bg-card"
                        onClick={() => router.push(`/questions/${question.id}`)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-600 transition-colors flex-1">
                              {question.title}
                            </CardTitle>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 transition-colors">
                            {question.description}
                          </p>
                        </CardHeader>

                        <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                {question.participantCount} participants
                              </span>
                            </div>
                          </div>

                          {question.tags && question.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {question.tags.map((tag, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-orange-100 group-hover:text-orange-700 transition-all"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
