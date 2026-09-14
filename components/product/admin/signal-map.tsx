"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Background,
  BaseEdge,
  Controls,
  getBezierPath,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Check, RotateCcw, Sparkles, X } from "lucide-react";
import { reviewSuggestion } from "@/app/actions";
import type { FeedbackPost, FeedbackSource, FeedbackStatus, GraphData, RoadmapItem, Theme } from "@/lib/types";
import { feedbackStatusLabel, sourceLabel } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

type SignalNodeKind = "feedback" | "theme" | "roadmap";
type SignalNodeData = {
  kind: SignalNodeKind;
  title: string;
  meta: string;
  accent?: string;
  selected: boolean;
  rings?: number;
  caption?: string;
};
type SignalNode = Node<SignalNodeData>;

function FeedbackNode({ data }: NodeProps<SignalNode>) {
  return <div className={`signal-node signal-node-feedback ${data.selected ? "signal-node-selected" : ""}`}>
    <Handle className="node-handle" type="target" position={Position.Left} />
    <strong>{data.title}</strong><span>{data.meta}</span>
    <Handle className="node-handle" type="source" position={Position.Right} />
  </div>;
}

function ThemeNode({ data }: NodeProps<SignalNode>) {
  return <div className={`signal-node signal-node-theme ${data.selected ? "signal-node-selected" : ""}`}>
    <span className="evidence-rings" aria-hidden="true">{Array.from({ length: data.rings ?? 1 }, (_, index) => <i key={index} />)}</span>
    <Handle className="node-handle" type="target" position={Position.Left} />
    <strong>{data.title}</strong><span>{data.meta}</span><em>{data.caption ?? "signal cluster"}</em>
    <Handle className="node-handle" type="source" position={Position.Right} />
  </div>;
}

function RoadmapNode({ data }: NodeProps<SignalNode>) {
  return <div className={`signal-node signal-node-roadmap ${data.selected ? "signal-node-selected" : ""}`} style={{ borderLeftColor: data.accent }}>
    <Handle className="node-handle" type="target" position={Position.Left} />
    <strong>{data.title}</strong><span>{data.meta}</span>
  </div>;
}

const nodeTypes = { feedback: FeedbackNode, theme: ThemeNode, roadmap: RoadmapNode };
const roadmapColors = { planned: "#d2aa70", in_progress: "#afc1c7", shipped: "#87b99a" };

type EvidenceEdgeData = { state: "suggested" | "confirmed"; active: boolean };
function EvidenceEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data }: EdgeProps<Edge<EvidenceEdgeData>>) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} className={`evidence-edge evidence-edge-${data?.state ?? "confirmed"} ${data?.active ? "evidence-edge-active" : ""}`} />
    {data?.state === "suggested" && <circle className="edge-traveler" r="3" aria-hidden="true"><animateMotion dur="2.8s" repeatCount="indefinite" path={path} /></circle>}
  </>;
}
const edgeTypes = { evidence: EvidenceEdge };

interface SignalMapProps {
  graph: GraphData;
  readOnly?: boolean;
  initialSelected?: string;
  locale?: Locale;
}

