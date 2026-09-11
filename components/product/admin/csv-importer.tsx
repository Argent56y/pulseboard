"use client";

import Papa from "papaparse";
import { Check, Download, FileUp, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createFeedbackImport, importFeedbackBatch, type ImportFeedbackRow } from "@/app/actions";
import type { FeedbackSource, FeedbackStatus } from "@/lib/types";

type Field = "title" | "body" | "author_name" | "source" | "status" | "created_at" | "external_id";
type RawRow = Record<string, string>;
type RowError = { row: number; message: string; raw: RawRow };

const fields: { key: Field; label: string; required?: boolean }[] = [
  { key: "title", label: "Title", required: true }, { key: "body", label: "Body", required: true },
  { key: "author_name", label: "Author name" }, { key: "source", label: "Source" },
  { key: "status", label: "Status" }, { key: "created_at", label: "Created at" },
  { key: "external_id", label: "External ID" },
];
const sources = new Set<FeedbackSource>(["portal", "email", "interview", "support", "manual", "csv"]);
const statuses = new Set<FeedbackStatus>(["new", "under_review", "planned", "in_progress", "shipped", "closed"]);

export function CsvImporter({ workspaceId, boardId, onClose }: { workspaceId: string; boardId: string; onClose: () => void }) {
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "result">("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<Field, string>>>({});
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState({ imported: 0, failed: 0 });

  const mapped = useMemo(() => rows.map((raw, index): ImportFeedbackRow => {
    const value = (field: Field) => mapping[field] ? String(raw[mapping[field]!] ?? "").trim() : "";
    const sourceValue = value("source").toLowerCase() as FeedbackSource;
    const statusValue = value("status").toLowerCase().replace(/[ -]+/g, "_") as FeedbackStatus;
    const dateValue = value("created_at");
    return {
      title: value("title"), body: value("body"), authorName: value("author_name") || undefined,
      source: sources.has(sourceValue) ? sourceValue : "csv",
      status: statuses.has(statusValue) ? statusValue : "new",
      createdAt: dateValue ? (Number.isNaN(Date.parse(dateValue)) ? dateValue : new Date(dateValue).toISOString()) : undefined,
      externalId: value("external_id") || undefined, rowIndex: index + 1,
    };
  }), [mapping, rows]);

  const errors = useMemo<RowError[]>(() => mapped.flatMap((row, index) => {
    const messages: string[] = [];
    if (row.title.trim().length < 6 || row.title.length > 120) messages.push("title must be 6–120 characters");
    if (row.body.trim().length < 12 || row.body.length > 2000) messages.push("body must be 12–2000 characters");
    if (row.createdAt && Number.isNaN(Date.parse(row.createdAt))) messages.push("created_at is not a valid date");
    return messages.length ? [{ row: index + 1, message: messages.join("; "), raw: rows[index] }] : [];
  }), [mapped, rows]);

  function chooseFile(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setNotice("The CSV file must be 2 MB or smaller."); return; }
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete(parsed) {
        const parsedRows = parsed.data.slice(0, 1001);
        if (parsedRows.length > 1000) { setNotice("The CSV can contain at most 1000 data rows."); return; }
        if (!parsedRows.length || !parsed.meta.fields?.length) { setNotice("No data rows or headers were found."); return; }
        const nextHeaders = parsed.meta.fields;
        const autoMapping = Object.fromEntries(fields.flatMap((field) => {
          const match = nextHeaders.find((header) => header.trim().toLowerCase().replace(/\s+/g, "_") === field.key);
          return match ? [[field.key, match]] : [];
        })) as Partial<Record<Field, string>>;
        setFilename(file.name); setHeaders(nextHeaders); setRows(parsedRows); setMapping(autoMapping); setStep("mapping");
        setNotice(parsed.errors.length ? `${parsed.errors.length} parser warnings found; review the preview carefully.` : "");
      },
      error(error) { setNotice(error.message); },
    });
  }

  function validateMapping() {
    if (!mapping.title || !mapping.body) { setNotice("Map both Title and Body before continuing."); return; }
    setNotice(""); setStep("preview");
  }

  async function runImport() {
    setPending(true); setNotice("");
    const started = await createFeedbackImport({ workspaceId, filename, totalRows: rows.length });
    if (!started.ok || !started.value) { setNotice(started.message); setPending(false); return; }
    let imported = 0;
    for (let index = 0; index < mapped.length; index += 200) {
      const batch = await importFeedbackBatch({ importId: started.value, workspaceId, boardId, rows: mapped.slice(index, index + 200) });
      if (!batch.ok) { setNotice(batch.message); setPending(false); return; }
      imported += batch.value ?? 0;
    }
    setResult({ imported, failed: errors.length }); setStep("result"); setPending(false);
  }

  function downloadErrors() {
    const csv = Papa.unparse(errors.map((error) => ({ row: error.row, error: error.message, ...error.raw })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${filename.replace(/\.csv$/i, "")}-errors.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="import-overlay" role="presentation"><section className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
    <header><div><span className="app-kicker">CSV import · {step}</span><h2 id="import-title">Bring customer signals together.</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close import"><X size={15} /></button></header>
    <div className="import-progress" aria-hidden="true">{["upload", "mapping", "preview", "result"].map((item, index) => <i key={item} data-active={index <= ["upload", "mapping", "preview", "result"].indexOf(step)} />)}</div>
    {step === "upload" && <label className="csv-dropzone"><FileUp size={24} /><strong>Choose a CSV file</strong><span>Up to 2 MB and 1000 rows. Nothing is imported before preview.</span><input type="file" accept=".csv,text/csv" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>}
    {step === "mapping" && <div className="mapping-grid">{fields.map((field) => <label key={field.key}><span>{field.label}{field.required ? " *" : ""}</span><select value={mapping[field.key] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value || undefined }))}><option value="">Do not import</option>{headers.map((header) => <option key={header} value={header}>{header}</option>)}</select></label>)}</div>}
    {step === "preview" && <div className="import-preview"><div className="import-summary"><div><strong>{rows.length - errors.length}</strong><span>ready</span></div><div><strong>{errors.length}</strong><span>invalid</span></div><div><strong>{Math.ceil(rows.length / 200)}</strong><span>batches</span></div></div><div className="preview-table"><table><thead><tr><th>Row</th><th>Title</th><th>Status</th><th>Validation</th></tr></thead><tbody>{mapped.slice(0, 8).map((row) => { const error = errors.find((item) => item.row === row.rowIndex); return <tr key={row.rowIndex}><td>{row.rowIndex}</td><td>{row.title || "—"}</td><td>{row.status}</td><td data-error={Boolean(error)}>{error?.message ?? "Ready"}</td></tr>; })}</tbody></table></div></div>}
    {step === "result" && <div className="import-result"><span className="result-check"><Check size={24} /></span><h3>Import complete</h3><p>{result.imported} feedback items were added. {result.failed ? `${result.failed} invalid rows were skipped.` : "Every row passed validation."}</p>{result.failed > 0 && <button className="button button-outline" type="button" onClick={downloadErrors}><Download size={14} /> Download errors CSV</button>}</div>}
    {notice && <p className="inline-notice" role="status">{notice}</p>}
    <footer>{step !== "upload" && step !== "result" && <button className="button button-outline" type="button" onClick={() => setStep(step === "preview" ? "mapping" : "upload")}>Back</button>}<span />{step === "mapping" && <button className="button button-primary" type="button" onClick={validateMapping}>Validate preview</button>}{step === "preview" && <button className="button button-primary" type="button" disabled={pending} onClick={runImport}>{pending ? "Importing…" : `Import ${rows.length - errors.length} valid rows`}</button>}{step === "result" && <button className="button button-primary" type="button" onClick={onClose}>Done</button>}</footer>
  </section></div>;
}
