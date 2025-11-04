"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Minus, Users, MessageSquare } from "lucide-react";

interface QuestionHeaderProps {
  question: {
    title: string;
    description: string;
    tags: string[];
    participantCount: number;
  };
  solutionCount: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function QuestionHeader({
  question,
  solutionCount,
  isExpanded,
  onToggle,
}: QuestionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg mb-8"
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="w-full">
          <motion.div
            className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-all duration-300 rounded-lg cursor-pointer"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <h1 className="text-xl sm:text-2xl font-bold text-foreground text-left">
              {question.title}
            </h1>
            <motion.div className="relative min-w-[1.25rem]">
              <motion.div
                initial={false}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                  scale: isExpanded ? 1 : 0.8,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Minus className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{
                  opacity: !isExpanded ? 1 : 0,
                  scale: !isExpanded ? 1 : 0.8,
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
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-border/50">
              <motion.p
                className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 mt-4"
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                {question.description}
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground mb-4"
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{question.participantCount} participants</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>{solutionCount} solutions</span>
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
                      transition={{
                        duration: 0.3,
                        delay: 0.4 + idx * 0.1,
                      }}
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
  );
}