export function SignalMap({ graph, readOnly = false, initialSelected, locale = "en" }: SignalMapProps) {
  const [selectedId, setSelectedId] = useState(initialSelected ?? graph.roadmap[0]?.id ?? graph.themes[0]?.id ?? graph.feedback[0]?.id ?? "");
  const [source, setSource] = useState<FeedbackSource | "all">("all");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [notice, setNotice] = useState("");
  const [links, setLinks] = useState(graph.links);
  const [isPending, startTransition] = useTransition();

  const filteredFeedback = useMemo(() => graph.feedback.filter((post) =>
    (source === "all" || post.source === source) && (status === "all" || post.status === status),
  ), [graph.feedback, source, status]);

  const visibleFeedback = useMemo(() => {
    const visible = new Map<string, FeedbackPost>();
    graph.themes.forEach((theme) => {
      filteredFeedback
        .filter((post) => links.some((link) => link.feedbackId === post.id && link.themeId === theme.id))
        .slice(0, 2)
        .forEach((post) => visible.set(post.id, post));
    });
    filteredFeedback
      .filter((post) => !links.some((link) => link.feedbackId === post.id))
      .slice(0, 4)
      .forEach((post) => visible.set(post.id, post));
    return [...visible.values()];
  }, [filteredFeedback, links, graph.themes]);

  const unlinkedFeedback = useMemo(
    () => filteredFeedback.filter((post) => !links.some((link) => link.feedbackId === post.id)),
    [filteredFeedback, links],
  );

  const linkedIds = useMemo(() => {
    const ids = new Set<string>([selectedId]);
    const selectedRoadmap = graph.roadmap.find((item) => item.id === selectedId);
    const selectedTheme = graph.themes.find((theme) => theme.id === selectedId);
    const selectedFeedback = graph.feedback.find((post) => post.id === selectedId);
    if (selectedRoadmap) {
      selectedRoadmap.themeIds.forEach((id) => ids.add(id));
      links.filter((link) => selectedRoadmap.themeIds.includes(link.themeId)).forEach((link) => ids.add(link.feedbackId));
    }
    if (selectedTheme) {
      links.filter((link) => link.themeId === selectedTheme.id).forEach((link) => ids.add(link.feedbackId));
      graph.roadmap.filter((item) => item.themeIds.includes(selectedTheme.id)).forEach((item) => ids.add(item.id));
    }
    if (selectedFeedback) {
      links.filter((link) => link.feedbackId === selectedFeedback.id).forEach((link) => {
        ids.add(link.themeId);
        graph.roadmap.filter((item) => item.themeIds.includes(link.themeId)).forEach((item) => ids.add(item.id));
      });
    }
    return ids;
  }, [graph, links, selectedId]);

  const { nodes, edges } = useMemo(() => {
    const nextNodes: SignalNode[] = [];
    const nextEdges: Edge[] = [];
    graph.themes.forEach((theme, themeIndex) => {
      const baseY = 34 + themeIndex * 120;
      nextNodes.push({ id: theme.id, type: "theme", position: { x: 350, y: baseY }, data: { kind: "theme", title: theme.name, meta: `${theme.signalCount} ${locale === "ru" ? "сигналов" : "signals"} · ${theme.velocity >= 0 ? "+" : ""}${theme.velocity}%`, caption: locale === "ru" ? "кластер сигналов" : "signal cluster", selected: theme.id === selectedId, rings: Math.max(1, Math.min(4, Math.ceil(theme.signalCount / 3))) } });
    });

    const themeSlots = new Map<string, number>();
    let unlinkedSlot = 0;
    visibleFeedback.forEach((post) => {
      const postLinks = links.filter((link) => link.feedbackId === post.id && graph.themes.some((theme) => theme.id === link.themeId));
      const primaryThemeId = postLinks[0]?.themeId;
      const themeIndex = primaryThemeId ? graph.themes.findIndex((theme) => theme.id === primaryThemeId) : -1;
      const slot = primaryThemeId ? (themeSlots.get(primaryThemeId) ?? 0) : unlinkedSlot;
      if (primaryThemeId) themeSlots.set(primaryThemeId, slot + 1);
      else unlinkedSlot += 1;
      const y = themeIndex >= 0
        ? 16 + themeIndex * 120 + slot * 58
        : 34 + graph.themes.length * 120 + slot * 68;
      nextNodes.push({
        id: post.id,
        type: "feedback",
        position: { x: 20, y },
        data: {
          kind: "feedback",
          title: post.title,
          meta: postLinks.length ? `${sourceLabel(post.source, locale)} · ${post.votes} ${locale === "ru" ? "голосов" : "votes"}` : `${locale === "ru" ? "Ожидает тему" : "Awaiting theme"} · ${sourceLabel(post.source, locale)}`,
          selected: post.id === selectedId,
        },
      });
      postLinks.forEach((link) => nextEdges.push({
          id: link.id,
          source: post.id,
          target: link.themeId,
          type: "evidence",
          data: { state: link.state === "suggested" ? "suggested" : "confirmed", active: linkedIds.has(post.id) && linkedIds.has(link.themeId) },
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: linkedIds.has(post.id) && linkedIds.has(link.themeId) ? "#d3e0e4" : "#718087" },
          style: {
            stroke: linkedIds.has(post.id) && linkedIds.has(link.themeId) ? "#d3e0e4" : "rgba(113,128,135,.48)",
            strokeWidth: linkedIds.has(post.id) && linkedIds.has(link.themeId) ? 1.8 : 1,
            strokeDasharray: link.state === "suggested" ? "5 5" : undefined,
          },
        }));
    });
    graph.roadmap.forEach((item, index) => {
      nextNodes.push({ id: item.id, type: "roadmap", position: { x: 690, y: 74 + index * 174 }, data: { kind: "roadmap", title: item.title, meta: `${feedbackStatusLabel(item.status, locale)} · ${item.feedbackCount} ${locale === "ru" ? "сигналов" : "signals"}`, accent: roadmapColors[item.status], selected: item.id === selectedId } });
      item.themeIds.forEach((themeId) => nextEdges.push({
        id: `roadmap-${item.id}-${themeId}`,
        source: themeId,
        target: item.id,
        type: "evidence",
        data: { state: "confirmed", active: linkedIds.has(themeId) && linkedIds.has(item.id) },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: linkedIds.has(themeId) && linkedIds.has(item.id) ? roadmapColors[item.status] : "#718087" },
        style: { stroke: linkedIds.has(themeId) && linkedIds.has(item.id) ? roadmapColors[item.status] : "rgba(113,128,135,.42)", strokeWidth: linkedIds.has(themeId) && linkedIds.has(item.id) ? 2 : 1 },
      }));
    });
    return { nodes: nextNodes, edges: nextEdges };
  }, [graph, linkedIds, links, locale, selectedId, visibleFeedback]);

  const selected = graph.feedback.find((item) => item.id === selectedId)
    ?? graph.themes.find((item) => item.id === selectedId)
    ?? graph.roadmap.find((item) => item.id === selectedId);

  function review(linkId: string, state: "confirmed" | "rejected") {
    if (readOnly) {
      setNotice(locale === "ru" ? "Это вымышленные данные. Создайте workspace, чтобы работать со своими отзывами." : "This is sample data. Create a workspace to review suggestions.");
      return;
    }
    startTransition(async () => {
      const result = await reviewSuggestion({ linkId, state });
      setNotice(result.message);
      if (result.ok) setLinks((current) => state === "rejected" ? current.filter((link) => link.id !== linkId) : current.map((link) => link.id === linkId ? { ...link, state: "confirmed" } : link));
    });
  }

  return (
    <>
      <div className="map-toolbar">
        <div className="map-toolbar-copy"><strong>{locale === "ru" ? "Signal Map · карта связей" : "Evidence network"}</strong><span>{locale === "ru" ? `${visibleFeedback.length} отзывов · ${graph.themes.length} тем · ${graph.roadmap.length} решений · вымышленные данные` : `${visibleFeedback.length} visible messages · ${graph.themes.length} themes · ${graph.roadmap.length} decisions`}</span></div>
        <div className="filter-row">
          <select className="filter-select" value={source} onChange={(event) => setSource(event.target.value as FeedbackSource | "all")} aria-label="Filter map by source">
            <option value="all">{locale === "ru" ? "Все источники" : "Every source"}</option>
            {(["portal", "email", "interview", "support"] as FeedbackSource[]).map((value) => <option key={value} value={value}>{sourceLabel(value, locale)}</option>)}
          </select>
          <select className="filter-select" value={status} onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")} aria-label="Filter map by status">
            <option value="all">{locale === "ru" ? "Все статусы" : "Every status"}</option>
            {(["new", "under_review", "planned", "in_progress", "shipped"] as FeedbackStatus[]).map((value) => <option key={value} value={value}>{feedbackStatusLabel(value, locale)}</option>)}
          </select>
          {(source !== "all" || status !== "all") && <button className="icon-button" type="button" onClick={() => { setSource("all"); setStatus("all"); }} aria-label="Reset filters"><RotateCcw size={13} /></button>}
        </div>
      </div>

      {notice && <p className="map-notice" role="status">{notice}</p>}
      <div className="map-workspace">
        <div className="map-canvas" aria-label="Interactive map from customer feedback to roadmap decisions">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
            fitViewOptions={{ padding: 0.22, maxZoom: 0.92 }}
            minZoom={0.35}
            maxZoom={1.35}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            colorMode="dark"
          >
            <Background gap={28} size={1} color="rgba(175,193,199,.12)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
        <aside className="map-inspector" aria-label="Selected evidence details">
          {selected ? <Inspector key={selectedId} selected={selected} graph={{ ...graph, links }} onReview={review} pending={isPending} locale={locale} /> : <div className="inspector-empty">{locale === "ru" ? "Выберите отзыв, тему или пункт roadmap, чтобы изучить цепочку доказательств." : "Select a signal, theme or roadmap item to inspect its evidence path."}</div>}
        </aside>
      </div>

      <div className="mobile-signal-list" aria-label="Accessible evidence paths">
        {unlinkedFeedback.map((post) => <article className="mobile-signal-path" key={`unlinked-${post.id}`}><span>{locale === "ru" ? "отзыв → ожидает тему" : "feedback → awaiting theme"}</span><h3>{post.title}</h3><p>{post.body}</p></article>)}
        {graph.roadmap.map((roadmap) => roadmap.themeIds.map((themeId) => {
          const theme = graph.themes.find((item) => item.id === themeId);
          const posts = links.filter((link) => link.themeId === themeId && link.state !== "rejected").map((link) => graph.feedback.find((post) => post.id === link.feedbackId)).filter(Boolean) as FeedbackPost[];
          return <article className="mobile-signal-path" key={`${roadmap.id}-${themeId}`}><span>{locale === "ru" ? "отзыв → тема → roadmap" : "feedback → theme → roadmap"}</span><h3>{roadmap.title}</h3><p>{locale === "ru" ? `${posts.length} отзывов подтверждают тему «${theme?.name}». ${roadmap.summary}` : `${posts.length} customer messages support “${theme?.name}”. ${roadmap.summary}`}</p></article>;
        }))}
      </div>
    </>
  );
}

