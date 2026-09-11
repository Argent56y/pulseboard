export type FeedbackSource = "portal" | "email" | "interview" | "support" | "manual" | "csv";

export type FeedbackStatus =
  | "new"
  | "under_review"
  | "planned"
  | "in_progress"
  | "shipped"
  | "closed";

export type RoadmapStatus = "planned" | "in_progress" | "shipped";
export type LinkState = "suggested" | "confirmed" | "rejected";
export type EmbeddingState = "pending" | "ready" | "failed";
export type FeedbackVisibility = "published" | "hidden" | "merged";
export type WorkspaceRole = "owner" | "editor";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  isPublic: boolean;
  isDemo: boolean;
}

export interface FeedbackPost {
  id: string;
  workspaceId: string;
  title: string;
  body: string;
  authorName: string;
  authorInitials: string;
  source: FeedbackSource;
  status: FeedbackStatus;
  votes: number;
  comments: number;
  createdAt: string;
  themeId?: string;
  embeddingState: EmbeddingState;
  visibility?: FeedbackVisibility;
  duplicateOfId?: string;
  canonicalTitle?: string;
  votedByViewer?: boolean;
}

export interface FeedbackPageData {
  posts: FeedbackPost[];
  nextCursor?: string;
}

export interface DuplicateCandidate {
  id: string;
  title: string;
  body: string;
  status: FeedbackStatus;
  votes: number;
  rank: number;
}

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  authorName: string;
  body: string;
  createdAt: string;
  isStaff: boolean;
}

export interface Theme {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  signalCount: number;
  velocity: number;
}

export interface ThemeLink {
  id: string;
  feedbackId: string;
  themeId: string;
  state: LinkState;
  similarity: number;
}

export interface RoadmapItem {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  status: RoadmapStatus;
  targetWindow: string;
  themeIds: string[];
  feedbackCount: number;
}

export interface ChangelogEntry {
  id: string;
  roadmapItemId?: string;
  title: string;
  body: string;
  publishedAt?: string;
}

export interface GraphData {
  feedback: FeedbackPost[];
  themes: Theme[];
  roadmap: RoadmapItem[];
  links: ThemeLink[];
}

export interface ViewerProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  email: string;
}

export interface WorkspaceMembership {
  workspace: Workspace;
  role: WorkspaceRole;
}

export interface CommandItem {
  id: string;
  kind: "feedback" | "theme" | "roadmap";
  label: string;
  detail: string;
  href: string;
}

export interface DuplicateLink {
  id: string;
  feedbackId: string;
  duplicateId: string;
  state: LinkState;
  similarity: number;
}

export interface WorkspaceMember {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceInvitation {
  id: string;
  role: WorkspaceRole;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  acceptedAt?: string;
  revokedAt?: string;
}

export interface FeedbackImport {
  id: string;
  filename: string;
  state: "pending" | "processing" | "completed" | "completed_with_errors" | "failed";
  totalRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: string;
}
