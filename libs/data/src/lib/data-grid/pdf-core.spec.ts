import { toPdfDocument, type PdfDocument } from './pdf-core';

describe('toPdfDocument', () => {
  it('splits an export matrix into columns (header row) + rows (body)', () => {
    const doc: PdfDocument = toPdfDocument([['Name', 'Age'], ['Ada', '36'], ['Bo', '40']]);
    expect(doc).toEqual({ columns: ['Name', 'Age'], rows: [['Ada', '36'], ['Bo', '40']] });
  });
  it('header-only matrix → empty rows', () => {
    expect(toPdfDocument([['Name', 'Age']])).toEqual({ columns: ['Name', 'Age'], rows: [] });
  });
  it('empty matrix → empty columns and rows', () => {
    expect(toPdfDocument([])).toEqual({ columns: [], rows: [] });
  });
});
