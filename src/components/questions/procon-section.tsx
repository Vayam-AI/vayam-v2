"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ProConItem } from "./procon-item";
import type { ProCon } from "./types";

interface ProConSectionProps {
  type: "pro" | "con";
  items: ProCon[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onAddClick: () => void;
}

export function ProConSection({
  type,
  items,
  currentPage,
  itemsPerPage,
  onPageChange,
  onAddClick,
}: ProConSectionProps) {
  const title = type === "pro" ? "Pros" : "Cons";
  const isPro = type === "pro";

  // Sort by total number of voters (upvotes + downvotes), highest first
  const sortedItems = [...items].sort((a, b) => {
    const aTotalVoters = (a.upvotes || 0) + (a.downvotes || 0);
    const bTotalVoters = (b.upvotes || 0) + (b.downvotes || 0);
    return bTotalVoters - aTotalVoters;
  });

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h4 className="text-lg sm:text-xl font-bold">{title}</h4>
          <p className="text-xs text-muted-foreground">
            {items.length} {title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAddClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> <span className="text-sm">Add</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {paginatedItems.length === 0 ? (
          <div className="text-sm text-muted-foreground">No {title.toLowerCase()} yet.</div>
        ) : (
          paginatedItems.map((item, idx) => (
            <ProConItem key={item.id} item={item} type={type} index={startIndex + idx} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 p-3 rounded-lg border bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className={isPro ? "text-green-600" : "text-red-600"} />
          </Button>

          <div className="text-center">
            <div className="text-sm font-medium">Page {currentPage} of {totalPages}</div>
            <div className="text-xs text-muted-foreground">Showing {paginatedItems.length} of {items.length}</div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className={isPro ? "text-green-600" : "text-red-600"} />
          </Button>
        </div>
      )}
    </div>
  );
}