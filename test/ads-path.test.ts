import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { layoutAdScriptOn } from "@/src/lib/ads-path";

/**
 * 광고 자리 - 첫 화면(두 언어) 한 자리. 쓰는 법 0, 출처 0, 방침 0, 표 편집기(/open/) 0.
 * 반증: cad/ad-in-guide(쓰는 법에 광고 넣기) · cad/ad-script-everywhere(스크립트를 모든 쪽에 싣기).
 */
const read = (...p: string[]) => readFileSync(join(__dirname, "..", ...p), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

describe("광고 자리", () => {
  it("★첫 화면 두 언어만 레이아웃이 스크립트를 싣는다", () => {
    for (const p of ["/privacy", "/en/privacy", "/privacy?x=1", "/privacy/", "/guide", "/en/guide", "/credits", "/en/credits", "/open", "/open/"]) expect(layoutAdScriptOn(p), p).toBe(false);
    for (const p of ["/", "/en", "/en/", "/?src=x"]) expect(layoutAdScriptOn(p), p).toBe(true);
  });

  it("★레이아웃이 그 판정을 실제로 쓴다(proxy 가 경로를 건넨다)", () => {
    expect(read("app", "layout.tsx")).toMatch(/ADSENSE_CLIENT && adsHere/);
    expect(read("app", "layout.tsx")).toMatch(/layoutAdScriptOn\(h\.get\("x-pathname"\)/);
    expect(read("proxy.ts")).toMatch(/headers\.set\("x-pathname", req\.nextUrl\.pathname\)/);
  });

  it("★쓰는 법 · 출처 · 방침 · 표 편집기 안에는 광고 자리가 없다", () => {
    for (const f of ["Guide.tsx", "Credits.tsx", "Privacy.tsx"]) {
      expect(/AdSlot|adsbygoogle/.test(read("src", "components", f)), f).toBe(false);
    }
    const editor = readFileSync(join(__dirname, "..", "public", "open", "index.html"), "utf8");
    expect(/adsbygoogle|googlesyndication/.test(editor), "표 편집기").toBe(false);
  });

  it("★첫 화면 광고는 도면 열기 링크 아래 한 자리다", () => {
    const home = read("src", "components", "Home.tsx");
    const open = home.indexOf("<OpenLink");
    const ad = home.indexOf("<AdSlot");
    expect(open).toBeGreaterThan(0);
    expect(ad).toBeGreaterThan(open);
    expect(home.split("<AdSlot").length - 1, "광고 자리는 하나").toBe(1);
  });

  it("광고는 그리는 조건과 미는 조건이 같은 게이트다", () => {
    const a = read("src", "components", "AdSlot.tsx");
    expect(a).toMatch(/if \(!CLIENT \|\| !slot\) return;/);
    expect(a).toMatch(/if \(!CLIENT \|\| !slot\) return null;/);
  });
});
