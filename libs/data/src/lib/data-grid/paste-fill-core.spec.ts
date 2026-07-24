import { planFill, type FillTarget } from './paste-fill-core';
import type { GridColumnDef } from './grid-core';

interface Row extends Record<string, unknown> { name: string; age: number; locked: string }
const cols: GridColumnDef<Row>[] = [
  { key: 'name', header: 'Name', editable: true },
  { key: 'age', header: 'Age', editable: true, filterType: 'number' },
  { key: 'locked', header: 'Locked' }, // not editable
];
const keys = (ts: FillTarget<Row>[]) => ts.map((t) => `${t.rowIndex}:${String(t.col.key)}=${t.raw}`);

describe('planFill', () => {
  it('places a block at the anchor, mapping down/right', () => {
    const m = [['Ada', '36'], ['Bo', '40']];
    const out = planFill(m, { rowIndex: 0, colIndex: 0 }, cols, 5);
    expect(keys(out)).toEqual(['0:name=Ada', '0:age=36', '1:name=Bo', '1:age=40']);
  });

  it('clips past the last row', () => {
    const m = [['Ada', '36'], ['Bo', '40'], ['Cy', '9']];
    const out = planFill(m, { rowIndex: 1, colIndex: 0 }, cols, 2); // only rowIndex 1 fits (rowCount 2)
    expect(keys(out)).toEqual(['1:name=Ada', '1:age=36']);
  });

  it('clips past the last column', () => {
    const m = [['x', 'y', 'z']];
    const out = planFill(m, { rowIndex: 0, colIndex: 1 }, cols, 5); // anchor at age; z has no column
    expect(keys(out)).toEqual(['0:age=x']); // y→locked (skipped, not editable), z→out of range
  });

  it('skips non-editable target columns but keeps editable ones in the same block', () => {
    const m = [['n', 'a', 'l']];
    const out = planFill(m, { rowIndex: 0, colIndex: 0 }, cols, 5);
    expect(keys(out)).toEqual(['0:name=n', '0:age=a']); // locked column skipped
  });

  it('handles ragged rows and pads missing cells to empty string', () => {
    const m = [['Ada'], ['Bo', '40']];
    const out = planFill(m, { rowIndex: 0, colIndex: 0 }, cols, 5);
    expect(keys(out)).toEqual(['0:name=Ada', '1:name=Bo', '1:age=40']);
  });

  it('empty matrix returns []', () => {
    expect(planFill([], { rowIndex: 0, colIndex: 0 }, cols, 5)).toEqual([]);
  });
});
