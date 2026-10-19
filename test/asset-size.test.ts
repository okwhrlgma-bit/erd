import { describe, it, expect } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * 편집기 번들의 가장 큰 파일은 Workers 정적 자산 한 파일 한도(25 MiB)에 닿지 않아야 한다. 상류를 올리다 한도를
 * 넘으면 배포가 그때서야 실패하므로 여기서 먼저 막는다. 우리 경고선은 24 MiB(25,165,824 B).
 * 2026-10-19 첫 빌드 실측: 가장 큰 파일은 index js 약 17 MB.
 */
const OPEN = resolve(process.cwd(), "public", "open");
const LIMIT = 25_165_824;

export function biggest(dir: string): { file: string; size: number; count: number } {
  let best = { file: "", size: 0, count: 0 };
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      const b = biggest(p);
      best.count += b.count;
      if (b.size > best.size) best = { ...best, file: b.file, size: b.size };
    } else {
      best.count++;
      const n = statSync(p).size;
      if (n > best.size) best = { ...best, file: p, size: n };
    }
  }
  return best;
}

describe("편집기 번들 크기", () => {
  it("파일이 실제로 들어 있다(공허한 통과 방지)", () => {
    expect(biggest(OPEN).count).toBeGreaterThan(20);
  });
  it("★가장 큰 파일이 24 MiB 이하", () => {
    const b = biggest(OPEN);
    expect(b.size, b.file).toBeLessThanOrEqual(LIMIT);
  });
  it("파일 수가 Workers 한도(2만)보다 한참 아래", () => {
    expect(biggest(OPEN).count).toBeLessThan(15000);
  });
});
