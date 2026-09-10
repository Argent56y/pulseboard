export type FeedbackSource = "portal" | "email" | "interview" | "support";

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
  publishedAt: string;
}

export interface GraphData {
  feedback: FeedbackPost[];
  themes: Theme[];
  roadmap: RoadmapItem[];
  links: ThemeLink[];
}
