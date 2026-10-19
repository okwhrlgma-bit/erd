import type { Metadata } from "next";
import { CreditsBody } from "@/src/components/Credits";

/**
 * 출처와 라이선스(ko). 비공식 빌드 고지, 상류 출처, 소스 위치를 화면에 둔다.
 * ★개정일은 실제 개정일만(거짓 신선도 금지).
 */
export const metadata: Metadata = {
  title: "ERD 그리기 출처와 라이선스: 비공식 빌드 고지와 소스 위치",
  description:
    "ERD 편집기의 원저작자, AGPL-3.0 고지, 고친 소스의 위치, 함께 들어 있는 오픈소스 고지를 모았습니다.",
  alternates: { canonical: "/credits", languages: { ko: "/credits", en: "/en/credits" } },
};

export default function Credits() {
  return <CreditsBody locale="ko" revisedISO="2026-10-19" />;
}
