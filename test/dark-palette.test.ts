/**
 * 다크 모드 대비 골든 (2026-09-25 · 비게임 앱 UX 전수 감사 · dark-palette-rollout 이 심었다).
 *
 * 실결함: 이 함대 앱 대부분이 밤 화면에서 바탕만 어둡게 바꾸고(--background) 글자는 text-neutral-700 같은
 * 고정 회색으로 남겨 두었다. 360px 다크 화면에서 설명 글과 안내 글이 바탕과 1.2~1.6:1 로 거의 안 보였고,
 * 흰 카드(bg-neutral-50) 위에는 밝은 글자가 얹혀 카드 속 제목이 사라졌다(라이브 촬영 · 100앱 중 약 70앱).
 * 검색으로 들어온 사람이 밤에 폰으로 열면 답 칸 옆 설명을 못 읽고 나간다.
 *
 * 그래서 재는 것:
 *  1. 소스가 쓰는 회색 팔레트(neutral·stone·zinc·gray·slate)의 칸마다 다크 블록이 그 변수를 다시 정의한다.
 *  2. bg-white 는 밤에 어두운 카드로, 진한 회색 단추 위 흰 글자는 어두운 글자로(--color-white 는 안 뒤집는다 · 색 단추 위 흰 글자 보호).
 *  3. :root 에 정의한 변수는 다크 블록에도 있다(--muted 가 빠져 밤에 보조 글자가 2.8:1 이던 앱이 넷).
 *  4. dark: 변형을 쓰지 않는다(쓰면 위 뒤집기와 겹쳐 두 번 뒤집힌다).
 *  5. 광고 칸이 있으면 못 채운 칸(data-ad-status=unfilled)을 접는다(빈 칸 1,666px 가 결과 아래를 비웠다).
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CSS_PATH = join(ROOT, "app", "globals.css");

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f.startsWith(".")) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(f) && !/\.test\./.test(f)) out.push(p);
  }
  return out;
}

function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "");
}

/** @media (prefers-color-scheme: dark) { ... } 블록들의 속을 모은다(중괄호 짝을 센다). */
function darkBlocks(css: string): string {
  const out: string[] = [];
  const re = /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    out.push(css.slice(start, i - 1));
  }
  return out.join("\n");
}

const css = existsSync(CSS_PATH) ? stripComments(readFileSync(CSS_PATH, "utf8")) : "";
const code = [...walk(join(ROOT, "app")), ...walk(join(ROOT, "src")), ...walk(join(ROOT, "components"))]
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");
const dark = darkBlocks(css);
const hasDark = dark.length > 0;
/** 회색 뒤집기를 받은 앱인가(롤아웃은 라이브에 얹어 재서 대비가 줄어든 앱에만 뒤집기를 넣었다). */
const remapped = /--color-(?:neutral|stone|zinc|gray|slate)-\d+\s*:/.test(dark);

describe("다크 모드 대비", () => {
  it("쓰는 회색 칸마다 다크 블록이 다시 정의한다", () => {
    if (!remapped) return;
    const used = new Set<string>();
    for (const m of code.matchAll(/\b(?:text|bg|border|ring|divide|outline|placeholder|from|via|to|fill|stroke|decoration|accent|caret)-(neutral|stone|zinc|gray|slate)-(\d{2,3})\b/g)) {
      used.add(`--color-${m[1]}-${m[2]}`);
    }
    const missing = [...used].filter((v) => !new RegExp(`${v}\\s*:`).test(dark));
    expect(missing, `다크 블록에 없는 회색 변수: ${missing.join(" ")}`).toEqual([]);
  });

  it("흰 카드는 밤에 어두운 카드로 칠한다", () => {
    if (!remapped) return;
    if (!/\bbg-white\b/.test(code)) return;
    expect(/\.bg-white\s*\{[^}]*background-color/.test(dark)).toBe(true);
  });

  it("진한 회색 단추 위 흰 글자는 밤에 어두운 글자로 바뀐다(단추가 밝아지므로)", () => {
    if (!remapped) return;
    for (const m of code.matchAll(/\bbg-(neutral|stone|zinc|gray|slate)-(600|700|800|900|950)\b[^"'`\n]*\btext-white\b/g)) {
      expect(dark.includes(`.bg-${m[1]}-${m[2]}`) && /\)\.text-white\s*\{/.test(dark), `밤에 밝아진 단추 위 흰 글자: ${m[0]}`).toBe(true);
    }
  });

  it(":root 변수는 다크 블록에도 있다", () => {
    if (!hasDark) return;
    const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
    const rootVars = [...root.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]);
    const missing = rootVars.filter((v) => !new RegExp(`${v}\\s*:`).test(dark));
    expect(missing, `밤에 그대로 남는 변수: ${missing.join(" ")}`).toEqual([]);
  });

  it("dark: 변형을 쓰지 않는다(뒤집기와 겹친다)", () => {
    if (!remapped) return;
    const hits = [...code.matchAll(/["'`\s]dark:[a-z]/g)].length;
    expect(hits).toBe(0);
  });

  it("광고 칸이 있으면 못 채운 칸을 접는다", () => {
    if (!/adsbygoogle/.test(code)) return;
    expect(/ins\.adsbygoogle\[data-ad-status=["']?unfilled["']?\]\s*\{[^}]*display:\s*none/.test(css)).toBe(true);
  });
});
