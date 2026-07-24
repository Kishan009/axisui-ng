/** UTF-8 byte-order mark; prepend to CSV file output so Excel reads UTF-8 correctly. */
export const BOM = '\uFEFF';

/** RFC 4180: quote a field iff it contains the delimiter, a double-quote, or a newline; double its quotes. */
export function escapeDelimited(value: string, delimiter: string): string {
  if (value.includes(delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize a matrix of already-stringified cells (row 0 = header) into delimited text. */
export function toDelimited(matrix: string[][], delimiter = ',', eol = '\r\n'): string {
  return matrix.map((row) => row.map((cell) => escapeDelimited(cell, delimiter)).join(delimiter)).join(eol);
}
