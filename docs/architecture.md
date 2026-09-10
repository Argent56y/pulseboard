# Pulseboard architecture

## Request and data flow

1. A visitor reads a public board through RLS-filtered Supabase queries.
2. An authenticated user submits feedback through a validated Server Action.
3. The post is committed immediately with `embedding_state = pending`; AI failure never blocks the submission.
4. The `embed-feedback` Edge Function validates the caller and workspace membership, generates a 384-dimensional `gte-small` embedding, then performs exact cosine matching inside that workspace.
5. Up to five links above the initial `0.78` threshold are stored as `suggested`.
6. An editor confirms or rejects each suggestion. Confirmed links become solid evidence paths on the Signal Map.
7. Themes connect to roadmap items; shipped work can be explained in the changelog.

## Rendering boundaries

- Server Components load workspaces, boards and product data by default.
- Client Components are limited to filters, forms with local feedback, motion and the React Flow canvas.
- Demo routes use deterministic local data so a recruiter or client can inspect the product without creating an account.
- Non-demo routes use the same view models while reading from Supabase.

## Data model

The schema contains profiles, workspaces, membership and invitations; boards, posts, votes and comments; themes and reviewed links; roadmap items, roadmap-theme links and changelog entries. Composite foreign keys ensure a child record cannot silently point across workspace boundaries.

Indexes cover foreign keys and the main tenant/status/cursor access paths. The v1 similarity query is an exact cosine scan constrained to one workspace. An approximate index is intentionally deferred until measured data volume justifies it.

## Authorization

Next.js refreshes cookie-based sessions with `@supabase/ssr` and verifies server requests using `getClaims()`. Database helper functions avoid recursive membership policies and always set an empty `search_path`. Explicit grants control which tables are reachable through the Data API; RLS then controls rows.

The Edge Function uses custom bearer-token validation because it also needs a server-only secret for embedding writes. A public-board read alone is insufficient: the caller must be a workspace member.

## Failure states

- Missing Supabase variables leave the marketing site and demo usable while persistent actions return an honest setup message.
- Failed embeddings store a short error and expose a retry action.
- Suggested links never modify product direction without an editor review.
- Mobile and reduced-motion modes preserve all information without relying on the canvas or animation.
