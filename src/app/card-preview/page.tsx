import CardHoverPreview from "@/components/card-hover-preview";

export default function CardPreviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 left-4 z-50"></div>
      <CardHoverPreview />
    </div>
  );
}
