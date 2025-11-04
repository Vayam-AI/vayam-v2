"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useState } from "react";

const sampleQuestion = {
  id: 1,
  title: "How can we improve public transportation in urban areas?",
  description:
    "Exploring sustainable and efficient solutions for modern city transit systems that reduce congestion and environmental impact.",
  tags: ["Transportation", "Urban Planning", "Sustainability"],
  participantCount: 24,
};

export default function CardHoverPreview() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Card Hover State Preview
          </h1>
          <p className="text-muted-foreground">
            Explore different hover effects - hover over each card to see the interaction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. Orange Solid Background */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 border-border/50 hover:border-orange-400 bg-card hover:bg-orange-500"
              onMouseEnter={() => setHoveredCard("orange")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-white transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-white/90 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                    <span className="text-muted-foreground group-hover:text-white transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-white group-hover:text-orange-600 group-hover:font-bold transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 2. Orange Gradient */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 border-border/50 hover:border-orange-400 bg-card hover:bg-linear-to-br hover:from-orange-500 hover:to-orange-600 hover:-translate-y-1"
              onMouseEnter={() => setHoveredCard("orange-elevated")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-white transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-white/95 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                    <span className="text-muted-foreground group-hover:text-white transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-white group-hover:text-orange-600 group-hover:font-bold group-hover:shadow-sm transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 3. Orange Border Accent */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-2 border-border hover:border-orange-500 hover:border-[3px] bg-card"
              onMouseEnter={() => setHoveredCard("orange-border")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-600 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-orange-600/80 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                    <span className="text-muted-foreground group-hover:text-orange-600 transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-orange-500 group-hover:text-white group-hover:font-semibold transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 4. Orange Glow Effect */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 border-border/50 bg-card hover:ring-4 hover:ring-orange-500/30 hover:shadow-xl hover:shadow-orange-500/20"
              onMouseEnter={() => setHoveredCard("orange-glow")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-600 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-orange-100 group-hover:text-orange-700 group-hover:font-semibold transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 5. Subtle Orange Tint */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-border/50 hover:border-orange-300 bg-card hover:bg-orange-50"
              onMouseEnter={() => setHoveredCard("orange-tint")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-700 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-orange-600/70 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                    <span className="text-muted-foreground group-hover:text-orange-700 transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-orange-200 group-hover:text-orange-800 group-hover:font-semibold transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 6. Orange with Scale */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/25 border-border/50 hover:border-orange-400 bg-card hover:bg-orange-500 hover:scale-105"
              onMouseEnter={() => setHoveredCard("orange-scale")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-white transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-white/90 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                    <span className="text-muted-foreground group-hover:text-white transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-white group-hover:text-orange-600 group-hover:font-bold transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 7. Left Orange Accent Bar */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-lg border-border/50 hover:border-l-4 hover:border-l-orange-500 bg-card"
              onMouseEnter={() => setHoveredCard("orange-left")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-600 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
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

          {/* 8. Orange Neon Effect */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 border-orange-500/30 hover:border-orange-500 bg-card hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
              onMouseEnter={() => setHoveredCard("orange-neon")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-500 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 group-hover:text-orange-600/70 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-500 transition-colors" />
                    <span className="text-muted-foreground group-hover:text-orange-600 transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:bg-orange-500/20 group-hover:text-orange-600 group-hover:border group-hover:border-orange-500 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 9. Minimal Orange Underline */}
          <div className="space-y-4">
            <Card
              className="group h-full cursor-pointer transition-all duration-300 hover:shadow-md border-border/50 bg-card relative overflow-hidden before:absolute before:bottom-0 before:left-0 before:w-0 before:h-1 before:bg-orange-500 before:transition-all before:duration-300 hover:before:w-full"
              onMouseEnter={() => setHoveredCard("orange-underline")}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-orange-600 transition-colors flex-1">
                    {sampleQuestion.title}
                  </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 transition-colors">
                  {sampleQuestion.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary group-hover:text-orange-600 transition-colors" />
                    <span className="text-muted-foreground transition-colors">
                      {sampleQuestion.participantCount} participants
                    </span>
                  </div>
                </div>

                {sampleQuestion.tags && sampleQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sampleQuestion.tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-xs px-2 py-0.5 bg-muted/60 text-muted-foreground border-0 font-normal group-hover:text-orange-600 transition-all"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hover State Indicator */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Currently hovering:{" "}
              <span className="font-semibold text-orange-600">
                {hoveredCard || "None"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
