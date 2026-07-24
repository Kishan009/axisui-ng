import {
  AXISUI_STYLES_HEADER,
  AXISUI_STYLES_MARKER,
  pickStylePath,
  POSTCSS_CONFIG,
  withAxisUiStyles,
} from "./styles";

describe("ng-add styles helpers", () => {
  describe("withAxisUiStyles", () => {
    it("prepends the header to an empty stylesheet", () => {
      expect(withAxisUiStyles("")).toBe(AXISUI_STYLES_HEADER);
    });

    it("prepends the header above existing content", () => {
      const existing = "body { margin: 0; }\n";
      const out = withAxisUiStyles(existing);
      expect(out.startsWith(AXISUI_STYLES_HEADER)).toBe(true);
      expect(out).toContain(existing);
      expect(out.indexOf(AXISUI_STYLES_MARKER)).toBeLessThan(out.indexOf("body"));
    });

    it("is idempotent — does not double-wire", () => {
      const once = withAxisUiStyles("body{}");
      expect(withAxisUiStyles(once)).toBe(once);
    });
  });

  describe("pickStylePath", () => {
    it("picks the first css/scss entry (string form)", () => {
      expect(pickStylePath(["src/styles.css", "src/other.css"])).toBe("src/styles.css");
    });

    it("supports the object form ({ input })", () => {
      expect(pickStylePath([{ input: "src/styles.scss" }])).toBe("src/styles.scss");
    });

    it("ignores non-stylesheet entries", () => {
      expect(pickStylePath(["node_modules/x/theme.js"])).toBeUndefined();
    });

    it("returns undefined for non-arrays", () => {
      expect(pickStylePath(undefined)).toBeUndefined();
      expect(pickStylePath("src/styles.css")).toBeUndefined();
    });
  });

  it("POSTCSS_CONFIG runs the Tailwind v4 plugin", () => {
    expect(POSTCSS_CONFIG.plugins["@tailwindcss/postcss"]).toBeDefined();
  });
});
