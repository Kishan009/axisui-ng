import { editKey, setEditEntry, clearEditEntry, clearSavedEntries, editedValue, validateCell, type CellEdit } from './edit-core';
import type { GridColumnDef } from './grid-core';

describe('editKey', () => {
  it('composes a stable, deterministic key for a given rowId/colKey pair', () => {
    expect(editKey(1, 'name')).toBe(editKey(1, 'name'));
    expect(editKey('r-2', 'age')).toBe(editKey('r-2', 'age'));
    expect(editKey(1, 'name')).not.toBe(editKey('r-2', 'age'));
  });

  it('does not collide when a rowId contains the literal "::" separator', () => {
    // 'a::b' + 'x'  vs  'a' + 'b::x' both naively concatenate to 'a::b::x'
    expect(editKey('a::b', 'x')).not.toBe(editKey('a', 'b::x'));
  });
});

describe('setEditEntry / clearEditEntry', () => {
  it('setEditEntry adds an entry without mutating the input map', () => {
    const empty = new Map<string, CellEdit>();
    const next = setEditEntry(empty, 1, 'name', 'Ada');
    expect(empty.size).toBe(0);
    expect(next.get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada' });
  });

  it('clearEditEntry removes an entry without mutating the input map', () => {
    const seeded = setEditEntry(new Map<string, CellEdit>(), 1, 'name', 'Ada');
    const next = clearEditEntry(seeded, 1, 'name');
    expect(seeded.has(editKey(1, 'name'))).toBe(true);
    expect(next.has(editKey(1, 'name'))).toBe(false);
  });

  it('clearEditEntry on a missing key is a no-op that still returns a map', () => {
    const empty = new Map<string, CellEdit>();
    const next = clearEditEntry(empty, 1, 'name');
    expect(next.size).toBe(0);
  });
});

describe('editedValue', () => {
  it('returns undefined when there is no pending edit', () => {
    expect(editedValue(new Map(), 1, 'name')).toBeUndefined();
  });

  it('returns the stored value when a pending edit exists', () => {
    const edits = setEditEntry(new Map<string, CellEdit>(), 1, 'name', 'Ada');
    expect(editedValue(edits, 1, 'name')).toBe('Ada');
  });
});

describe('validateCell', () => {
  interface Row extends Record<string, unknown> { id: number; age: number; }
  const withValidator: GridColumnDef<Row> = {
    key: 'age', header: 'Age',
    validator: (value) => (typeof value === 'number' && value >= 0 ? null : 'Age must be a positive number'),
  };
  const withoutValidator: GridColumnDef<Row> = { key: 'age', header: 'Age' };
  const row: Row = { id: 1, age: 30 };

  it('returns null when the column has no validator', () => {
    expect(validateCell(withoutValidator, -5, row)).toBeNull();
  });

  it('returns null when the validator passes', () => {
    expect(validateCell(withValidator, 30, row)).toBeNull();
  });

  it('returns the error message when the validator fails', () => {
    expect(validateCell(withValidator, -5, row)).toBe('Age must be a positive number');
  });
});

describe('clearSavedEntries', () => {
  it('clears an entry whose current value matches the saved value', () => {
    const edits = setEditEntry(new Map<string, CellEdit>(), 1, 'name', 'Ada');
    const next = clearSavedEntries(edits, [{ rowId: 1, colKey: 'name', value: 'Ada' }]);
    expect(next.has(editKey(1, 'name'))).toBe(false);
  });

  it('leaves an entry untouched if it was re-edited to a different value since the batch was captured', () => {
    let edits = setEditEntry(new Map<string, CellEdit>(), 1, 'name', 'Ada');
    edits = setEditEntry(edits, 1, 'name', 'Ada Lovelace'); // re-edited after the batch snapshot
    const next = clearSavedEntries(edits, [{ rowId: 1, colKey: 'name', value: 'Ada' }]);
    expect(next.get(editKey(1, 'name'))).toEqual({ rowId: 1, colKey: 'name', value: 'Ada Lovelace' });
  });

  it('is a no-op for a key that is already absent', () => {
    const edits = new Map<string, CellEdit>();
    const next = clearSavedEntries(edits, [{ rowId: 1, colKey: 'name', value: 'Ada' }]);
    expect(next.size).toBe(0);
  });

  it('does not mutate the input map', () => {
    const edits = setEditEntry(new Map<string, CellEdit>(), 1, 'name', 'Ada');
    clearSavedEntries(edits, [{ rowId: 1, colKey: 'name', value: 'Ada' }]);
    expect(edits.has(editKey(1, 'name'))).toBe(true);
  });
});
