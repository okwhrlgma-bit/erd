import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ko, en, dict, resolveLocale, pathFor, LOCALES, DEFAULT_LOCALE } from "@/src/lib/i18n";
import sitemap from "@/app/sitemap";

/**
 * ko 와 en 이 같은 형태이고, 값이 서로 다른 언어이며, 사전이 코드와 짝이 맞는가
 * (귀래당 이식 교훈 i18n 1·3 — Dict parity + 고아 키 골든).
 * ★타입(`Dict = typeof ko`)이 en 의 형태를 강제하지만 값은 못 본다: en 에 ko 문장을 복사해 두면 타입은 초록이다.
 */

function keysOf(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  if (Array.isArray(o)) return [`${prefix}[]`];
  return Object.entries(o).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

function strings(o: unknown): string[] {
  if (typeof o === "string") return [o];
  if (typeof o === "function") return [];
  if (Array.isArray(o)) return o.flatMap(strings);
  if (typeof o === "object" && o !== null) return Object.values(o).flatMap(strings);
  return [];
}

const ROOT = join(__dirname, "..");
function collect(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (/\.tsx?$/.test(n) && !p.includes(join("lib", "i18n"))) out.push(p);
  }
  return out;
}
const SOURCE_TSX = [...collect(join(ROOT, "app")), ...collect(join(ROOT, "src"))].map((f) => readFileSync(f, "utf8")).join("\n");

/** 언어 전환 라벨은 그 언어로 남는 것이 의도다(en.otherLang.label = "한국어"). */
const ALLOWED_KO_LEAK = new Set<string>([en.otherLang.label]);


describe("i18n 짝", () => {
  it("파일을 실제로 읽었다(공허한 통과 방지)", () => {
    expect(SOURCE_TSX.length).toBeGreaterThan(20000);
  });

  it("키 형태가 같다", () => {
    expect(keysOf(en)).toEqual(keysOf(ko));
  });

  it("★en 사전에 한글이 새지 않는다(예외: 언어 전환 라벨 '한국어')", () => {
    const leak = strings(en)
      .filter((s) => !ALLOWED_KO_LEAK.has(s))
      .filter((s) => /[가-힣]/.test(s));
    expect(leak).toEqual([]);
  });

  it("★ko 사전에 사용자 문구가 영어 문장으로 남아 있지 않다(주소 · 짧은 이름 제외)", () => {
    const stale = strings(ko).filter((s) => s.length > 20 && !/[가-힣]/.test(s) && !s.startsWith("http") && !s.startsWith("/"));
    expect(stale).toEqual([]);
  });

  it("★두 사전의 사용자 문구에 AI-tell 이 없다(가운뎃점 · em dash · 이모지)", () => {
    const bad = [...strings(en), ...strings(ko)].filter((s) => /[·—]|[\u{1F300}-\u{1FAFF}]/u.test(s));
    expect(bad).toEqual([]);
  });

  it("resolveLocale 은 en 만 en · 경로 표 · 로케일 목록", () => {
    expect(LOCALES).toEqual(["ko", "en"]);
    expect(DEFAULT_LOCALE).toBe("ko");
    expect(resolveLocale("en")).toBe("en");
    expect(resolveLocale("ja")).toBe("ko");
    expect(dict("en")).toBe(en);
    expect(dict("ko")).toBe(ko);
    expect(pathFor("ko", "/")).toBe("/");
    expect(pathFor("en", "/")).toBe("/en");
    expect(pathFor("en", "/guide")).toBe("/en/guide");
    expect(pathFor("en", "/privacy")).toBe("/en/privacy");
    expect(pathFor("en", "/credits")).toBe("/en/credits");
    expect(pathFor("ko", "/credits")).toBe("/credits");
    expect(ko.otherLang.href).toBe("/en");
    expect(en.otherLang.href).toBe("/");
  });

  it("★고아 키가 없다 — 사전의 잎마다 화면 코드가 그 이름을 부른다", () => {
    const ARRAY_PREFIXES = ["home.siblings", "home.howSteps"];
    const leaves = keysOf(ko).filter((k) => !ARRAY_PREFIXES.some((p) => k.startsWith(p)));
    const orphans = leaves.filter((k) => {
      const last = k.replace(/\[\]$/, "").split(".").pop()!;
      return !new RegExp(`[.\\s{\\[]${last}\\b`).test(SOURCE_TSX);
    });
    expect(orphans, "쓰이지 않는 사전 키").toEqual([]);
    expect(leaves.length).toBeGreaterThan(40);
  });

  it("★en 경로가 실재하고 사이트맵 · hreflang 에 선언돼 있다(선언≠실물 클래스)", () => {
    for (const p of ["app/en/page.tsx", "app/en/guide/page.tsx", "app/en/privacy/page.tsx", "app/en/credits/page.tsx", "app/credits/page.tsx", "proxy.ts"]) {
      expect(statSync(join(ROOT, p)).isFile(), p).toBe(true);
    }
    const urls = sitemap().map((e) => e.url);
    for (const s of ["/en", "/en/guide", "/en/privacy", "/guide", "/privacy", "/credits", "/en/credits"]) expect(urls.some((u) => u.endsWith(s)), s).toBe(true);
    for (const f of ["app/page.tsx", "app/en/page.tsx", "app/guide/page.tsx", "app/en/guide/page.tsx", "app/credits/page.tsx", "app/en/credits/page.tsx"]) {
      expect(readFileSync(join(ROOT, f), "utf8"), `${f} hreflang`).toMatch(/languages:\s*\{\s*ko:/);
    }
    const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
    expect(layout).toContain('get("x-locale")');
    expect(layout).not.toMatch(/lang="ko"/);
    // /en 아래에 force-static 금지(헤더로 lang 을 정하는 레이아웃이 빌드 때 굳는다 · en-static-lang-lint)
    for (const f of ["app/en/page.tsx", "app/en/guide/page.tsx", "app/en/credits/page.tsx"]) {
      expect(readFileSync(join(ROOT, f), "utf8")).not.toMatch(/force-static/);
    }
  });

  it("★en 라우트가 실제로 그 로케일의 Body 컴포넌트를 단다(선언≠실물)", () => {
    expect(readFileSync(join(ROOT, "app", "en", "page.tsx"), "utf8")).toMatch(/<HomeBody locale="en" \/>/);
    expect(readFileSync(join(ROOT, "app", "en", "guide", "page.tsx"), "utf8")).toMatch(/<GuideBody locale="en"/);
    expect(readFileSync(join(ROOT, "app", "en", "privacy", "page.tsx"), "utf8")).toMatch(/<PrivacyBody locale="en" \/>/);
    expect(readFileSync(join(ROOT, "app", "en", "credits", "page.tsx"), "utf8")).toMatch(/<CreditsBody locale="en"/);
  });
});
