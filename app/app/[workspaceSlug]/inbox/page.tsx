import { InboxClient } from "@/components/product/admin/inbox-client";
import { getFeedback } from "@/lib/data";
export default async function InboxPage({ params }: { params: Promise<{ workspaceSlug: string }> }) { const { workspaceSlug } = await params; return <InboxClient posts={await getFeedback(workspaceSlug)} />; }
