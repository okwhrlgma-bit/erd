import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FUNNEL_STEPS } from "@/src/lib/funnel";
import { VISIT_KEY, todayLocal } from "@/src/lib/visit";

/**
 * 계측 짝 - 정본 단계 목록과 화면이 실제로 부르는 track() 이 맞물리는가.
 * 돈으로 가는 길(arrive, open_click, editor_ready, first_input, export, return_visit)의 각 칸이 실제로 한 곳에서 발신돼야
 * 판독기가 그 칸을 읽을 수 있다. 목록에만 있고 아무도 안 부르면 그 칸은 영원히 0 이다.
 * editor_ready, first_input, export 는 정적 편집기 페이지(public/open/index.html)가 보낸다.
 * 반증: erd/open-click-unwired(시작 링크에서 track 지우기) · erd/return-every-open(같은 날에도 return_visit).
 */
const read = (...p: string[]) => readFileSync(join(__dirname, "..", ...p), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const FILES = ["Reach.tsx", "OpenLink.tsx", "Share.tsx"];
const ALL = FILES.map((f) => read("src", "components", f)).join("\n") + "\n" + read("src", "lib", "visit.ts");
const EDITOR = readFileSync(join(__dirname, "..", "public", "open", "index.html"), "utf8");

describe("계측 짝", () => {
  it("정본 목록에 돈 길 다섯 칸이 순서대로 있다", () => {
    const want = ["arrive", "open_click", "editor_ready", "first_input", "export", "return_visit"];
    const idx = want.map((s) => (FUNNEL_STEPS as readonly string[]).indexOf(s));
    expect(idx.every((i) => i >= 0), JSON.stringify(idx)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it("★정본의 모든 단계를 어딘가에서 실제로 보낸다 - 그리고 이름만 보낸다", () => {
    for (const s of FUNNEL_STEPS) {
      if (s === "arrive") continue; // Reach 가 step 값을 그대로 넘긴다(아래에서 따로 본다)
      if (s === "editor_ready" || s === "first_input" || s === "export") {
        expect(new RegExp('track\\("' + s + '"\\)').test(EDITOR), s + " 를 보내는 곳이 편집기 페이지에 없다").toBe(true);
        continue;
      }
      expect(new RegExp('track\\("' + s + '"\\)').test(ALL), s + " 를 보내는 곳이 없다").toBe(true);
    }
    expect(read("src", "components", "Reach.tsx")).toMatch(/track\(step\)/);
    expect(/track\([^)]*,/.test(ALL)).toBe(false);
  });

  it("★편집기 페이지는 로딩 문구가 사라지고 화면이 그려진 뒤에 editor_ready 를 보낸다", () => {
    expect(EDITOR).toMatch(/getElementById\("erd-loading"\)[\s\S]{0,200}track\("editor_ready"\)/);
  });

  it("★export 는 편집기가 내보낸 사건(erd:step 의 export)을 들은 뒤에만 보낸다", () => {
    expect(EDITOR).toMatch(/addEventListener\("erd:step"[\s\S]{0,120}track\("export"\)/);
  });

  it("★return_visit 은 다른 날 왔던 기기만(오늘 날짜와 기록이 다를 때)", () => {
    expect(read("src", "lib", "visit.ts")).toMatch(/last && last !== today/);
    expect(VISIT_KEY).toBe("erd.lastVisit.v1");
    expect(todayLocal(new Date(2026, 9, 5))).toBe("2026-10-05");
  });

  it("홈이 도착 조각과 시작 링크를 단다(실물 배선)", () => {
    expect(read("src", "components", "Home.tsx")).toMatch(/<Reach step="arrive" \/>/);
    expect(read("src", "components", "Home.tsx")).toMatch(/<OpenLink /);
    expect(read("src", "components", "OpenLink.tsx")).toMatch(/track\("open_click"\)/);
  });
});
