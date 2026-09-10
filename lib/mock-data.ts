import type {
  ChangelogEntry,
  FeedbackComment,
  FeedbackPost,
  GraphData,
  RoadmapItem,
  Theme,
  ThemeLink,
  Workspace,
} from "@/lib/types";

export const demoWorkspace: Workspace = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Northstar",
  slug: "demo",
  description: "A shared command center for remote product teams.",
  isPublic: true,
  isDemo: true,
};

export const demoThemes: Theme[] = [
  {
    id: "theme-onboarding",
    workspaceId: demoWorkspace.id,
    name: "Faster onboarding",
    description: "Help new teams reach their first useful workspace sooner.",
    signalCount: 9,
    velocity: 28,
  },
  {
    id: "theme-permissions",
    workspaceId: demoWorkspace.id,
    name: "Team permissions",
    description: "Give growing teams safer, clearer access controls.",
    signalCount: 7,
    velocity: 14,
  },
  {
    id: "theme-mobile",
    workspaceId: demoWorkspace.id,
    name: "Mobile workflow",
    description: "Keep projects moving while people are away from a desk.",
    signalCount: 6,
    velocity: 41,
  },
  {
    id: "theme-exports",
    workspaceId: demoWorkspace.id,
    name: "Reports & exports",
    description: "Turn workspace activity into useful stakeholder updates.",
    signalCount: 5,
    velocity: -4,
  },
  {
    id: "theme-integrations",
    workspaceId: demoWorkspace.id,
    name: "Connected tools",
    description: "Bring feedback and decisions in from existing workflows.",
    signalCount: 5,
    velocity: 19,
  },
  {
    id: "theme-reliability",
    workspaceId: demoWorkspace.id,
    name: "Trust & reliability",
    description: "Make changes predictable, recoverable and transparent.",
    signalCount: 4,
    velocity: 7,
  },
];

