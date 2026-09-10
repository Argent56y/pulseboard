# Five build-in-public posts for X

## 1 — The problem

Most feedback tools show you *what* people requested.

They rarely show the path from that message to a roadmap decision.

I’m building Pulseboard: a feedback workspace where every roadmap item keeps its evidence.

`request → theme → decision → shipped`

## 2 — The unusual feature

I turned customer feedback into an interactive evidence graph.

Small nodes are raw requests. Circles are recurring themes. Large nodes are roadmap decisions.

AI can suggest a connection, but a founder has to confirm it. No mystery priority score.

## 3 — The design system

I wanted the admin to feel like an editorial control room, not another grid of SaaS cards.

So I used:

- one quiet KPI strip
- dense working tables
- graphite surfaces
- color only for product status

The public board switches to a warm paper surface.

## 4 — The engineering

Pulseboard is a concept SaaS built with Next.js, Supabase and pgvector.

The part I cared about most: AI failure never blocks feedback.

The post is saved first, analysis has visible `pending / ready / failed` states, and every suggested theme can be confirmed or rejected.

## 5 — The launch

Shipped the live Pulseboard demo.

You can explore 36 sample requests, trace them into themes, and inspect the evidence behind four roadmap decisions — no signup required.

Built as a portfolio product for founders who need more than a pretty landing page.

Demo: [add deployed URL]
