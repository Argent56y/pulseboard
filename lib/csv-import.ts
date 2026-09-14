import { importRowSchema } from "@/lib/validations";

export const CSV_MAX_BYTES = 2 * 1024 * 1024;
export const CSV_MAX_ROWS = 1000;
export const CSV_BATCH_SIZE = 200;

export type CsvField =
  | "title"
  | "body"
  | "author_name"
  | "source"
  | "status"
  | "created_at"
  | "external_id";

export type RawCsvRow = Record<string, string>;
export type CsvColumnMapping = Partial<Record<CsvField, string>>;

export interface ImportFeedbackRow {
  title: string;
  body: string;
  authorName?: string;
  source?: string;
  status?: string;
  createdAt?: string;
  externalId?: string;
  rowIndex: number;
}

export interface CsvRowError {
  row: number;
  message: string;
  raw: RawCsvRow;
}

export const csvFields: Array<{ key: CsvField; label: string; required?: boolean }> = [
  { key: "title", label: "Title", required: true },
  { key: "body", label: "Body", required: true },
  { key: "author_name", label: "Author name" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created at" },
  { key: "external_id", label: "External ID" },
];

export function normalizeCsvHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export function inferCsvMapping(headers: string[]): CsvColumnMapping {
  const normalized = new Map(headers.map((header) => [normalizeCsvHeader(header), header]));
  return Object.fromEntries(
    csvFields.flatMap((field) => {
      const match = normalized.get(field.key);
      return match ? [[field.key, match]] : [];
    }),
  ) as CsvColumnMapping;
}

export function mapCsvRows(rows: RawCsvRow[], mapping: CsvColumnMapping): ImportFeedbackRow[] {
  return rows.map((raw, index) => {
    const value = (field: CsvField) => mapping[field] ? String(raw[mapping[field]!] ?? "").trim() : "";
    const source = value("source").toLowerCase();
    const status = value("status").toLowerCase().replace(/[ -]+/g, "_");
    const createdAt = value("created_at");

    return {
      title: value("title"),
      body: value("body"),
      authorName: value("author_name") || undefined,
      source: source || "csv",
      status: status || "new",
      createdAt: createdAt && !Number.isNaN(Date.parse(createdAt))
        ? new Date(createdAt).toISOString()
        : createdAt || undefined,
      externalId: value("external_id") || undefined,
      rowIndex: index + 1,
    };
  });
}

function readableIssue(path: PropertyKey | undefined, fallback: string) {
  switch (path) {
    case "title": return "title must be 6–120 characters";
    case "body": return "body must be 12–2000 characters";
    case "source": return "source must be portal, email, interview, support, manual or csv";
    case "status": return "status is not recognized";
    case "createdAt": return "created_at is not a valid date";
    case "authorName": return "author_name must be 80 characters or fewer";
    case "externalId": return "external_id must be 200 characters or fewer";
    default: return fallback;
  }
}

export function validateCsvRows(rows: ImportFeedbackRow[], rawRows: RawCsvRow[]) {
  const validRows: ImportFeedbackRow[] = [];
  const errors: CsvRowError[] = [];
  const externalIds = new Set<string>();

  rows.forEach((row, index) => {
    const parsed = importRowSchema.safeParse(row);
    const messages = parsed.success
      ? []
      : [...new Set(parsed.error.issues.map((issue) => readableIssue(issue.path[0], issue.message)))];

    if (row.externalId) {
      const key = row.externalId.toLowerCase();
      if (externalIds.has(key)) messages.push("external_id is duplicated in this file");
      externalIds.add(key);
    }

    if (messages.length) {
      errors.push({ row: row.rowIndex, message: messages.join("; "), raw: rawRows[index] ?? {} });
    } else if (parsed.success) {
      validRows.push(parsed.data);
    }
  });

  return { validRows, errors };
}

export function chunkCsvRows<T>(rows: T[], size = CSV_BATCH_SIZE) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}
