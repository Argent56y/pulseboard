import { InboxClient } from "@/components/product/admin/inbox-client";
import { demoLinks } from "@/lib/mock-data";
import { demoFeedbackRu, demoThemesRu } from "@/lib/mock-data-ru";

export default function RussianDemoInboxPage() {
  return <InboxClient posts={demoFeedbackRu} themes={demoThemesRu} themeLinks={demoLinks} readOnly locale="ru" />;
}
