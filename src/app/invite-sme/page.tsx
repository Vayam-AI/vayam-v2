"use client"

import { LandingNavbar } from "@/components/landing-navbar"
import { motion, useScroll, useTransform } from "framer-motion"
import { useState, useRef } from "react"
import { toast } from "sonner"

export default function InviteSme() {
  const [areas, setAreas] = useState<string[]>([])
  const [formData, setFormData] = useState({
    email: "",
    role: "",
    background: "",
  })

  const tags = [
    "Technology & AI", "Science & Research", "Mathematics & Statistics",
    "Data & Analytics", "Business & Strategy", "Economics & Finance",
    "Education & Learning", "Health & Medicine", "Psychology & Human Behavior",
    "Social Impact & Policy", "Environment & Sustainability", "Arts & Culture",
    "History & Society", "Law & Governance", "Philosophy & Ethics",
    "Engineering & Innovation", "Literature & Writing", "Media & Entertainment",
    "Entrepreneurship & Startups", "Personal Development & Productivity",
  ]

  const sectionRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })

  const introOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const introY = useTransform(scrollYProgress, [0, 0.25], [0, -50])
  const formOpacity = useTransform(scrollYProgress, [0.15, 0.4], [0, 1])
  const formY = useTransform(scrollYProgress, [0.15, 0.4], [50, 0])

  const handleTagClick = (tag: string) => {
    setAreas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/sme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          background: formData.background,
          areas,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Your submission has been saved successfully!")
        setFormData({ email: "", role: "", background: "" })
        setAreas([])
      } else {
        toast.error(data.error || "Something went wrong")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to submit form.")
    }
  }

  return (
    <div ref={sectionRef} className="bg-[#0a0a0a] text-white overflow-hidden">

      <LandingNavbar />
      
      {/* Hero Section */}
      <motion.div
        style={{ opacity: introOpacity, y: introY }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight text-center"
        >
          <span className="bg-gradient-to-r from-[#ff4f0f] to-[#ff6b3d] bg-clip-text text-transparent block">
            Become an SME
          </span>
        </motion.h1>

        {/* Text box wrapper */}
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10 shadow-xl space-y-8 mt-10">
          <div className="space-y-6 max-w-2xl mx-auto text-center">
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Subject Matter Experts are the backbone of Vayam. You are the ones
              who lay the foundation for thoughtful solutions, guiding reasoning,
              and shaping the conversations that drive clarity and insight.
            </p>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              As an SME, your knowledge doesn&apos;t just inform solutions — it
              inspires others to think deeper, question assumptions, and
              collaborate with purpose.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Form Section */}
      <motion.div
        style={{ opacity: formOpacity, y: formY }}
        className="relative min-h-screen flex items-center justify-center px-4 pb-20"
      >
        {/* Form box wrapper */}
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="We'll use this to keep you updated and coordinate contributions."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4f0f] transition-all"
              />
            </div>

            {/* Role & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Current Role / Job Title
                </label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Your expertise matters — tell us what you do."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4f0f] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Education / Background
                </label>
                <input
                  type="text"
                  name="background"
                  value={formData.background}
                  onChange={handleChange}
                  placeholder="Your academic or professional background helps us understand your perspective."
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff4f0f] transition-all"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Areas you&apos;d like to contribute as an SME
              </label>
              <textarea
                value={areas.join(", ")}
                readOnly
                placeholder="Click on tags below..."
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-gray-300 h-24 focus:outline-none focus:ring-2 focus:ring-[#ff4f0f] transition-all resize-none"
              />
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag) => {
                  const active = areas.includes(tag)
                  return (
                    <motion.button
                      key={tag}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-2 rounded-full text-sm transition-all duration-200 ${active
                          ? "bg-[#ff4f0f] text-white shadow-lg shadow-[#ff4f0f]/25"
                          : "bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:border-gray-600 hover:bg-[#252525]"
                        }`}
                    >
                      {active ? `✕ ${tag}` : tag}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff4f0f] to-[#ff6b3d] text-white font-semibold py-3 rounded-lg shadow-lg shadow-[#ff4f0f]/25 hover:shadow-xl transition-all duration-300"
            >
              Submit Form
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