const feedbackSeeds = [
  ["A guided setup for first-time teams", "The blank workspace is elegant, but our team did not know which project to create first.", "Maya Chen", "portal", "under_review", 42, "theme-onboarding"],
  ["Let me invite people during onboarding", "Setup would feel complete if I could add the team before landing in an empty workspace.", "Noah Williams", "interview", "planned", 31, "theme-onboarding"],
  ["Show a sample project after signup", "A removable example project would make the core workflow click much faster.", "Sofia Patel", "support", "under_review", 27, "theme-onboarding"],
  ["Role-based access for contractors", "We need collaborators who can comment without seeing billing or workspace settings.", "Elliot Stone", "email", "in_progress", 54, "theme-permissions"],
  ["Approval step before publishing", "Our client work needs an owner approval before a roadmap update becomes public.", "Amelia Brooks", "portal", "planned", 38, "theme-permissions"],
  ["Read-only stakeholder seats", "Executives want visibility without becoming active members of every project.", "Jon Bell", "interview", "under_review", 22, "theme-permissions"],
  ["Quick capture from mobile", "I often remember feedback between meetings and need a two-tap way to save it.", "Priya Raman", "portal", "planned", 61, "theme-mobile"],
  ["Mobile push for status changes", "A notification when a requested feature ships would help us close the loop faster.", "Marcus Lee", "support", "under_review", 34, "theme-mobile"],
  ["Offline notes on customer visits", "Our research team needs to capture a note when connectivity is unreliable.", "Nina Cole", "interview", "new", 18, "theme-mobile"],
  ["Export roadmap as a clean PDF", "I need a board-ready update without screenshots or manual formatting.", "Theo Grant", "portal", "shipped", 49, "theme-exports"],
  ["Weekly stakeholder digest", "A concise email of decisions and shipped work would replace our Friday status document.", "Ava Morgan", "email", "planned", 44, "theme-exports"],
  ["CSV export with filters applied", "Research ops needs exactly the filtered set we are looking at, not the entire database.", "Sam Rivera", "support", "shipped", 21, "theme-exports"],
  ["Capture feedback from Slack", "Most customer requests reach us in shared Slack channels and disappear by Monday.", "Lena Ortiz", "interview", "planned", 57, "theme-integrations"],
  ["Link roadmap items to Linear", "Engineering should see the customer evidence without duplicating the whole issue.", "Owen Price", "portal", "under_review", 52, "theme-integrations"],
  ["Import Intercom conversations", "Support already tags product requests; importing those tags would save weekly triage.", "Grace Kim", "email", "new", 29, "theme-integrations"],
  ["An audit trail for status changes", "We need to know who moved a request and why the date changed.", "Daniel Ross", "portal", "planned", 36, "theme-reliability"],
  ["Undo accidental merges", "A mistaken duplicate merge is hard to recover from and hides valuable context.", "Iris Walker", "support", "under_review", 25, "theme-reliability"],
  ["Visible analysis status", "If AI is still processing a request, show that clearly instead of leaving an empty theme.", "Leo Martin", "email", "new", 17, "theme-reliability"],
  ["Checklist for workspace launch", "A short launch checklist would help owners finish setup with confidence.", "Mila Scott", "portal", "new", 15, "theme-onboarding"],
  ["Explain why a theme was suggested", "A similarity score is useful only when I can inspect the supporting language.", "Henry Ford", "interview", "under_review", 47, "theme-onboarding"],
  ["Guest access that expires", "Agency clients should automatically lose access at the end of an engagement.", "Rhea Singh", "portal", "new", 26, "theme-permissions"],
  ["Different editors per board", "Our research and product boards need separate editor groups inside one workspace.", "Max Turner", "email", "under_review", 20, "theme-permissions"],
  ["Swipe through the feedback inbox", "On mobile I want to mark requests for review without opening every detail page.", "Chloe Hall", "portal", "new", 33, "theme-mobile"],
  ["Share a live filtered report", "A persistent link to the current segment would be better than sending an export.", "Alex Green", "support", "planned", 28, "theme-exports"],
  ["Notion sync for research notes", "Our interview notes live in Notion and manual copying loses source links.", "Megan Wood", "email", "new", 24, "theme-integrations"],
  ["Webhook when a feature ships", "We want to trigger our own customer email when a roadmap item changes to shipped.", "Adam Young", "portal", "under_review", 32, "theme-integrations"],
  ["Restore archived feedback", "Archived requests should remain searchable and recoverable for at least 30 days.", "Sara King", "support", "new", 14, "theme-reliability"],
  ["Invite templates for common roles", "We repeat the same access setup for every customer advisory group.", "Tariq Khan", "interview", "new", 19, "theme-permissions"],
  ["Onboarding progress that persists", "I left halfway through setup and could not tell what was still unfinished later.", "June Park", "portal", "under_review", 23, "theme-onboarding"],
  ["Add feedback from the share sheet", "An iOS share action would make capturing customer emails much faster.", "Ben Clark", "email", "new", 37, "theme-mobile"],
  ["Quarterly trend comparison", "We want to see which customer themes are accelerating quarter over quarter.", "Eva Moore", "portal", "planned", 41, "theme-exports"],
  ["Keep source links after import", "Imported feedback must retain a reliable path back to the original conversation.", "Finn Baker", "support", "under_review", 30, "theme-integrations"],
  ["Warn before deleting a theme", "Removing a theme can disconnect dozens of evidence links, so the impact should be clear.", "Lucy White", "portal", "new", 16, "theme-reliability"],
  ["Personal setup recommendations", "A two-person startup and a product org should not see the same onboarding steps.", "Ryan Cruz", "interview", "new", 35, "theme-onboarding"],
  ["Fast search on small screens", "The mobile search should keep recent filters and be reachable with one thumb.", "Zoe Adams", "portal", "new", 27, "theme-mobile"],
  ["Scheduled exports", "Let operations deliver a Monday morning CSV without opening the product.", "Cole Evans", "email", "planned", 18, "theme-exports"],
] as const;

