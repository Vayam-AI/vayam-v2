"use client";

import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

const criteria: PasswordCriteria[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "Contains uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "Contains lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "Contains number",
    test: (password) => /\d/.test(password),
  },
  {
    label: "Contains special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const passedCriteria = criteria.filter((criterion) => criterion.test(password));
  const strength = (passedCriteria.length / criteria.length) * 100;

  const getStrengthLabel = () => {
    if (strength < 40) return "Weak";
    if (strength < 70) return "Medium";
    return "Strong";
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Password strength</span>
          <span className="text-sm font-medium">{getStrengthLabel()}</span>
        </div>
        <Progress 
          value={strength} 
          className="h-2"
        />
      </div>
      
      <div className="space-y-1">
        {criteria.map((criterion, index) => {
          const passed = criterion.test(password);
          return (
            <div
              key={index}
              className={`flex items-center space-x-2 text-xs ${
                passed ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{criterion.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}