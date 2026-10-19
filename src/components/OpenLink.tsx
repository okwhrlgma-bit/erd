"use client";

import { track } from "@/src/lib/funnel";

/** ERD 그리기 시작 링크. 누른 것만 한 번 센다(open_click). 주소는 정적 편집기 /open/ 이다. */
export function OpenLink({ label }: { label: string }) {
  return (
    <a
      href="/open/#/editor"
      onClick={() => track("open_click")}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-neutral-900 px-5 py-2 text-base font-semibold text-white"
    >
      {label}
    </a>
  );
}
