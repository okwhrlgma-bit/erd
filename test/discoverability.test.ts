import { describe, it, expect } from "vitest";
import sitemap from "../app/sitemap";
import robots from "../app/robots";
import manifest from "../app/manifest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const layoutSrc = readFileSync(join(__dirname, "..", "app", "layout.tsx"), "utf-8");

describe("발견성 표면", () => {
  it("사이트맵에 localhost 가 실리지 않는다(gambitry 색인 0 실사고 클래스)", () => {
    for (const e of sitemap()) {
      expect(e.url).not.toMatch(/localhost|127\.0\.0\.1/);
      expect(e.url).toMatch(/^https:\/\//);
    }
    expect(sitemap().length).toBeGreaterThanOrEqual(1); // 6호 스텁 = 루트만(화면 성립 시 확장)
  });

  it("robots 가 api 를 막고 사이트맵을 가리킨다", () => {
    const r = robots();
    expect(JSON.stringify(r.rules)).toContain("/api/");
    expect(r.sitemap).toMatch(/^https:\/\/.*sitemap\.xml$/);
  });

  it("metadata 에 플레이스홀더((작업명)·개발 중)가 노출되지 않는다(소스 검사 — layout 은 폰트 로더 탓에 vitest 에서 import 불가)", () => {
    expect(layoutSrc).not.toContain("(작업명)");
    expect(layoutSrc).not.toContain("(개발 중)");
    expect(layoutSrc).toContain("openGraph");
    expect(layoutSrc).toContain("metadataBase");
  });

  it("PWA manifest — 설치 가능 요건(아이콘 2·standalone)과 조용한 PWA(푸시 부재)", () => {
    const m = manifest();
    expect(m.display).toBe("standalone");
    expect(m.icons?.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(m)).not.toMatch(/push|notification/i);
  });
});
