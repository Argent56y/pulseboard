"use client";

import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { FeedbackPost } from "@/lib/types";
import { sourceLabel } from "@/lib/utils";

export function RussianInboxDemo({ posts }: { posts: FeedbackPost[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");
  const filtered = useMemo(() => posts.filter((post) => `${post.title} ${post.body}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12), [posts, query]);
  const selected = posts.find((post) => post.id === selectedId);
  const compactStatus = { new: "Новая", under_review: "Разбор", planned: "План", in_progress: "В работе", shipped: "Готово", closed: "Закрыто" } as const;
  return <>
    <section className="kpi-strip" aria-label="Сводка входящих отзывов">
      <div className="kpi-item"><span>Без разбора</span><strong>{posts.filter((post) => post.status === "new").length}</strong><small>требуют внимания</small></div>
      <div className="kpi-item"><span>Проанализировано</span><strong>{posts.filter((post) => post.embeddingState === "ready").length}</strong><small>семантика готова</small></div>
      <div className="kpi-item"><span>В roadmap</span><strong>{posts.filter((post) => ["planned", "in_progress"].includes(post.status)).length}</strong><small>связаны с решением</small></div>
      <div className="kpi-item"><span>Голоса клиентов</span><strong>{posts.reduce((sum, post) => sum + post.votes, 0)}</strong><small>по всем сигналам</small></div>
    </section>
    <section className="app-section inbox-layout">
      <div className="inbox-table-pane">
        <div className="section-toolbar"><div><h2>Сигналы клиентов</h2><p>Разберите исходные отзывы и превратите закономерности в проверяемые доказательства.</p></div><span className="table-count">Вымышленные данные · {filtered.length} из {posts.length}</span></div>
        <div className="table-toolbar"><label className="app-search"><Search size={14} /><span className="sr-only">Поиск отзывов</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по заголовку или сообщению" /></label></div>
        <div className="table-wrap"><table className="app-table ru-inbox-table"><thead><tr><th>Сигнал</th><th>Источник</th><th>Охват</th><th>Анализ</th><th>Статус</th></tr></thead><tbody>{filtered.map((post) => <tr key={post.id} data-selected={post.id === selectedId} onClick={() => setSelectedId(post.id)}><td><button className="table-title-button" type="button"><span className="table-title">{post.title}</span><span className="table-subtitle">{post.body}</span></button></td><td>{sourceLabel(post.source, "ru")}</td><td>{post.votes} · {post.comments}</td><td><span className="analysis-state analysis-ready"><Sparkles size={12} /> Готово</span></td><td><span className={`status status-${post.status}`}>{compactStatus[post.status]}</span></td></tr>)}</tbody></table></div>
      </div>
      <aside className="inbox-inspector">{selected && <><header><div><span className="app-kicker">Отзыв клиента</span><h2>{selected.title}</h2></div></header><p className="inspector-quote">“{selected.body}”</p><div className="inspector-meta"><div><span>Клиент</span><strong>{selected.authorName}</strong></div><div><span>Источник</span><strong>{sourceLabel(selected.source, "ru")}</strong></div></div><div className="analysis-callout analysis-callout-ready"><Sparkles size={14} /><div><strong>Анализ завершён</strong><span>Сильные совпадения готовы к проверке founder-ом.</span></div></div><section className="inspector-section"><h3>Предложенная тема</h3><div className="suggestion-row"><div><strong>Быстрая адаптация</strong><span>91% совпадение · подтверждено</span></div></div></section></>}</aside>
    </section>
  </>;
}
