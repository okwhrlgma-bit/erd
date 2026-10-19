import type { MetadataRoute } from "next";

// ★배포 URL 은 플랫폼 env 서 해석 — localhost 폴백 금지(gambitry 색인 0 실사고).
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erd.gwirae.com";

/*
 * ★갱신일은 **그 페이지 파일의 최종 커밋일**에서 가져온다(2026-08-29 신설).
 *   고정 문자열로 박으면 내용을 고쳐도 날짜가 그대로라 거짓 신호가 된다.
 *   빌드 때 한 번 읽고, git 이 없으면 오늘로 떨어진다(배포가 막히지 않게).
 */
function lastModOf(rel: string): Date {
  try {
    const { execFileSync } = require("node:child_process") as typeof import("node:child_process");
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", rel], {
      cwd: process.cwd(),
      encoding: "utf8",
    }).trim();
    if (out) return new Date(out);
  } catch {
    /* git 이 없거나 파일이 이력에 없으면 오늘로 */
  }
  return new Date();
}

// privacy 는 noindex 지만 함대 관행(qrtool, sudoku 정본)대로 사이트맵에는 둔다(route-sitemap-parity).
// 홈, 쓰는 법, 출처, 방침 x 두 언어 = 8쪽. 편집기 /open/ 은 정적 파일이라 여기에 넣지 않는다.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, lastModified: lastModOf("app/page.tsx"), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/en`, lastModified: lastModOf("app/en/page.tsx"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/guide`, lastModified: lastModOf("app/guide/page.tsx"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/en/guide`, lastModified: lastModOf("app/en/guide/page.tsx"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/credits`, lastModified: lastModOf("app/credits/page.tsx"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/en/credits`, lastModified: lastModOf("app/en/credits/page.tsx"), changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/privacy`, lastModified: lastModOf("app/privacy/page.tsx"), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/en/privacy`, lastModified: lastModOf("app/en/privacy/page.tsx"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
