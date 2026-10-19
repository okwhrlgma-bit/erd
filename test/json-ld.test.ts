import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { breadcrumbJsonLd, websiteJsonLd, organizationJsonLd, articleJsonLd, SITE_URL } from "@/src/lib/json-ld";

/**
 * 구조화 데이터가 **사실인가**.
 *
 * ## 왜 (2026-08-21 · 6앱 검색 표면 실측에서 신규 5앱 전부 0개)
 *
 * 구조화 데이터는 사람 눈에 안 보이는 자리라 **틀려도 아무도 모른다** — 그래서 위험하다.
 * 여기서 잠그는 것은 마크업의 존재가 아니라 **거짓말을 하지 않는가**이다.
 *
 * 1. **거짓 신선도 금지** — dateModified 를 오늘로 자동 생성하면 매일 갱신된 글처럼 보인다.
 * 2. **없는 주소 금지**(환각 0) — sameAs 에 안 만든 SNS 프로필을 적으면 구조화된 거짓말이다.
 * 3. **스크립트 탈출 불가** — JSON-LD 를 HTML 에 직접 넣으므로 `</script>` 를 막아야 한다.
 * 4. **FAQPage 를 쓰지 않는다** — 구글이 2023 년에 FAQ 리치 결과를 사실상 접었다.
 *    넣으면 "리치 결과가 나온다"고 우리가 착각한다.
 */

const read = (...p: string[]) => readFileSync(join(__dirname, "..", ...p), "utf8");

describe("구조화 데이터", () => {
  it("★자기소개에 donor 잔재가 없다(knowsAbout 날받이 잔재 5앱 라이브 실사건 2026-08-26)", () => {
    const org = organizationJsonLd() as { knowsAbout: string[] };
    for (const alien of ["손없는날", "공망", "삼재", "고누", "사주"]) {
      expect(org.knowsAbout.some((k) => k.includes(alien)), "잔재: " + alien).toBe(false);
    }
    expect(org.knowsAbout.length).toBeGreaterThan(2);
  });

  it("경로가 절대 주소로 나온다(상대 경로는 크롤러가 못 읽는다)", () => {
    const b = breadcrumbJsonLd([{ name: "옛지도밟기", path: "/" }, { name: "2026년", path: "/2026" }]);
    const items = b.itemListElement;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    for (const it of items) expect(it.item.startsWith("https://"), it.item).toBe(true);
    expect(items[1].item).toBe(`${SITE_URL}/2026`);
  });

  it("★sameAs 에 실재하지 않는 주소를 적지 않는다(환각 0)", () => {
    const org = organizationJsonLd() as { sameAs: string[] };
    for (const u of org.sameAs) {
      expect(u.startsWith("https://"), u).toBe(true);
      // 우리가 실제로 가진 것은 형제 사이트뿐이다. SNS 프로필을 만들면 그때 늘린다.
      expect(/gwirae\.com/.test(u), `우리 것이 아닌 주소: ${u}`).toBe(true);
    }
    expect(org.sameAs.length).toBeGreaterThan(0);
  });

  it("★날짜를 지어내지 않는다(거짓 신선도 금지)", () => {
    const a = articleJsonLd({ headline: "h", description: "d", path: "/guide/isa", revisedISO: "2026-08-21" });
    expect(a.datePublished).toBe("2026-08-21");
    expect(a.dateModified).toBe("2026-08-21");
    // 함수가 오늘 날짜를 만들어 내는 경로가 아예 없어야 한다.
    const src = read("src", "lib", "json-ld.tsx");
    expect(/new Date\(\)|Date\.now\(\)|toISOString\(\)/.test(src), "오늘 날짜를 만드는 코드").toBe(false);
  });

  it("★`</script>` 로 탈출할 수 없다", () => {
    const src = read("src", "lib", "json-ld.tsx");
    expect(/replace\(\/<\/g/.test(src), "< 이스케이프").toBe(true);
    expect(/replace\(\/>\/g/.test(src), "> 이스케이프").toBe(true);
    // 실제로 위험 문자열을 넣어 본다 — 주석이 아니라 동작으로 확인한다.
    const evil = breadcrumbJsonLd([{ name: "</script><script>alert(1)</script>", path: "/" }]);
    const rendered = JSON.stringify(evil).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
    expect(rendered.includes("</script>")).toBe(false);
  });

  it("★FAQPage 를 쓰지 않는다(안 나오는 리치 결과를 기대하지 않는다)", () => {
    /*
     * ★주석을 걷어내고 본다(2026-08-21 · 이 검사를 처음 돌리자 바로 걸렸다).
     *   "FAQPage 는 넣지 않는다"라고 **적어 둔 주석 자체**에 정규식이 맞아 빨개졌다 —
     *   골든 §2 "검사는 주석이 아니라 코드를 봐야 한다"가 이 파일에서 그대로 났다.
     */
    const code = read("src", "lib", "json-ld.tsx")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ");
    expect(/FAQPage/.test(code)).toBe(false);
    // 걷어내기가 통째로 지워 버렸는지 확인(공허한 통과 방지).
    expect(code.includes("BreadcrumbList")).toBe(true);
  });

  it("실제로 배선돼 있다(있는데 전달 안 됨 방지)", () => {
    expect(/JsonLd data=\{websiteJsonLd\(\)\}/.test(read("app", "layout.tsx")), "layout 의 WebSite").toBe(true);
    expect(/JsonLd data=\{organizationJsonLd\(\)\}/.test(read("app", "layout.tsx")), "layout 의 Organization").toBe(true);
    // 이 앱은 아직 홈 한 장이다 — 조합·재료별 페이지가 생기면 breadcrumb 검사를 그리로 확장한다.
  });

  it("사이트 이름이 비어 있지 않다(공허한 통과 방지)", () => {
    const w = websiteJsonLd() as { name: string; url: string };
    expect(w.name.length).toBeGreaterThan(1);
    expect(w.url.startsWith("https://")).toBe(true);
  });
});
