"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

export default function ThankYouPage() {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(10)

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 10000)

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [router])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-2xl">
        {/* Icon */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-black rounded-full opacity-5 blur-xl" />
              <CheckCircle2 className="h-24 w-24 text-black stroke-[1.5]" />
            </div>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="text-center space-y-6 mb-12">
          <h1 className="text-5xl font-bold tracking-tight">Thank You</h1>
          <div className="h-1 w-16 bg-black mx-auto" />
          <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto font-light">
            Your participation and valuable insights have been recorded. We truly appreciate your time and contribution
            to making this community stronger.
          </p>
        </motion.div>

        {/* Impact Section */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { number: "01", label: "Voice Heard" },
            { number: "02", label: "Impact Made" },
            { number: "03", label: "Community Built" },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -4 }}
              className="border border-black/10 rounded-lg p-6 text-center hover:border-black/30 transition-colors"
            >
              <div className="text-3xl font-bold text-black/40 mb-2">{item.number}</div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Message Box */}
        <motion.div
          variants={itemVariants}
          className="bg-black/2 border border-black/10 rounded-lg p-8 mb-12 backdrop-blur-sm"
        >
          <p className="text-center text-sm text-gray-700 leading-relaxed">
            Every response matters. Your feedback helps us understand what works, what doesn&apos;t, and how we can continue
            to improve. Thank you for being part of this journey.
          </p>
        </motion.div>

        {/* CTA Section */}
        <motion.div variants={itemVariants} className="space-y-4">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-black text-white hover:bg-black/90 h-12 text-base font-medium rounded-lg transition-all"
          >
            Return to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="text-center text-xs text-gray-500 font-medium"
          >
            Redirecting in {timeLeft}s
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  )
}
