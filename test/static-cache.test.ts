/**
 * 정적 조각은 1년 immutable 로 캐시한다 (2026-09-26 비게임 UX 감사 · static-cache-rollout 이 심었다).
 * 실결함: Workers 정적 자산 기본값이 max-age=0, must-revalidate 라 재방문 때마다 해시 붙은 CSS·JS 를 서버에 되물었다(라이브 응답 헤더 실측).
 * 규칙은 public/_headers 에 있어야 한다 — Workers 는 next.config 의 headers() 를 정적 자산에 적용하지 않는다.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("정적 조각 캐시", () => {
  it("public/_headers 가 /_next/static/* 에 1년 immutable 을 준다", () => {
    const p = join(process.cwd(), "public", "_headers");
    expect(existsSync(p)).toBe(true);
    const txt = readFileSync(p, "utf8");
    const at = txt.indexOf("/_next/static/*");
    expect(at).toBeGreaterThanOrEqual(0);
    const rule = txt.slice(at, at + 200);
    expect(rule).toMatch(/Cache-Control:\s*public,\s*max-age=31536000,\s*immutable/);
  });
});
