/**
 * Smoke spec for the demo app. Confirms the test pipeline works
 * end-to-end for apps (and not just libs). Real component tests
 * land in Phase 2 along with the Playwright e2e suite.
 */

describe('apps/demo', () => {
  it('smoke test passes', () => {
    expect(1 + 1).toBe(2);
  });
});
