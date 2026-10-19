import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * AI-tell(AI 지문) 린트 — 사용자에게 보이는 문자열만 대상.
 *
 * 출처: 시몬(11년차 프로덕트 디자이너) 「AI 티 나는 디자인, 어떻게 개선해요?」 웨비나 원문 정독
 * (2026-08-11, yt-dlp transcript). 원문 발언:
 *   "이런 미들닷 진짜 많이 씁니다. 이거 저는 요즘에 이거 보면 그냥 AI 같아요."
 *   "이런 것들은 여러분들이 판단의 영역이 아니고 무조건 하지 말라고 해야 되는 것들이에요."
 *   "제가 오늘 이거 준비하면서 이런 것들을 다 잡아내는 스킬까지 만들어서 드리려고 했었는데
 *    거기까지는 못 했어요."
 *
 * ★그가 못 만든 것을 우리는 게이트로 만든다. 판단의 영역이 아니라고 했으므로 린트가 맞다.
 *   가이드 문서로 두면 다음 세션이 안 읽는다 — 기계화만이 재발을 막는다.
 *
 * 대상: 사용자에게 렌더되는 문자열. 주석(설계 근거를 적는 곳)은 제외한다 —
 *   우리 주석은 한국어라 가운뎃점을 정상적으로 쓴다. 오탐 0 이 이 린트의 생존 조건이다.
 */

/** 소스에서 주석을 제거한다(주석은 사용자에게 보이지 않으므로 대상 아님). */
function stripComments(src: string): string {
  let out = "";
  let i = 0;
  let mode: "code" | "line" | "block" | "s" | "d" | "t" = "code";
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === "code") {
      if (c === "/" && n === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && n === "*") { mode = "block"; i += 2; continue; }
      if (c === "'") mode = "s";
      else if (c === '"') mode = "d";
      else if (c === "`") mode = "t";
      out += c; i++; continue;
    }
    if (mode === "line") { if (c === "\n") { mode = "code"; out += c; } i++; continue; }
    if (mode === "block") { if (c === "*" && n === "/") { mode = "code"; i += 2; } else { if (c === "\n") out += c; i++; } continue; }
    // 문자열 안: 이스케이프 처리하며 그대로 보존
    if (c === "\\") { out += src.slice(i, i + 2); i += 2; continue; }
    if ((mode === "s" && c === "'") || (mode === "d" && c === '"') || (mode === "t" && c === "`")) mode = "code";
    out += c; i++;
  }
  return out;
}

/**
 * ★가운뎃점 판정을 한 번 좁혔다(2026-08-21 · 공휴일 표를 넣다 오탐이 났다).
 *
 * `3·1절` 은 **고유명사의 정식 표기**다(6·25, 8·15 도 같은 꼴). 이걸 AI-티로 잡으면
 * 오탐이고, 오탐을 뿜는 린트는 결국 무시된다 — 그러면 진짜 남발이 지나간다.
 *
 * ★좁히되 **변별력은 지킨다**: 면제는 **숫자 사이에 낀 가운뎃점**뿐이다.
 *   `A·B·C` 같은 나열은 그대로 걸린다(그게 이 린트가 잡으려던 것이다).
 *   `test/ai-tell-narrowing.test.ts` 가 양방향(오탐 없음 · 진짜는 잡힘)을 확인한다.
 */
const PROPER_MIDDOT = /(?<=\d)·(?=\d)/g;

const AI_TELLS: [string, RegExp, string][] = [
  ["미들닷(·)", /·/, "가운뎃점은 즉시 AI-티로 읽힌다. 줄바꿈·여백·별도 요소로 분리하라"],
  ["em-dash(—)", /—/, "em dash 는 AI 지문이다. 쉼표나 문장 분리로 바꿔라"],
  ["이모지", /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u, "이모지 대신 아이콘 또는 텍스트를 쓴다"],
];

function collect(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

describe("AI-tell 린트 — 사용자에게 보이는 문자열", () => {
  const ROOT = join(__dirname, "..");

  it("센티넬 — 주석 제거기가 실제로 동작한다(오탐 0의 전제)", () => {
    const src = [
      "// 설계 근거: 정직·환각0",
      "/* 블록 주석 안의 · 와 — 도 무시된다 */",
      'const a = "사용자에게 보이는 문장";',
    ].join("\n");
    const stripped = stripComments(src);
    expect(stripped).not.toContain("정직");
    expect(stripped).not.toContain("블록 주석");
    expect(stripped).toContain("사용자에게 보이는 문장");
  });

  it("센티넬 — 검출기가 AI-tell 을 실제로 잡는다", () => {
    const bad = 'const s = "White to move · 20 moves";';
    expect(AI_TELLS.some(([, re]) => re.test(stripComments(bad)))).toBe(true);
    const dash = 'const s = "Game over — 1-0";';
    expect(AI_TELLS.some(([, re]) => re.test(stripComments(dash)))).toBe(true);
    const emoji = 'const s = "Nice move 🎉";';
    expect(AI_TELLS.some(([, re]) => re.test(stripComments(emoji)))).toBe(true);
    // 오탐 0: 주석 안의 가운뎃점은 잡히지 않는다
    const comment = "// 불가침: 정직·환각0·anti-dark\nconst s = \"ok\";";
    expect(AI_TELLS.some(([, re]) => re.test(stripComments(comment)))).toBe(false);
    // 오탐 0: 하이픈·마이너스는 em dash 가 아니다
    expect(AI_TELLS.some(([, re]) => re.test(stripComments('const s = "1-0";')))).toBe(false);
  });

  it("스캔 대상이 비어 있지 않다(경로 오판 방지)", () => {
    expect(collect(join(ROOT, "src")).length + collect(join(ROOT, "app")).length).toBeGreaterThan(2); // 5호 초기 파일 3개 실측
  });

  it("src·app 의 사용자 노출 문자열에 AI-tell 0건", () => {
    const hits: string[] = [];
    for (const f of [...collect(join(ROOT, "src")), ...collect(join(ROOT, "app"))]) {
      const code = stripComments(readFileSync(f, "utf8"));
      code.split("\n").forEach((rawLine, i) => {
        // ★고유명사 안의 가운뎃점(3·1절 · 6·25)만 지우고 본다 — 나열용 남발은 그대로 남는다.
        const line = rawLine.replace(PROPER_MIDDOT, "");
        for (const [name, re, fix] of AI_TELLS) {
          if (re.test(line)) {
            hits.push(`${f.slice(ROOT.length + 1)}:${i + 1} [${name}] ${line.trim().slice(0, 70)}\n    → ${fix}`);
          }
        }
      });
    }
    expect(hits, `AI-tell 발견(시몬 기준: 판단의 영역이 아니라 무조건 제거):\n${hits.join("\n")}`).toEqual([]);
  });
});
