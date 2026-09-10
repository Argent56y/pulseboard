import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { demoFeedback, demoWorkspace } from "@/lib/mock-data";

export default function DemoBoardPage() { return <PublicBoardScreen workspace={demoWorkspace} posts={demoFeedback} boardId="22222222-2222-4222-8222-222222222222" />; }
