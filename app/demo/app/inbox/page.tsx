import { InboxClient } from "@/components/product/admin/inbox-client";
import { demoFeedback, demoLinks, demoThemes } from "@/lib/mock-data";

export default function DemoInboxPage() {
  return <InboxClient posts={demoFeedback} themes={demoThemes} themeLinks={demoLinks} readOnly />;
}
