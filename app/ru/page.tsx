import { EvidenceSection } from "@/components/marketing/evidence-section";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { PublicBoardPreview } from "@/components/marketing/public-board-preview";
import { WorkflowStory } from "@/components/marketing/workflow-story";

export default function RussianHomePage() {
  return <main className="marketing-page locale-ru" lang="ru">
    <Hero locale="ru" />
    <EvidenceSection locale="ru" />
    <WorkflowStory locale="ru" />
    <PublicBoardPreview locale="ru" />
    <FinalCta locale="ru" />
  </main>;
}
