/**
 * 구조화 데이터(JSON-LD) — 검색엔진에게 이 페이지가 **무엇인지** 기계가 읽는 형태로 말한다.
 *
 * ## 왜 (2026-08-21 · 6앱 검색 표면 실측)
 *
 * 귀래당은 한 페이지에 5종(BreadcrumbList·Article·FAQPage·Organization·WebSite)을 싣고 있는데,
 * **신규 5앱은 전부 0개**였다. 같은 회사가 만든 앱인데 한쪽만 기계에게 자기소개를 하고 있었다.
 *
 * ## 정직하게 — 무엇이 이득이고 무엇이 아닌가
 *
 * - **BreadcrumbList**: 검색 결과에 경로가 표시된다(실제로 보이는 이득).
 * - **WebSite·Organization**: 같은 이름의 다른 것과 헷갈리지 않게 한다(엔티티 결합).
 * - **Article**: 글임을 밝힌다. 날짜를 실으므로 **거짓 신선도 금지** — 실제 개정일만 쓴다.
 * - ★**FAQPage 는 넣지 않는다.** 구글이 2023 년에 FAQ 리치 결과를 사실상 접었다(정부·보건 등
 *   일부만 남겼다). 넣어도 화면에 안 나오는데 "리치 결과가 나온다"고 스스로 믿게 되는 쪽이 해롭다.
 *
 * ★도너 = `saju-dodam/src/components/json-ld.tsx`. 새로 발명하지 않았다.
 *   XSS 이스케이프도 그대로 가져왔다 — `</script>` 로 컨텍스트를 탈출당하지 않기 위해서다.
 * ★2026-09-04 en 추가: 페이지 단위 항목(Article)은 `lang` 을 받아 inLanguage 를 맞춘다.
 *   전역 항목(WebSite·Organization)은 ko 로 둔다(사이트 정체는 하나다).
 */

/** `</script>` 탈출 방지. JSON 안에서 <, >, & 를 유니코드로 바꾼다(의미는 그대로). */
function safe(json: object): string {
  return JSON.stringify(json).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safe(data) }} />;
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erd.gwirae.com";
export const SITE_NAME = "ERD 그리기";

type Lang = "ko" | "en";
const inLanguage = (l?: Lang) => (l === "en" ? "en" : "ko-KR");

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["Domyeonkan", "Free web 2D drawing"],
    url: SITE_URL,
    inLanguage: ["ko-KR", "en"],
    // ★AI-tell 린트가 여기서 가운뎃점을 잡았다(2026-08-21). 검색 결과에 그대로 보이는 문장이라
    //   제품 카피와 같은 기준을 받는 것이 맞다 — 나열은 쉼표와 "까지"로 푼다.
    description: "가입 없이 브라우저에서 테이블과 관계를 그려 ERD 를 만드는 무료 편집기. 그린 ERD 는 이 기기의 브라우저에만 저장하고 서버로 가지 않는다",
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    /*
     * ★sameAs 는 **실재하는 주소만** 쓴다(환각 0). SNS·디렉터리는 아직 없으므로
     *   형제 사이트 하나만 건다 — 없는 프로필을 지어내면 그 자체가 구조화된 거짓말이다.
     */
    sameAs: ["https://gwirae.com"],
    knowsAbout: ["ERD", "ERD 그리기", "ER 다이어그램", "데이터베이스 설계", "free ER diagram maker"],
  };
}

/**
 * 글 페이지용. ★날짜는 **실제 개정일**만 받는다 — 기본값으로 오늘을 넣지 않는다.
 *   매일 오늘로 찍히는 dateModified 는 검색엔진에도 사람에게도 거짓말이다.
 */
export function articleJsonLd(a: { headline: string; description: string; path: string; revisedISO: string; lang?: Lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    inLanguage: inLanguage(a.lang),
    datePublished: a.revisedISO,
    dateModified: a.revisedISO,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}${a.path}`,
  };
}

/**
 * 만들기 쪽용 WebApplication — 무료(가격 0)라는 것과 브라우저에서 돈다는 것만 말한다.
 * ★평점 · 사용자 수는 싣지 않는다(없는 값을 구조화하지 않는다).
 */
export function webAppJsonLd(a: { name: string; description: string; path: string; lang?: Lang }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: a.name,
    description: a.description,
    inLanguage: inLanguage(a.lang),
    url: `${SITE_URL}${a.path}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: a.lang === "en" ? "USD" : "KRW" },
  };
}
