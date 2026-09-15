"use client";

import Papa from "papaparse";
import { ArrowLeft, Check, Download, FileSpreadsheet, FileUp, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createFeedbackImport,
  finishFeedbackImport,
  importFeedbackBatch,
} from "@/app/actions";
import {
  CSV_BATCH_SIZE,
  CSV_MAX_BYTES,
  CSV_MAX_ROWS,
  chunkCsvRows,
  csvFields,
  inferCsvMapping,
  mapCsvRows,
  validateCsvRows,
  type CsvColumnMapping,
  type CsvRowError,
  type RawCsvRow,
} from "@/lib/csv-import";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { InlineFeedback } from "@/components/ui/inline-feedback";

type Step = "upload" | "mapping" | "preview" | "importing" | "result";
type ParserIssue = { row: number; message: string };

const stages = ["Upload", "Map columns", "Review", "Complete"];

export function CsvImporter({ workspaceId, boardId, onClose }: { workspaceId: string; boardId: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawCsvRow[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [parserIssues, setParserIssues] = useState<ParserIssue[]>([]);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importId, setImportId] = useState("");
  const [importedProgress, setImportedProgress] = useState(0);
  const [result, setResult] = useState({ imported: 0, failed: 0 });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const mapped = useMemo(() => mapCsvRows(rows, mapping), [mapping, rows]);
  const validation = useMemo(() => validateCsvRows(mapped, rows), [mapped, rows]);
  const errors = useMemo<CsvRowError[]>(() => {
    const byRow = new Map(validation.errors.map((error) => [error.row, error]));
    parserIssues.forEach((issue) => {
      const current = byRow.get(issue.row);
      byRow.set(issue.row, {
        row: issue.row,
        message: current ? `${current.message}; ${issue.message}` : issue.message,
        raw: rows[issue.row - 1] ?? {},
      });
    });
    return [...byRow.values()].sort((left, right) => left.row - right.row);
  }, [parserIssues, rows, validation.errors]);
  const invalidRows = useMemo(() => new Set(errors.map((error) => error.row)), [errors]);
  const validRows = useMemo(
    () => validation.validRows.filter((row) => !invalidRows.has(row.rowIndex)),
    [invalidRows, validation.validRows],
  );
  const errorByRow = useMemo(() => new Map(errors.map((error) => [error.row, error])), [errors]);
  const duplicateMappings = useMemo(() => {
    const chosen = Object.values(mapping).filter(Boolean);
    return new Set(chosen).size !== chosen.length;
  }, [mapping]);
  const currentStage = step === "upload" ? 0 : step === "mapping" ? 1 : step === "result" ? 3 : 2;
  const batchCount = Math.ceil(validRows.length / CSV_BATCH_SIZE);

  function chooseFile(file?: File) {
    if (!file) return;
    setNotice("");
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      setNotice("Choose a .csv file.");
      return;
    }
    if (file.size > CSV_MAX_BYTES) {
      setNotice("The CSV file must be 2 MB or smaller.");
      return;
    }

    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header) => header.trim(),
      complete(parsed) {
        const parsedRows = parsed.data.slice(0, CSV_MAX_ROWS + 1);
        if (parsedRows.length > CSV_MAX_ROWS) {
          setNotice(`The CSV can contain at most ${CSV_MAX_ROWS} data rows.`);
          return;
        }
        if (!parsedRows.length || !parsed.meta.fields?.length) {
          setNotice("No data rows or headers were found.");
          return;
        }
        setFilename(file.name);
        setHeaders(parsed.meta.fields);
        setRows(parsedRows);
        setMapping(inferCsvMapping(parsed.meta.fields));
        setParserIssues(parsed.errors.map((error) => ({
          row: Math.max(1, (error.row ?? 0) + 1),
          message: `CSV parser: ${error.message}`,
        })));
        setImportId("");
        setImportedProgress(0);
        setResult({ imported: 0, failed: 0 });
        setStep("mapping");
      },
      error(error) {
        setNotice(error.message);
      },
    });
  }

  function validateMapping() {
    if (!mapping.title || !mapping.body) {
      setNotice("Map both Title and Body before continuing.");
      return;
    }
    if (duplicateMappings) {
      setNotice("Each CSV column can be mapped only once.");
      return;
    }
    setNotice("");
    setStep("preview");
  }

  async function runImport() {
    if (!validRows.length) {
      setNotice("There are no valid rows to import. Fix the file or download the error report.");
      return;
    }

    setPending(true);
    setNotice("");
    setStep("importing");
    let activeImportId = importId;

    if (!activeImportId) {
      const started = await createFeedbackImport({ workspaceId, filename, totalRows: rows.length });
      if (!started.ok || !started.value) {
        setNotice(started.message);
        setStep("preview");
        setPending(false);
        return;
      }
      activeImportId = started.value;
      setImportId(activeImportId);
    }

    for (const batch of chunkCsvRows(validRows)) {
      const imported = await importFeedbackBatch({ importId: activeImportId, workspaceId, boardId, rows: batch });
      if (!imported.ok) {
        setImportedProgress(imported.value ?? importedProgress);
        setNotice(imported.message);
        setStep("preview");
        setPending(false);
        return;
      }
      setImportedProgress(imported.value ?? 0);
    }

    const finished = await finishFeedbackImport({ importId: activeImportId, workspaceId });
    if (!finished.ok || !finished.value) {
      setNotice(finished.message);
      setStep("preview");
      setPending(false);
      return;
    }
    setResult(finished.value);
    setStep("result");
    setPending(false);
  }

  function downloadErrors() {
    const csv = Papa.unparse(errors.map((error) => ({ row: error.row, error: error.message, ...error.raw })));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filename.replace(/\.csv$/i, "")}-errors.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function closeDialog() {
    if (!pending) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="import-overlay"
      aria-labelledby="import-title"
      onCancel={(event) => { event.preventDefault(); closeDialog(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
    >
      <section className="import-dialog">
        <header className="import-header">
          <div>
            <span className="app-kicker">CSV intake</span>
            <h2 id="import-title">Turn a file into customer signals.</h2>
          </div>
          <button className="icon-button" type="button" onClick={closeDialog} disabled={pending} aria-label="Close import">
            <X size={16} />
          </button>
        </header>

        <ol className="import-progress" aria-label="Import progress">
          {stages.map((label, index) => (
            <li key={label} data-active={index <= currentStage} data-current={index === currentStage}>
              <i>{index < currentStage ? <Check size={11} /> : index + 1}</i>
              <span>{label}</span>
            </li>
          ))}
        </ol>

        <div className="import-body">
          {step === "upload" && (
            <label
              className="csv-dropzone"
              data-dragging={dragActive}
              onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
              onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }}
              onDrop={(event) => { event.preventDefault(); setDragActive(false); chooseFile(event.dataTransfer.files?.[0]); }}
            >
              <span className="dropzone-icon"><FileUp size={22} /></span>
              <strong>Drop a CSV here or choose a file</strong>
              <span>Maximum 2 MB and 1000 rows. Nothing is imported before review.</span>
              <span className="dropzone-format"><b>CSV</b><i /> title and body required</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </label>
          )}

          {step === "mapping" && (
            <div className="mapping-stage">
              <div className="import-file-meta"><FileSpreadsheet size={17} /><div><strong>{filename}</strong><span>{rows.length} rows · {headers.length} columns</span></div></div>
              <p>Match your column names to Pulseboard fields. Only title and body are required.</p>
              <div className="mapping-grid">
                {csvFields.map((field) => (
                  <label key={field.key}>
                    <span>{field.label}{field.required ? " *" : ""}</span>
                    <select value={mapping[field.key] ?? ""} onChange={(event) => setMapping((current) => ({ ...current, [field.key]: event.target.value || undefined }))}>
                      <option value="">Do not import</option>
                      {headers.map((header) => <option key={header} value={header}>{header}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}

          {(step === "preview" || step === "importing") && (
            <div className="import-preview">
              <div className="import-summary">
                <div><AnimatedNumber value={validRows.length} /><span>ready</span></div>
                <div data-tone={errors.length ? "warning" : "quiet"}><AnimatedNumber value={errors.length} /><span>skipped</span></div>
                <div><AnimatedNumber value={batchCount} /><span>batches</span></div>
              </div>
              {step === "importing" && (
                <div className="import-running" role="status">
                  <RefreshCw size={15} />
                  <div><strong>Sending signals in safe batches…</strong><span>{importedProgress} of {validRows.length} imported</span></div>
                  <div className="labeled-progress" aria-label={`${importedProgress} of ${validRows.length} imported`}>
                    <i style={{ width: `${validRows.length ? Math.min(100, (importedProgress / validRows.length) * 100) : 0}%` }} />
                    <span>{validRows.length ? Math.round((importedProgress / validRows.length) * 100) : 0}%</span>
                  </div>
                </div>
              )}
              <div className="preview-table">
                <table>
                  <thead><tr><th>Row</th><th>Title</th><th>Source</th><th>Validation</th></tr></thead>
                  <tbody>
                    {mapped.slice(0, 10).map((row) => {
                      const error = errorByRow.get(row.rowIndex);
                      return (
                        <tr key={row.rowIndex} data-error={Boolean(error)}>
                          <td>{row.rowIndex}</td><td>{row.title || "—"}</td><td>{row.source}</td><td>{error?.message ?? "Ready"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && <p className="preview-footnote">Showing the first 10 of {rows.length} rows.</p>}
            </div>
          )}

          {step === "result" && (
            <div className="import-result">
              <span className="result-check"><Check size={24} /></span>
              <span className="app-kicker">Intake complete</span>
              <h3><AnimatedNumber value={result.imported} /> signals are now in the inbox.</h3>
              <p>{result.failed ? `${result.failed} invalid rows were skipped and kept in the error report.` : "Every row passed validation and is queued for semantic analysis."}</p>
              {result.failed > 0 && <button className="button button-outline" type="button" onClick={downloadErrors}><Download size={14} /> Download errors CSV</button>}
            </div>
          )}

          <InlineFeedback message={notice} tone="warning" className="import-notice" />
        </div>

        <footer className="import-footer">
          {step !== "upload" && step !== "result" && step !== "importing" ? (
            <button className="button button-outline" type="button" onClick={() => setStep(step === "preview" ? "mapping" : "upload")}>
              <ArrowLeft size={14} /> Back
            </button>
          ) : <span />}
          <span className="import-footer-actions">
            {step === "preview" && errors.length > 0 && <button className="button button-quiet" type="button" onClick={downloadErrors}><Download size={14} /> Error report</button>}
            {step === "mapping" && <button className="button button-primary" type="button" onClick={validateMapping}>Review rows</button>}
            {step === "preview" && <button className="button button-primary" type="button" disabled={pending || !validRows.length} onClick={runImport}>{importId ? "Retry import" : `Import ${validRows.length} valid rows`}</button>}
            {step === "result" && <button className="button button-primary" type="button" onClick={onClose}>Open inbox</button>}
          </span>
        </footer>
      </section>
    </dialog>
  );
}
