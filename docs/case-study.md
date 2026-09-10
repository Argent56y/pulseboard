# Pulseboard — portfolio case study

## Problem

Small product teams collect useful customer requests in support chats, interviews, email and public boards. The hard part is not storage; it is explaining why one request influenced the roadmap while another did not.

## Product decision

I designed Pulseboard around one differentiating surface: the **Signal Map**. It exposes the evidence chain between individual messages, recurring themes and roadmap items. AI only proposes semantic links; the founder owns the final interpretation.

## Design decision

The founder workspace behaves like a quiet control room: dense enough for daily triage, but without a grid of decorative dashboard cards. A graphite palette separates working state from status colors. The public board moves to a warm paper background so customers get a simpler, friendlier surface.

## Engineering decision

The project uses a multi-tenant Postgres model with composite workspace foreign keys, RLS on every public table and explicit Data API grants. Next.js Server Components own data loading; focused Client Components own filters, optimistic voting, motion and graph interaction. Supabase’s local `gte-small` model avoids a paid AI API in v1.

## Result

The read-only demo shows 36 customer messages, six themes and four roadmap decisions without requiring registration. The same interface supports persistent workspaces once Supabase is connected. Desktop users inspect the interactive graph; mobile and keyboard users get equivalent linear evidence paths.

## What this demonstrates

- Product positioning and founder-focused copy
- Responsive, accessible UI and restrained motion
- Full-stack Next.js and Supabase architecture
- Multi-tenant authorization and RLS design
- Explainable AI integration with graceful failure
- Testing across unit, browser and database layers

> Concept product. All displayed customer data and metrics are fictional sample data.
