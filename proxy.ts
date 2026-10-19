import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "@/src/lib/i18n";

/*
 * 경로가 말하는 언어를 헤더로 넘긴다 — 레이아웃이 <html lang> 을 그것으로 쓴다(qrtool 정본 ·
 * sudoku/baechul/minwon 이식 · 2026-09-04). 루트 레이아웃은 경로를 모르므로 proxy 가 읽어
 * 헤더로 건넨다. 주소는 하나도 바꾸지 않는다.
 * ★/en 쪽이 lang="ko" 로 나가면 스크린리더가 영어를 한국어 발음으로 읽고 검색엔진은 한국어 문서로 본다.
 */
export function proxy(req: NextRequest) {
  const seg = req.nextUrl.pathname.split("/")[1];
  const locale = (LOCALES as readonly string[]).includes(seg) ? seg : DEFAULT_LOCALE;
  const headers = new Headers(req.headers);
  headers.set("x-locale", locale);
  headers.set("x-pathname", req.nextUrl.pathname); // 레이아웃이 적는 쪽 · 인쇄 쪽에서 광고 스크립트를 빼는 데 쓴다(src/lib/ads-path.ts)
  return NextResponse.next({ request: { headers } });
}

// 페이지만 거른다. 정적 자산과 API 는 지나칠 이유가 없다.
export const config = {
  matcher: ["/((?!_next|open|favicon|robots.txt|sitemap.xml|api).*)"],
};
