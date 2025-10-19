"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoaderOne } from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function Home() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex-1 bg-background flex items-center justify-center">
          <LoaderOne />
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect to dashboard
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            Welcome to Vayam
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            A civic social platform where users can help drive change through meaningful discussions and expert insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
