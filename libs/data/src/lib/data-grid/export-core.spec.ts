import { BOM, escapeDelimited, toDelimited } from './export-core';

describe('escapeDelimited', () => {
  it('passes through a plain value', () => {
    expect(escapeDelimited('abc', ',')).toBe('abc');
  });
  it('quotes when the value contains the delimiter', () => {
    expect(escapeDelimited('a,b', ',')).toBe('"a,b"');
    expect(escapeDelimited('a,b', '\t')).toBe('a,b');
  });
  it('quotes and doubles embedded quotes', () => {
    expect(escapeDelimited('a"b', ',')).toBe('"a""b"');
  });
  it('quotes on newline or carriage return', () => {
    expect(escapeDelimited('a\nb', ',')).toBe('"a\nb"');
    expect(escapeDelimited('a\rb', ',')).toBe('"a\rb"');
  });
  it('preserves leading/trailing spaces without quoting', () => {
    expect(escapeDelimited('  x  ', ',')).toBe('  x  ');
  });
});

describe('toDelimited', () => {
  const matrix = [['Name', 'Note'], ['Ada', 'a,b'], ['Alan', 'x"y']];
  it('joins as CSV with CRLF and RFC-4180 escaping', () => {
    expect(toDelimited(matrix, ',')).toBe('Name,Note\r\nAda,"a,b"\r\nAlan,"x""y"');
  });
  it('joins as TSV, still escaping embedded quotes (RFC-4180 style)', () => {
    expect(toDelimited(matrix, '\t')).toBe('Name\tNote\r\nAda\ta,b\r\nAlan\t"x""y"');
  });
  it('empty matrix -> empty string', () => {
    expect(toDelimited([], ',')).toBe('');
  });
  it('BOM is the UTF-8 byte-order mark', () => {
    expect(BOM).toBe('﻿');
  });
});
