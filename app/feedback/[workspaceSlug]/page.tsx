import { notFound } from "next/navigation";
import { PublicBoardScreen } from "@/components/product/public-board-screen";
import { getBoardId, getFeedback, getWorkspace } from "@/lib/data";

export default async function FeedbackPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; const [workspace, posts, boardId] = await Promise.all([getWorkspace(workspaceSlug), getFeedback(workspaceSlug), getBoardId(workspaceSlug)]); if (!workspace || !workspace.isPublic || !boardId) notFound(); return <PublicBoardScreen workspace={workspace} posts={posts} boardId={boardId} />; }
