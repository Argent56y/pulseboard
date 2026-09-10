import { notFound } from "next/navigation";
import { FeedbackDetailScreen } from "@/components/product/feedback-detail-screen";
import { demoComments, demoWorkspace, getDemoPost } from "@/lib/mock-data";

export default async function DemoPostPage({ params }: { params: Promise<{ postId: string }> }) { const { postId } = await params; const post = getDemoPost(postId); if (!post) notFound(); return <FeedbackDetailScreen workspace={demoWorkspace} post={post} comments={demoComments.filter((comment) => comment.feedbackId === postId)} />; }
