import type { Metadata } from "next";
import { PrivacyBody } from "@/src/components/Privacy";

/**
 * 개인정보 처리방침(ko 먼저, en 병기 · 2026-09-04 en 추가). 본문과 고지 문구는
 * src/components/Privacy.tsx 와 사전(ko/en)에 있다.
 * ★정직 원칙과 광고 고지 짝은 그 컴포넌트 머리말 참조. 색인에서 뺀다(법무 문서는 검색 표면이 아니다).
 */
export const metadata: Metadata = {
  title: "개인정보 처리방침 / Privacy",
  robots: { index: false },
  alternates: { canonical: "/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

export default function Privacy() {
  return <PrivacyBody locale="ko" />;
}