function Inspector({ selected, graph, onReview, pending, locale }: {
  selected: FeedbackPost | Theme | RoadmapItem;
  graph: GraphData;
  onReview: (linkId: string, state: "confirmed" | "rejected") => void;
  pending: boolean;
  locale: Locale;
}) {
  if ("votes" in selected) {
    const links = graph.links.filter((link) => link.feedbackId === selected.id && link.state !== "rejected");
    return <div className="inspector-content"><p className="inspector-label">{locale === "ru" ? "Отзыв клиента" : "Customer signal"}</p><h2>{selected.title}</h2><p>{selected.body}</p><div className="inspector-meta"><div><span>{locale === "ru" ? "Источник" : "Source"}</span><strong>{sourceLabel(selected.source, locale)}</strong></div><div><span>{locale === "ru" ? "Охват" : "Reach"}</span><strong>{selected.votes} {locale === "ru" ? "голосов" : "votes"}</strong></div></div><ul className="evidence-list">{links.map((link) => {
      const theme = graph.themes.find((item) => item.id === link.themeId);
      return <li key={link.id}><strong>{theme?.name}</strong>{Math.round(link.similarity * 100)}% {locale === "ru" ? "семантическое совпадение" : "semantic match"} · {link.state === "suggested" ? (locale === "ru" ? "предложено AI" : "suggested") : (locale === "ru" ? "подтверждено" : "confirmed")}{link.state === "suggested" && <div className="inspector-actions"><button disabled={pending} className="button button-small button-primary" type="button" onClick={() => onReview(link.id, "confirmed")}><Check size={13} /> {locale === "ru" ? "Подтвердить" : "Confirm"}</button><button disabled={pending} className="button button-small button-outline" type="button" onClick={() => onReview(link.id, "rejected")}><X size={13} /> {locale === "ru" ? "Отклонить" : "Reject"}</button></div>}</li>;
    })}</ul></div>;
  }
  if ("signalCount" in selected) {
    const evidence = graph.links.filter((link) => link.themeId === selected.id && link.state !== "rejected").map((link) => ({ link, post: graph.feedback.find((post) => post.id === link.feedbackId) })).filter((item) => item.post);
    return <div className="inspector-content"><p className="inspector-label">{locale === "ru" ? "Тема" : "Theme"}</p><h2>{selected.name}</h2><p>{selected.description}</p><div className="inspector-meta"><div><span>{locale === "ru" ? "Сигналы" : "Signals"}</span><strong>{selected.signalCount}</strong></div><div><span>{locale === "ru" ? "Динамика за 30 дней" : "30-day velocity"}</span><strong>{selected.velocity >= 0 ? "+" : ""}{selected.velocity}%</strong></div></div><h3 className="inspector-subhead">{locale === "ru" ? "Фразы клиентов" : "Source language"}</h3><ul className="evidence-list">{evidence.slice(0, 6).map(({ link, post }) => <li key={link.id}><strong>“{post!.title}”</strong>{post!.authorName} · {link.state === "suggested" ? <><Sparkles size={10} /> {locale === "ru" ? "Предложение AI" : "AI suggestion"}</> : (locale === "ru" ? "Подтверждено founder-ом" : "Founder confirmed")}</li>)}</ul></div>;
  }
  const themes = graph.themes.filter((theme) => selected.themeIds.includes(theme.id));
  const evidence = graph.links.filter((link) => selected.themeIds.includes(link.themeId) && link.state !== "rejected");
  return <div className="inspector-content"><p className="inspector-label">{locale === "ru" ? "Решение roadmap" : "Roadmap decision"}</p><h2>{selected.title}</h2><p>{selected.summary}</p><div className="inspector-meta"><div><span>{locale === "ru" ? "Статус" : "Status"}</span><strong>{feedbackStatusLabel(selected.status, locale)}</strong></div><div><span>{locale === "ru" ? "Доказательства" : "Evidence"}</span><strong>{evidence.length} {locale === "ru" ? "отзывов" : "messages"}</strong></div></div><h3 className="inspector-subhead">{locale === "ru" ? "Почему это приоритет" : "Why this is prioritized"}</h3><ul className="evidence-list">{themes.map((theme) => <li key={theme.id}><strong>{theme.name}</strong>{theme.signalCount} {locale === "ru" ? "сигналов" : "signals"} · {theme.velocity >= 0 ? "+" : ""}{theme.velocity}% {locale === "ru" ? "динамика" : "velocity"}</li>)}</ul></div>;
}
