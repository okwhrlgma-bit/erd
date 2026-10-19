import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * 운영 스크립트 잔재 린트 — 도구-대상 공진화 클래스의 기계화.
 * 실사건(2026-08-19): 4호에서 이식한 deploy-local.mjs 가 5호에 없는 /api/run 을 40초 묻다
 * 오탐으로 죽었다(2회). "전수 치환했다"는 믿음은 검사가 아니다 — 스크립트가 참조하는
 * API 경로가 이 앱에 실존하는지 기계로 잰다.
 */
const ROOT = join(__dirname, "..");

function scriptFiles(): string[] {
  // ★재귀 필수 — 첫 반증에서 scripts/lib/ 주입이 그대로 통과했다(비재귀 스캔의 사각).
  return readdirSync(join(ROOT, "scripts"), { recursive: true, encoding: "utf-8" })
    .filter((f) => f.endsWith(".mjs") || f.endsWith(".cmd"))
    .map((f) => join(ROOT, "scripts", f));
}

describe("운영 스크립트 잔재 린트", () => {
  it("스크립트가 묻는 /api/ 경로는 이 앱에 실존해야 한다(5호는 API 0개)", () => {
    const hasApiDir = existsSync(join(ROOT, "app", "api"));
    const offenders: string[] = [];
    for (const f of scriptFiles()) {
      const src = readFileSync(f, "utf-8");
      // 주석 줄은 실사고 기록이 남을 수 있으니 실행 줄만 본다.
      const liveLines = src.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*|rem )/i.test(l));
      for (const line of liveLines) {
        const m = line.match(/["'`]\/api\/[a-z-]+/g);
        if (m && !hasApiDir) offenders.push(f.split(/[\\/]/).pop() + ": " + m.join(","));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("스크립트에 이식 원본 앱의 고유 식별자가 남아 있지 않다", () => {
    /*
     * ★이 앱의 donor 는 gilnal 이다(2026-08-24 반증이 잡았다) — 목록이 조부모(habitquest·warchess)만
     *   알고 정작 직계 donor 를 몰라, gilnal 식별자를 주입해도 초록이었다. 이식 사슬 전부를 적는다.
     */
    const donors = /gilnal|gil\.gwirae|:3900|habitquest|warchess|hq\.gwirae|wc\.gwirae|:3500|:3300/;
    const offenders: string[] = [];
    // package.json 도 본다 — name 이 warchess-tmp 로 남아 있던 실사고(2026-08-19·린트 사각 3번째).
    for (const f of [...scriptFiles(), join(ROOT, "package.json")]) {
      const liveLines = readFileSync(f, "utf-8").split(/\r?\n/)
        .filter((l) => !/^\s*(\/\/|\*|\/\*|rem )/i.test(l));
      for (const line of liveLines) {
        if (donors.test(line)) offenders.push(f.split(/[\\/]/).pop() + ": " + line.trim().slice(0, 60));
      }
    }
    expect(offenders).toEqual([]);
  });
  it("커밋 게이트가 활성돼 있다(hooksPath) — 스크립트만 이식되고 활성은 안 된 채 무게이트 커밋이 쌓였다(2026-08-19 실사고)", () => {
    const { execSync } = require("node:child_process");
    const v = execSync("git config core.hooksPath", { cwd: ROOT, encoding: "utf-8" }).trim();
    expect(v).toBe("scripts/hooks");
  });
});