export const demoFeedback: FeedbackPost[] = feedbackSeeds.map((seed, index) => {
  const [title, body, authorName, source, status, votes, themeId] = seed;
  const date = new Date(Date.UTC(2026, 7, 31 - index));
  return {
    id: `feedback-${String(index + 1).padStart(2, "0")}`,
    workspaceId: demoWorkspace.id,
    title,
    body,
    authorName,
    authorInitials: authorName
      .split(" ")
      .map((part) => part[0])
      .join(""),
    source,
    status,
    votes,
    comments: index % 4,
    createdAt: date.toISOString(),
    themeId,
    embeddingState: index === 34 ? "pending" : "ready",
  };
});

export const demoRoadmap: RoadmapItem[] = [
  {
    id: "roadmap-collaboration",
    workspaceId: demoWorkspace.id,
    title: "Controlled collaboration",
    summary: "Granular roles, approvals and time-limited guest access for growing teams.",
    status: "in_progress",
    targetWindow: "September 2026",
    themeIds: ["theme-permissions"],
    feedbackCount: 7,
  },
  {
    id: "roadmap-activation",
    workspaceId: demoWorkspace.id,
    title: "Guided first workspace",
    summary: "A contextual setup path that adapts to team size and working style.",
    status: "planned",
    targetWindow: "October 2026",
    themeIds: ["theme-onboarding"],
    feedbackCount: 9,
  },
  {
    id: "roadmap-mobile",
    workspaceId: demoWorkspace.id,
    title: "Mobile command center",
    summary: "Fast capture, triage and updates from a focused mobile workflow.",
    status: "planned",
    targetWindow: "Q4 2026",
    themeIds: ["theme-mobile"],
    feedbackCount: 6,
  },
  {
    id: "roadmap-reporting",
    workspaceId: demoWorkspace.id,
    title: "Shareable reporting",
    summary: "Filtered exports, stakeholder-ready PDFs and clearer trend reporting.",
    status: "shipped",
    targetWindow: "August 2026",
    themeIds: ["theme-exports"],
    feedbackCount: 5,
  },
];

export const demoLinks: ThemeLink[] = demoFeedback.map((post, index) => ({
  id: `link-${String(index + 1).padStart(2, "0")}`,
  feedbackId: post.id,
  themeId: post.themeId!,
  state: index === 19 || index === 33 ? "suggested" : "confirmed",
  similarity: index === 19 ? 0.91 : index === 33 ? 0.84 : 0.79 + ((index * 7) % 18) / 100,
}));

export const demoComments: FeedbackComment[] = [
  {
    id: "comment-1",
    feedbackId: "feedback-01",
    authorName: "Maya Chen",
    body: "The current blank state made us wonder whether the import had failed.",
    createdAt: "2026-08-31T14:20:00.000Z",
    isStaff: false,
  },
  {
    id: "comment-2",
    feedbackId: "feedback-01",
    authorName: "Nora · Northstar",
    body: "This is helpful. We are testing a guided workspace with a removable sample project.",
    createdAt: "2026-09-01T09:10:00.000Z",
    isStaff: true,
  },
];

export const demoChangelog: ChangelogEntry[] = [
  {
    id: "change-1",
    roadmapItemId: "roadmap-reporting",
    title: "Reports that are ready to share",
    body: "Export the exact view you are looking at, or generate a stakeholder-ready roadmap PDF without rebuilding it in slides.",
    publishedAt: "2026-08-27T12:00:00.000Z",
  },
  {
    id: "change-2",
    title: "A quieter, faster feedback inbox",
    body: "Keyboard navigation, saved filters and clearer source context make daily triage faster for small product teams.",
    publishedAt: "2026-08-12T12:00:00.000Z",
  },
  {
    id: "change-3",
    title: "Every roadmap item now keeps its evidence",
    body: "Open any roadmap item to see the themes and customer language that shaped the decision.",
    publishedAt: "2026-07-29T12:00:00.000Z",
  },
];

export const demoGraph: GraphData = {
  feedback: demoFeedback,
  themes: demoThemes,
  roadmap: demoRoadmap,
  links: demoLinks,
};

export function getDemoPost(id: string) {
  return demoFeedback.find((post) => post.id === id);
}
