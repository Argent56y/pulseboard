import { describe, expect, it } from "vitest";
import {
  chunkCsvRows,
  inferCsvMapping,
  mapCsvRows,
  validateCsvRows,
  type RawCsvRow,
} from "@/lib/csv-import";

describe("CSV import", () => {
  it("infers the supported columns from common header formatting", () => {
    expect(inferCsvMapping(["Title", "Body", "Author Name", "Created At"])).toEqual({
      title: "Title",
      body: "Body",
      author_name: "Author Name",
      created_at: "Created At",
    });
  });

  it("normalizes optional values before validation", () => {
    const raw: RawCsvRow[] = [{
      Title: "Shared inbox on mobile",
      Body: "Let our support team review customer signals from a phone.",
      Source: "Customer Support",
      Status: "In Progress",
      Date: "2026-09-10",
    }];
    const rows = mapCsvRows(raw, {
      title: "Title",
      body: "Body",
      source: "Source",
      status: "Status",
      created_at: "Date",
    });
    const result = validateCsvRows(rows, raw);

    expect(rows[0].status).toBe("in_progress");
    expect(rows[0].createdAt).toBe("2026-09-10T00:00:00.000Z");
    expect(result.validRows).toHaveLength(0);
    expect(result.errors[0].message).toContain("source must be");
  });

  it("skips invalid rows and repeated external ids", () => {
    const raw: RawCsvRow[] = [
      { title: "Export the roadmap", body: "We need a PDF export for monthly customer calls.", external_id: "req-42" },
      { title: "Export roadmap to PDF", body: "Please add a downloadable roadmap for review.", external_id: "REQ-42" },
      { title: "Short", body: "Too short" },
    ];
    const rows = mapCsvRows(raw, inferCsvMapping(Object.keys(raw[0])));
    const result = validateCsvRows(rows, raw);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].message).toContain("duplicated");
    expect(result.errors[1].message).toContain("title must be");
  });

  it("keeps every row when creating 200-row request batches", () => {
    const rows = Array.from({ length: 401 }, (_, index) => index);
    expect(chunkCsvRows(rows).map((batch) => batch.length)).toEqual([200, 200, 1]);
  });
});
