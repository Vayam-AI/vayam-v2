import { FontPreview } from "@/components/font-preview"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FontPreviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Font Preview</h1>
        </div>
      </div>
      
      <FontPreview />
    </div>
  )
}
