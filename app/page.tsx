import { EvidenceSection } from "@/components/marketing/evidence-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { PublicBoardPreview } from "@/components/marketing/public-board-preview";
import { WorkflowStory } from "@/components/marketing/workflow-story";

export default function HomePage() {
  return (
    <main className="marketing-page">
      <Hero />
      <EvidenceSection />
      <WorkflowStory />
      <PublicBoardPreview />
      <FinalCta />
    </main>
  );
}
