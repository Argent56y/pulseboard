import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
});

export const feedbackSchema = z.object({
  workspaceId: z.string().uuid(),
  boardId: z.string().uuid(),
  title: z.string().trim().min(6).max(120),
  body: z.string().trim().min(12).max(2000),
});

export const commentSchema = z.object({
  feedbackId: z.string().uuid(),
  body: z.string().trim().min(2).max(1000),
});

export const statusSchema = z.object({
  feedbackId: z.string().uuid(),
  status: z.enum([
    "new",
    "under_review",
    "planned",
    "in_progress",
    "shipped",
    "closed",
  ]),
});

export const suggestionReviewSchema = z.object({
  linkId: z.string().uuid(),
  state: z.enum(["confirmed", "rejected"]),
});

export const themeSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().min(10).max(400),
});

export const roadmapItemSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().trim().min(4).max(100),
  summary: z.string().trim().min(10).max(500),
  targetWindow: z.string().trim().min(2).max(40),
});

export const workspaceSettingsSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500),
  isPublic: z.boolean(),
});

export const roadmapStatusSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["planned", "in_progress", "shipped"]),
  confirmed: z.boolean().default(false),
});

export const changelogSchema = z.object({
  id: z.string().uuid().optional(),
  workspaceId: z.string().uuid(),
  roadmapItemId: z.string().uuid().optional(),
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().min(12).max(4000),
  publish: z.boolean(),
});

export const importRowSchema = z.object({
  title: z.string().trim().min(6).max(120),
  body: z.string().trim().min(12).max(2000),
  authorName: z.string().trim().max(80).optional(),
  source: z.enum(["portal", "email", "interview", "support", "manual", "csv"]).default("csv"),
  status: z.enum(["new", "under_review", "planned", "in_progress", "shipped", "closed"]).default("new"),
  createdAt: z.string().datetime({ offset: true }).optional(),
  externalId: z.string().trim().max(200).optional(),
  rowIndex: z.number().int().min(1).max(1000),
});
