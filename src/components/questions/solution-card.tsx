"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { ProConSection } from "./procon-section";
import { Button } from "@/components/ui/button";
import { ProConItem } from "./procon-item";

import type { Solution, ProCon } from "./types";

// Mobile Horizontal Scrollable Carousel for Pros/Cons
function MobileProConCarousel({
  items,
  type,
  onAddClick,
}: {
  items: ProCon[];
  type: "pro" | "con";
  onAddClick: () => void;
}) {
  const isPro = type === "pro";
  const title = isPro ? "Pros" : "Cons";

  // Sort items by total number of voters (upvotes + downvotes), highest first
  const sortedItems = [...items].sort((a, b) => {
    const aTotalVoters = (a.upvotes || 0) + (a.downvotes || 0);
    const bTotalVoters = (b.upvotes || 0) + (b.downvotes || 0);
    return bTotalVoters - aTotalVoters;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4
          className={`text-lg sm:text-xl font-bold ${
            isPro ? "text-green-600" : "text-red-600"
          }`}
        >
          {title}
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Add</span>
        </Button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-8">
          No {title.toLowerCase()} yet.
        </div>
      ) : (
        <>
          {/* Horizontal Scrollable Container */}
          <div
            className="overflow-x-auto -mx-1"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <div className="flex gap-3 px-1 pb-2">
              {sortedItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="shrink-0 first:ml-0 last:mr-0"
                  style={{
                    width: "calc(100% - 0.5rem)",
                    minWidth: "calc(100% - 0.5rem)",
                    scrollSnapAlign: "start",
                  }}
                >
                  <ProConItem item={item} type={type} index={idx} />
                </div>
              ))}
            </div>
          </div>

          {/* Scroll Instruction */}
          {sortedItems.length > 1 && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ChevronLeft className="h-3 w-3 animate-pulse" />
              <span className="text-xs">Swipe to see more</span>
              <ChevronRight className="h-3 w-3 animate-pulse" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SolutionCardProps {
  solution: Solution;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddPro: (solutionId: number) => void;
  onAddCon: (solutionId: number) => void;
}

export function SolutionCard({
  solution,
  index,
  isExpanded,
  onToggleExpand,
  onAddPro,
  onAddCon,
}: SolutionCardProps) {
  const [prosCurrentPage, setProsCurrentPage] = useState(1);
  const [consCurrentPage, setConsCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <CollapsibleTrigger className="w-full">
          <motion.div
            className="flex items-center justify-between p-4 sm:p-6 hover:bg-muted/30 transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            <h3 className="text-lg sm:text-xl font-bold text-foreground text-left">
              {solution.title}
            </h3>
            <motion.div className="relative min-w-5">
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
                {solution.content}
              </motion.p>

              {/* Desktop Layout - Side by Side with Pagination */}
              <motion.div
                className="hidden md:grid grid-cols-1 lg:grid-cols-2 border-t border-border/50"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="border-b lg:border-b-0 lg:border-r border-border/50">
                  <ProConSection
                    type="pro"
                    items={solution.pros}
                    currentPage={prosCurrentPage}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setProsCurrentPage}
                    onAddClick={() => onAddPro(solution.id)}
                  />
                </div>

                <ProConSection
                  type="con"
                  items={solution.cons}
                  currentPage={consCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setConsCurrentPage}
                  onAddClick={() => onAddCon(solution.id)}
                />
              </motion.div>

              {/* Mobile Layout - Horizontal Scrollable Carousels */}
              <motion.div
                className="md:hidden space-y-6 mt-6 pt-6 border-t border-border/50"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <MobileProConCarousel
                  items={solution.pros}
                  type="pro"
                  onAddClick={() => onAddPro(solution.id)}
                />
                <MobileProConCarousel
                  items={solution.cons}
                  type="con"
                  onAddClick={() => onAddCon(solution.id)}
                />
              </motion.div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}
