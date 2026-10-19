import { ko, type Dict, type Rich } from "./ko";
import { en } from "./en";

/**
 * 두 언어 — ko 가 정본, en 은 같은 형태(sudoku/baechul/minwon 정본 이식 · 2026-09-04).
 *
 * ## 왜 둘인가 (PO 상시 2026-09-04 "모든 앱은 해외·국제 서비스를 고려할 것")
 * "store closed sign" · "holiday hours sign" 은 영어권에도 큰 검색이다. 영어판은 번역이 아니라 그 시장 관례(you 직접, 짧은 명령형)를 기본값으로 둔다.
 *
 * ## 형태
 * - `/` = ko, `/en` = en. 주소는 안 바꾼다. proxy.ts 가 x-locale 헤더로 `<html lang>` 을 맞춘다.
 * - 문구는 사전에서만 온다. `Dict = typeof ko` 라 en 에서 키가 빠지면 tsc 가 막는다.
 */
export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

export function resolveLocale(v: unknown): Locale {
  return v === "en" ? "en" : "ko";
}

export function dict(l: Locale): Dict {
  return l === "en" ? en : ko;
}

export type AppPath = "/" | "/guide" | "/credits" | "/privacy";

/** 로케일별 경로 — ko 는 루트, en 은 /en 아래. */
export function pathFor(l: Locale, p: AppPath): string {
  if (l === "ko") return p;
  return p === "/" ? "/en" : `/en${p}`;
}

export { ko, en };
export type { Dict, Rich };
