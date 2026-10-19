import type { Metadata } from "next";
import { HomeBody } from "@/src/components/Home";

/**
 * 290호 첫 화면(ko). 본문은 src/components/Home.tsx 가 ko/en 공용으로 그린다.
 * ★타이틀은 문자열 리터럴로 둔다. 검사가 소스의 타이틀을 라이브 <title> 과 대조한다.
 * ★겨냥한 검색어("erd 그리기" · "erd 만들기" · "무료 erd")를 제목에 쓴다. 다른 회사 제품 이름은 쓰지 않는다.
 */
export const metadata: Metadata = {
  title: "무료 ERD 그리기, 가입 없이 브라우저에서 | ERD 그리기",
  description:
    "가입 없이 브라우저에서 테이블과 관계를 그려 ERD 를 만들고 PNG, PDF, SQL 로 내보냅니다. 그린 ERD 는 이 기기의 브라우저에만 저장하고 서버로 보내지 않습니다.",
  alternates: { canonical: "/", languages: { ko: "/", en: "/en" } },
};

export default function Home() {
  return <HomeBody locale="ko" />;
}
