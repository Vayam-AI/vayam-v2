"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Star, Home } from "lucide-react";

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 10000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="relative">
                <Heart className="h-16 w-16 text-destructive fill-current" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="absolute -top-2 -right-2"
                >
                  <Star className="h-6 w-6 text-primary fill-current" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-3"
            >
              <h1 className="text-2xl font-bold text-foreground">
                Thank You for Participating!
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Your valuable insights and contributions help build a better community. 
                Every voice matters in shaping meaningful solutions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-muted/30 rounded-lg p-4 space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                🌟 Your participation makes a difference
              </p>
              <p className="text-sm text-muted-foreground">
                💡 Together we create impactful solutions
              </p>
              <p className="text-sm text-muted-foreground">
                🤝 Building stronger communities through dialogue
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Automatically redirecting in 10 seconds...
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}