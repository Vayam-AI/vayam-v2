"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  Edit,
  Trash2,
  Share2,
  ShieldCheck,
  FileText,
} from "lucide-react";

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

interface QuestionCardProps {
  question: Question;
  onClick: () => void;
  selected: boolean;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  onShare: (question: Question) => void;
  onManageAccess?: (question: Question) => void;
  onEmailTemplate?: (question: Question) => void;
}

export function QuestionCard({
  question,
  onClick,
  selected,
  onEdit,
  onDelete,
  onShare,
  onManageAccess,
  onEmailTemplate,
}: QuestionCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(question);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(question);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(question);
  };

  const handleManageAccess = (e: React.MouseEvent) => {
    e.stopPropagation();
    onManageAccess?.(question);
  };

  const handleEmailTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmailTemplate?.(question);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={`w-full cursor-pointer ${selected ? "ring-2 ring-primary/50" : ""
        }`}
      onClick={onClick}
    >
      <Card
        className={`relative overflow-hidden group transition-all duration-300 border-border/50 hover:border-primary/30 hover:shadow-md ${!question.isActive ? "opacity-75 border-dashed" : ""
          }`}
      >
        <CardHeader className="flex flex-row items-start gap-3 pb-2">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <CardTitle className="text-base font-semibold line-clamp-2 text-foreground">
                {question.title}
                {!question.isActive && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs text-muted-foreground"
                  >
                    Inactive
                  </Badge>
                )}
              </CardTitle>
              {/* Action buttons moved to top-right, always visible */}
              <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleShare}
                    className="h-6 w-6 p-0 hover:bg-green-500/10"
                    title="Share Question"
                  >
                    <Share2 className="h-3 w-3 text-green-600" />
                  </Button>
                {onManageAccess && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleManageAccess}
                    className="h-6 w-6 p-0 hover:bg-purple-500/10"
                    title="Manage Access"
                  >
                    <ShieldCheck className="h-3 w-3 text-purple-600" />
                  </Button>
                )}
                {onEmailTemplate && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEmailTemplate}
                    className="h-6 w-6 p-0 hover:bg-amber-500/10"
                    title="Email Template"
                  >
                    <FileText className="h-3 w-3 text-amber-600" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  className="h-6 w-6 p-0 hover:bg-blue-500/10"
                  title="Edit Question"
                >
                  <Edit className="h-3 w-3 text-blue-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 hover:bg-red-500/10"
                  title="Delete Question"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {question.description}
            </p>
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {question.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs bg-muted/50 border-border/50"
                  >
                    {tag}
                  </Badge>
                ))}
                {question.tags.length > 3 && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-muted/50 border-border/50"
                  >
                    +{question.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{question.participantCount} participants</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}