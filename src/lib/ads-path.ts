/**
 * 광고 스크립트를 싣는 쪽은 첫 화면 하나뿐이다(두 언어).
 *
 * 왜 레이아웃에서 막나: 계정에 자동 광고가 켜져 있으면 스크립트가 실린 페이지마다 구글이 우리가 놓지 않은
 * 자리(앵커, 전면, 본문 끼움)를 붙인다. 쓰는 법, 출처, 방침은 읽는 문서라 광고를 두지 않고,
 * ERD 편집기(/open/)는 정적 파일이라 우리 레이아웃을 거치지 않으므로 광고 스크립트가 아예 없다.
 * proxy.ts 가 x-pathname 을 건넨다.
 */
export const AD_PATHS: RegExp = /^(\/en)?$/;

function norm(path: string): string {
  const p = path.split("?")[0].replace(/\/+$/, "");
  return p === "/en" ? "/en" : p === "" ? "" : p;
}

/** 레이아웃이 이 경로에서 애드센스 스크립트를 실어도 되는가. */
export function layoutAdScriptOn(path: string): boolean {
  return AD_PATHS.test(norm(path));
}
