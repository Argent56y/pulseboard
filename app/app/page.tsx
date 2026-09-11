import { redirect } from "next/navigation";
import { getViewerWorkspaces, requireViewer } from "@/lib/auth";

export default async function AppIndexPage() {
  await requireViewer("/app");
  const memberships = await getViewerWorkspaces();
  if (!memberships.length) redirect("/onboarding");
  redirect(`/app/${memberships[0].workspace.slug}/inbox`);
}
