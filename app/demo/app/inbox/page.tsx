import { InboxClient } from "@/components/product/admin/inbox-client";
import { demoFeedback } from "@/lib/mock-data";

export default function DemoInboxPage() {
  return <InboxClient posts={demoFeedback} readOnly />;
}
