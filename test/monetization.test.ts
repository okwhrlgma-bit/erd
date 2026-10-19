import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 수익화 표면 골든(2026-08-27 PO "모든 앱은 수익화 요소 있을것·궁극 목표=수익화").
 *
 * ★검사하는 것: 이 앱이 수익화 표면을 실제로 갖고 있고, 그것이 홈에 배선돼 있으며,
 *   env 게이트(계정 없으면 휴면)와 privacy 광고 고지가 함께 있는지.
 * ★공허하지 않게: "파일이 있다"만 보지 않는다 — 홈이 AdSlot 을 실제로 렌더하고(import+사용),
 *   레이아웃이 애드센스를 env 조건으로만 싣고, privacy 가 광고 고지를 조건부로 담는지까지 본다.
 */
const root = join(__dirname, "..");
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

describe("수익화 표면", () => {
  it("광고 슬롯 컴포넌트가 존재하고 env 게이트로 휴면한다", () => {
    const ad = read("src", "components", "AdSlot.tsx");
    expect(ad).toContain("NEXT_PUBLIC_ADSENSE_CLIENT");
    // 계정 ID 가 없으면 아무것도 렌더하지 않아야 한다(빈 자리·가짜 배너 금지).
    /*
     * ★문장이 아니라 뜻을 본다(2026-08-29). 전에는 옛 코드 한 줄을 그대로 박아 둬서,
     *   게이트를 더 엄격하게 고치자 골든이 개선을 결함으로 신고했다.
     * ★그리고 슬롯 조건을 따로 잠근다 — 퍼블리셔 ID 만 보고 자리를 내면 애드센스가 못 채우는
     *   빈 광고가 남는다(같은 모델 사이트가 가이드 12장 중 11장에서 실제로 그 상태였다).
     */
    expect(ad).toMatch(/if \(!CLIENT[^)]*\) return null/);
    expect(ad).toMatch(/!CLIENT \|\| !SLOT/);
    expect(ad).toContain("adsbygoogle");
  });

  it("홈이 광고 슬롯을 실제로 렌더한다(import 만 하고 안 쓰는 공허 금지)", () => {
    // 2026-09-04 en 추가: 홈 본문은 src/components/Home.tsx(ko/en 공용)에 있다.
    const home = read("src", "components", "Home.tsx");
    expect(home).toContain('from "@/src/components/AdSlot"');
    expect(home).toMatch(/<AdSlot[^/]*\/>/);
    expect(read("app", "page.tsx")).toMatch(/<HomeBody locale="ko" \/>/);
    expect(read("app", "en", "page.tsx")).toMatch(/<HomeBody locale="en" \/>/);
  });

  it("레이아웃이 애드센스 스크립트를 env 조건으로만 싣는다", () => {
    const layout = read("app", "layout.tsx");
    expect(layout).toContain("NEXT_PUBLIC_ADSENSE_CLIENT");
    expect(layout).toContain("pagead2.googlesyndication.com");
    // 조건 없이 무조건 싣지 않는다(계정 없을 때 제3자 스크립트 로드 금지).
    expect(layout).toMatch(/ADSENSE_CLIENT(?: && adsHere)? \?/);
  });

  it("privacy 가 광고를 켰을 때 제3자 쿠키 고지를 담는다(광고 고지 짝)", () => {
    // 2026-09-04 en 추가: 방침 본문은 src/components/Privacy.tsx(ko/en 병기)가 그리고 두 라우트가 그것을 단다.
    const privacy = read("src", "components", "Privacy.tsx");
    expect(privacy).toContain("NEXT_PUBLIC_ADSENSE_CLIENT");
    expect(privacy).toMatch(/ADSENSE_ON \?/);
    expect(read("app", "privacy", "page.tsx")).toMatch(/<PrivacyBody locale="ko" \/>/);
    expect(read("app", "en", "privacy", "page.tsx")).toMatch(/<PrivacyBody locale="en" \/>/);
    // 고지 문구는 사전에 있다(ko/en). 두 언어 모두 애드센스 절이 있어야 한다.
    expect(read("src", "lib", "i18n", "ko.ts")).toContain("애드센스");
    expect(read("src", "lib", "i18n", "en.ts")).toContain("AdSense");
  });
});
