import type { Metadata } from "next";
import { GuideBody } from "@/src/components/Guide";

/**
 * 쓰는 법(ko). 본문은 src/components/Guide.tsx 가 ko/en 공용으로 그린다.
 * ★개정일은 실제 개정일만(거짓 신선도 금지).
 */
export const metadata: Metadata = {
  title: "ERD 그리기 쓰는 법: 테이블, 관계, 저장, 내보내기",
  description:
    "ERD 편집기 시작, 테이블과 관계, 저장, 내보내기, 막힐 때 할 일을 설명합니다.",
  alternates: { canonical: "/guide", languages: { ko: "/guide", en: "/en/guide" } },
};

export default function Guide() {
  return <GuideBody locale="ko" revisedISO="2026-10-19" />;
}
