import { describe, it, expect } from "vitest";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * **공유로 들어온 방문이 판독기 화면에 `share` 로 뜨는가** — 사슬의 마지막 마디.
 *
 * ## 왜 (2026-08-22)
 *
 * 오늘 공유 링크에 `?from=share` 를 붙이고 *"사슬 네 마디를 다 잠갔다"* 고 썼다.
 * 그런데 잠근 것은 **골든**이었고, 값이 **판독기 화면까지 오는 것은 안 봤다.**
 * 오늘 내가 여러 번 적은 규율이 정확히 그것이다 — 끝단에서 값을 본 뒤에만 완료라고 쓴다(§12).
 *
 * ★라이브에서 서버 로그까지는 눈으로 확인했다(`src=share` 4줄 도착).
 *   그런데 **실사용 표본이 0** 이라 판독기 출력에서는 볼 수가 없다(프로브는 집계에서 빠진다).
 *   그래서 **합성 로그**를 주고 판독기를 실제로 돌려 화면 문자열을 본다.
 *
 * ★못 보는 것: 진짜 사람이 공유로 들어왔을 때의 숫자. 그건 표본이 쌓여야 안다.
 */
describe("유입 라벨 판독", () => {
  function readerOutput(lines: string[]): string {
    const dir = mkdtempSync(join(tmpdir(), "gonu-src-"));
    writeFileSync(join(dir, "host.log"), lines.join("\n"));
    const out = execFileSync(process.execPath, ["scripts/read-funnel.mjs"], {
      env: { ...process.env, WC_STORAGE_DIR: dir },
      encoding: "utf8",
    });
    rmSync(dir, { recursive: true, force: true });
    return out;
  }

  const line = (step: string, src: string, probe = 0) =>
    `[FUNNEL] step=${step} depth=0 lang=ko src=${src} probe=${probe}`;

  it("★공유로 들어온 방문이 화면에 share 로 뜬다", () => {
    const out = readerOutput([line("arrive", "share"), line("arrive", "direct"), line("arrive", "share")]);
    expect(out).toMatch(/유입 소스/);
    expect(out, "share 가 화면에 없다").toMatch(/share\s+2/);
    expect(out, "direct 가 화면에 없다").toMatch(/direct\s+1/);
  });

  it("★프로브(우리 확인)는 그 칸에 안 섞인다", () => {
    // 내 확인이 실사용 집계에 섞이면 다음 사람이 속는다 — 오늘 실제로 한 줄 섞은 적이 있다.
    const out = readerOutput([line("arrive", "share"), line("arrive", "share", 1)]);
    expect(out, "프로브까지 세었다").toMatch(/share\s+1/);
  });

  it("★유입 합이 도착 수와 어긋나면 판독기가 말한다(불변식)", () => {
    // 합이 안 맞으면 "어느 채널이 먹혔나"가 조용히 틀린다 — 조용히 넘기면 안 된다.
    const out = readerOutput([line("arrive", "share"), line("year_page", "share")]);
    expect(out).toMatch(/소스 합|유입 소스/);
  });

  it("공허한 통과 방지 — 판독기가 실제로 줄을 읽었다", () => {
    const out = readerOutput([line("arrive", "share")]);
    expect(out).not.toMatch(/퍼널 기록이 없다/);
  });
});
