import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedbackDetailScreen } from "@/components/product/feedback-detail-screen";
import { demoCommentsRu, demoWorkspaceRu, getDemoPostRu } from "@/lib/mock-data-ru";

export async function generateMetadata({ params }: { params: Promise<{ postId: string }> }): Promise<Metadata> {
  const { postId } = await params;
  const post = getDemoPostRu(postId);
  if (!post) return {};
  return {
    title: `${post.title} — Pulseboard Demo`,
    description: post.body,
    alternates: {
      canonical: `/ru/demo/post/${postId}`,
      languages: { "en-US": `/demo/post/${postId}`, "ru-RU": `/ru/demo/post/${postId}` },
    },
  };
}

export default async function RussianDemoPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const post = getDemoPostRu(postId);
  if (!post) notFound();
  return <FeedbackDetailScreen workspace={demoWorkspaceRu} post={post} comments={demoCommentsRu.filter((comment) => comment.feedbackId === postId)} locale="ru" />;
}
