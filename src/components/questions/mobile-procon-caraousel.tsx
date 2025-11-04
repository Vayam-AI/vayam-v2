import { useState } from "react";
import { ProCon } from "./types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../ui/button";

// Mobile Carousel Component for Pros/Cons
export function MobileProConCarousel({ 
  items, 
  type,
  onAddClick 
}: { 
  items: ProCon[];
  type: "pro" | "con";
  onAddClick: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isPro = type === "pro";
  const title = isPro ? "Pros" : "Cons";

  const sortedItems = [...items].sort((a, b) => {
    const aVotes = typeof a.voteCount === "number" ? a.voteCount : (a.upvotes || 0) - (a.downvotes || 0);
    const bVotes = typeof b.voteCount === "number" ? b.voteCount : (b.upvotes || 0) - (b.downvotes || 0);
    return bVotes - aVotes;
  });

  const nextSlide = () => {
    if (sortedItems.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sortedItems.length);
  };

  const prevSlide = () => {
    if (sortedItems.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sortedItems.length) % sortedItems.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className={`rounded-lg border p-4 ${isPro ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold text-sm ${isPro ? 'text-green-600' : 'text-red-600'}`}>
          {title} ({sortedItems.length})
        </h4>
        
        {sortedItems.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={prevSlide}
              className="p-1 rounded-full hover:bg-white/50 transition-colors"
              disabled={sortedItems.length === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex gap-1 mx-2">
              {sortedItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex 
                      ? isPro ? 'bg-green-500' : 'bg-red-500'
                      : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={nextSlide}
              className="p-1 rounded-full hover:bg-white/50 transition-colors"
              disabled={sortedItems.length === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="min-h-[100px]">
        {sortedItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <p>No {title.toLowerCase()} added yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddClick}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add {title.slice(0, -1)}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-foreground text-sm mb-2">
                {sortedItems[currentIndex]?.content}
              </p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Votes: {sortedItems[currentIndex]?.voteCount || 0}</span>
                {sortedItems[currentIndex]?.userVote !== null && (
                  <span>Your vote: {sortedItems[currentIndex]?.userVote > 0 ? '↑' : '↓'}</span>
                )}
              </div>
            </div>

            {sortedItems.length > 1 && (
              <div className="text-center text-xs text-muted-foreground">
                {currentIndex + 1} of {sortedItems.length}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onAddClick}
              className="w-full mt-2"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add {title.slice(0, -1)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}