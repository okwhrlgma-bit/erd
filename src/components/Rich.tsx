import type { Rich as RichText } from "@/src/lib/i18n/ko";

/**
 * 사전의 Rich(문자열 배열)를 그린다. 홀수 번째 조각이 굵게 나온다.
 * 언어마다 굵힐 자리가 달라서 문장은 사전에 통째로 두고 여기서는 조각만 그린다(sudoku 정본 이식).
 */
export function Rich({ t }: { t: RichText }) {
  return (
    <>
      {t.map((s, i) => (i % 2 === 1 ? <b key={i}>{s}</b> : s ? <span key={i}>{s}</span> : null))}
    </>
  );
}
