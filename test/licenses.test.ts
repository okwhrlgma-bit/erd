import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * 라이선스 파일 (AGPL 판정 항목 3, 4, 5, 7).
 * 3: LICENSE 와 public/LICENSE.txt 가 있고 같다. 4: NOTICE 에 원저작과 수정 저작 줄. 5: CHANGES.md 의 마지막 날짜가
 * upstream/ 을 건드린 마지막 커밋 날짜 이상. 7: upstream/src 의 상대 import 가 전부 upstream/ 안에서 풀린다(저장소 밖 0).
 */
const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8").split("\r\n").join("\n");

export function lastChangesDate(md: string): string {
  const ds = [...md.matchAll(/^## (\d{4}-\d{2}-\d{2})/gm)].map((m) => m[1]).sort();
  return ds[ds.length - 1] ?? "";
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(p, out);
    } else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

describe("라이선스 파일", () => {
  it("★네 파일이 있다", () => {
    for (const f of ["LICENSE", "NOTICE", "CHANGES.md", "public/LICENSE.txt"]) {
      expect(existsSync(join(ROOT, f)), f).toBe(true);
    }
  });

  it("★LICENSE 는 AGPL-3.0 원문이고 public/LICENSE.txt 와 같다", () => {
    const l = read("LICENSE");
    expect(l).toMatch(/GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3, 19 November 2007/);
    expect(l.length).toBeGreaterThan(30_000);
    expect(read("public/LICENSE.txt")).toBe(l);
  });

  it("★NOTICE 에 원저작과 우리 수정 저작 줄이 있다", () => {
    const n = read("NOTICE");
    expect(n).toMatch(/drawdb-io\/drawdb/);
    expect(n).toMatch(/Copyright \(c\) 2026 gwirae/);
    expect(n).toMatch(/WITHOUT ANY WARRANTY/);
    expect(n).toMatch(/github\.com\/okwhrlgma-bit\/erd/);
  });

  it("★CHANGES.md 마지막 날짜가 upstream/ 마지막 변경 커밋 날짜 이상이다", () => {
    expect(lastChangesDate("## 2026-10-19\n## 2026-10-21\n## 2026-10-20")).toBe("2026-10-21");
    const changes = lastChangesDate(read("CHANGES.md"));
    expect(changes).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    let commitDate = "";
    try {
      commitDate = execFileSync("git", ["log", "-1", "--format=%cs", "--", "upstream"], { cwd: ROOT, encoding: "utf8" }).trim();
    } catch {
      commitDate = "";
    }
    if (commitDate) expect(changes >= commitDate, `CHANGES ${changes} < upstream 커밋 ${commitDate}`).toBe(true);
  });

  it("★upstream/src 의 상대 import 는 전부 upstream/ 안에서 풀린다", () => {
    const UP = resolve(ROOT, "upstream");
    const bad: string[] = [];
    const EXT = ["", ".js", ".jsx", ".mjs", ".json", ".css", ".png", ".svg", "/index.js", "/index.jsx"];
    const files = walk(join(UP, "src"));
    expect(files.length).toBeGreaterThan(100);
    for (const f of files) {
      const s = readFileSync(f, "utf8");
      for (const m of s.matchAll(/(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g)) {
        const target = resolve(dirname(f), m[1].split("?")[0]);
        if (!target.startsWith(UP)) bad.push(f + " -> " + m[1] + " (밖)");
        else if (!EXT.some((e) => existsSync(target + e))) bad.push(f.slice(UP.length) + " -> " + m[1] + " (없음)");
      }
    }
    expect(bad).toEqual([]);
  });
});
