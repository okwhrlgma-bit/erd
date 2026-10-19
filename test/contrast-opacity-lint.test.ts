import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 투명도로 글자를 흐리게 만들지 않는다 — **대비가 하한 아래로 떨어진다.**
 *
 * ## 실측 판정선 (2026-08-21 라이브)
 *
 * 배경 rgb(250,246,239) · 글자 rgb(43,38,34) 기준:
 *   `opacity-40` = 2.33:1 · `opacity-50` = 3.02:1 · `opacity-60` = 3.99:1  ★전부 미달
 *   `opacity-70` = 5.40:1  통과
 * WCAG 1.4.3 본문 하한은 4.5:1 이다.
 *
 * ★가장 나쁜 것은 이 앱의 **날짜 라벨**(손동·손남 등) 2.33:1 이었다.
 *   앱의 핵심 데이터인데 투명도 40%로 흐려 놓아 사실상 안 읽혔다.
 *
 * ## 왜 린트인가 (PO 지시 2026-08-21: "같은 문제가 생기지 않도록 해결부터")
 *
 * 52곳을 고치는 것으로 끝내면 **다음에 또 쓴다.** 원인은 하나다 — "조금 흐리게" 하고 싶을 때
 * 투명도가 가장 손쉬운 손잡이다. 그 손잡이를 막고, 흐림이 필요하면 **색 토큰**으로 하게 한다
 * (토큰은 대비를 계산해 정한 값이고, 투명도는 그 계산을 뒤에서 무너뜨린다).
 *
 * ★비활성 컨트롤은 예외다 — WCAG 가 inactive component 를 명시적으로 면제한다.
 *   `disabled:opacity-*` 는 "지금 못 누른다"는 뜻이라 흐린 것이 곧 정보다.
 */

/** 이 값 미만은 본문 대비를 못 넘긴다(위 실측). */
const BANNED = ["opacity-40", "opacity-50", "opacity-60"];

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const f of readdirSync(d)) {
      if (f === "node_modules" || f === ".next") continue;
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".tsx")) out.push(p);
    }
  };
  for (const base of ["app", "src"]) {
    try {
      walk(join(__dirname, "..", base));
    } catch {
      /* 없는 디렉터리는 건너뛴다 */
    }
  }
  return out;
}

describe("투명도로 글자를 흐리게 하지 않는다", () => {
  const files = tsxFiles(".");

  it("파일을 실제로 읽었다(공허한 통과 방지)", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("★대비 하한을 못 넘기는 투명도 클래스가 없다", () => {
    const hits: string[] = [];
    for (const p of files) {
      const src = readFileSync(p, "utf8");
      const lines = src.split("\n");
      lines.forEach((line, i) => {
        // 주석은 제외한다(근거를 적을 수 있어야 한다 — 검사는 코드를 본다).
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        for (const b of BANNED) {
          // ★`disabled:opacity-50` 은 면제 — WCAG 가 비활성 컴포넌트를 면제한다.
          //   `hover:`·`group-hover:` 같은 일시 상태도 본문 가독과 다른 축이라 제외한다.
          const re = new RegExp("(?<![\\w:-])" + b + "(?![\\w/-])");
          /*
           * ★비활성 상태 표현은 면제(2026-08-21 확증 · WCAG 1.4.3 inactive component 면제).
           *   `disabled:opacity-50` 뿐 아니라 **삼항식으로 거는 것**도 같다 —
           *   `${capped ? "opacity-40" : ""}` 는 "지금 못 고른다"는 뜻이라 흐린 것이 곧 정보다.
           *   이 문맥을 안 읽으면 정당한 자리를 결함으로 세게 된다(귀래당에서 실제로 2건 오탐).
           */
          /*
           * ★한 줄만 보면 놓친다(2026-08-21 세 번째 오탐): JSX 는 속성이 여러 줄에 흩어져
           *   `disabled` 가 **앞 줄**에, `opacity-50` 이 다음 줄에 오는 것이 흔하다.
           *   그래서 앞뒤 3줄을 함께 본다 — 태그 하나가 그 정도 범위에 든다.
           */
          const around = lines.slice(Math.max(0, i - 3), i + 2).join(" ");
          const inactiveCtx = /\bdisabled\b|\bcapped\b|aria-disabled/.test(around);
          if (re.test(line) && !inactiveCtx) {
            hits.push(`${p.split(/[\\/]/).slice(-2).join("/")}:${i + 1}  ${line.trim().slice(0, 70)}`);
          }
        }
      });
    }
    expect(
      hits,
      `투명도로 흐린 글자 — opacity-70 이상을 쓰거나, 흐림이 필요하면 색 토큰으로:\n  ${hits.join("\n  ")}`,
    ).toEqual([]);
  });
});
