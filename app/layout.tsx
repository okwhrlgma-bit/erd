import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JsonLd, websiteJsonLd, organizationJsonLd } from "@/src/lib/json-ld";
import { DEFAULT_LOCALE } from "@/src/lib/i18n";
import { layoutAdScriptOn } from "@/src/lib/ads-path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * ★배포 URL 은 플랫폼 env 가 정본(gambitry sitemap localhost 실사고 — 폴백은 실도메인로만).
 * ★제목에 작업명 표기류 플레이스홀더 금지 — ja vet 仮題 클래스(사용자에겐 사고로 보인다).
 */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erd.gwirae.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  /*
   * ★검색엔진 소유확인 — **PO 가 토큰만 주면 끝나도록** 자리를 미리 판다(2026-08-21).
   *
   * 실측(그날): 이 앱은 구글·네이버 **어느 쪽에도 소유확인이 없었다**. gwirae.com 에 DNS TXT 도
   * 없어서 도메인 속성으로 덮이지도 않는다(즉 서브도메인이 자동으로 딸려가지 않는다).
   * 크롤 자체는 된다(robots 허용 + 사이트맵 선언) — 없는 것은 **우리 쪽 가시성**과,
   * 등록 의존도가 높은 **네이버 색인**이다.
   *
   * ★네이버는 우리 1위 유입원이다(귀래당 최근 7일 네이버 20 vs 구글 19 실측).
   *   그 채널에 이 앱은 등록조차 안 돼 있다.
   *
   * ★값이 없으면 **태그 자체를 안 내보낸다**(빈 content 는 확인 실패로 읽힌다).
   *   PO 가 서치어드바이저·서치콘솔에서 받은 값을 env 에 넣으면 그 즉시 실린다.
   */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_NAVER_VERIFICATION
      ? { "naver-site-verification": process.env.NEXT_PUBLIC_NAVER_VERIFICATION }
      : undefined,
  },
  title: "무료 ERD 그리기, 가입 없이 브라우저에서 | ERD 그리기",
  description: "가입 없이 브라우저에서 테이블과 관계를 그려 ERD 를 만들고 PNG, PDF, SQL 로 내보냅니다. 그린 ERD 는 이 기기의 브라우저에만 저장하고 서버로 보내지 않습니다.",
  openGraph: {
    title: "무료 ERD 그리기, 가입 없이 브라우저에서 | ERD 그리기",
    description: "가입 없이 브라우저에서 테이블과 관계를 그려 ERD 를 만들고 PNG, PDF, SQL 로 내보냅니다. 그린 ERD 는 이 기기의 브라우저에만 저장하고 서버로 보내지 않습니다.",
    url: SITE,
    siteName: "ERD 그리기",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-card.png", width: 1200, height: 630, alt: "ERD 그리기 무료 편집기" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-card.png"] },
  alternates: { canonical: "/", languages: { ko: "/", en: "/en" } },
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

import { InstallReady } from "@/src/components/InstallReady";

/*
 * ★<html lang> 을 경로에서 판다(qrtool 정본 · sudoku/baechul/minwon 이식 · 2026-09-04 en 추가):
 *   /en 쪽까지 한국어라고 말하지 않도록 proxy.ts 가 x-locale 헤더로 건넨다. 루트 레이아웃은
 *   경로를 모른다(App Router 는 layout 에 params 를 안 준다).
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const lang = h.get("x-locale") ?? DEFAULT_LOCALE;
  // 첫 화면 말고는 광고 스크립트를 싣지 않는다(src/lib/ads-path.ts).
  const adsHere = layoutAdScriptOn(h.get("x-pathname") ?? "/");
  return (
    <html
      lang={lang}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {ADSENSE_CLIENT && adsHere ? (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col">
        {/* 사이트·발행자 정체(전역 1회) — 페이지별 구조화 데이터는 각 페이지가 얹는다. */}
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
        {children}
        <InstallReady />
      </body>
    </html>
  );
}
