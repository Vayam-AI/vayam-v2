"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fontCombinations = [
  {
    name: "Option 1: Momo Trust Sans + Montserrat",
    headingFont: "font-momo-trust-sans",
    bodyFont: "font-montserrat",
    headingName: "Momo Trust Sans",
    bodyName: "Montserrat",
    bodyFontFamily: "Montserrat, sans-serif",
  },
  {
    name: "Option 2: Roboto Slab + Nunito Sans",
    headingFont: "font-roboto-slab",
    bodyFont: "font-nunito-sans",
    headingName: "Roboto Slab",
    bodyName: "Nunito Sans",
    bodyFontFamily: "Nunito Sans, sans-serif",
  },
  {
    name: "Option 3: Noto Serif + PT Serif",
    headingFont: "font-noto-serif",
    bodyFont: "font-pt-serif",
    headingName: "Noto Serif",
    bodyName: "PT Serif",
    bodyFontFamily: "PT Serif, serif",
  },
];

export function FontPreview() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Card Grid View */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {fontCombinations.map((combo, index) => (
          <Card
            key={combo.name}
            className="hover:shadow-lg transition-shadow hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-center text-primary">
                Option {index + 1}
              </CardTitle>
              <div className="text-xs text-center text-muted-foreground space-y-1 pt-2">
                <div>
                  Heading:{" "}
                  <span className="font-semibold">{combo.headingName}</span>
                </div>
                <div>
                  Body: <span className="font-semibold">{combo.bodyName}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <h2 className={`text-2xl font-bold ${combo.headingFont}`}>
                Welcome to The VayBoard
              </h2>
              <p
                className={`text-base text-muted-foreground ${combo.bodyFont}`}
                style={{ fontFamily: combo.bodyFontFamily }}
              >
                Explore, Debate, and Shape impactful solutions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
