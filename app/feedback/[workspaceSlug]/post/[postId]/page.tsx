import { notFound } from "next/navigation";
import { FeedbackDetailScreen } from "@/components/product/feedback-detail-screen";
import { getComments, getFeedbackPost, getWorkspace } from "@/lib/data";

export default async function FeedbackPostPage({ params }: { params: Promise<{ workspaceSlug: string; postId: string }> }) { const { workspaceSlug, postId } = await params; const [workspace, post, comments] = await Promise.all([getWorkspace(workspaceSlug), getFeedbackPost(workspaceSlug, postId), getComments(workspaceSlug, postId)]); if (!workspace || !post) notFound(); return <FeedbackDetailScreen workspace={workspace} post={post} comments={comments} />; }
