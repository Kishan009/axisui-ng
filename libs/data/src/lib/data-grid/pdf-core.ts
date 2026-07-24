/** A table document for the adapter: column header labels + body rows (both already stringified). */
export interface PdfDocument {
  columns: string[];
  rows: string[][];
}

/** The port the grid needs from a consumer-supplied PDF engine (jsPDF-autotable / pdfmake / etc.).
 *  May be sync (jsPDF `doc.output('arraybuffer')`) or async (pdfmake buffer callbacks). */
export interface PdfAdapter {
  toPdf(doc: PdfDocument): ArrayBuffer | Promise<ArrayBuffer>;
}

/** Split an export matrix (`[header, ...body]`, produced by the grid's overlay-aware buildExportMatrix)
 *  into the adapter's { columns, rows } shape. */
export function toPdfDocument(matrix: string[][]): PdfDocument {
  return { columns: matrix[0] ?? [], rows: matrix.slice(1) };
}
