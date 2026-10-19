import { describe, it, expect } from "vitest";
import { createReadStream, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * 상표 0 (AGPL 판정 항목 9) - 편집기 번들(public/open 의 html 과 js)에서 상류 이름은 정보 창의 원저작자 표기
 * "drawdb-io/drawdb" 한 가지 꼴로만 나온다. 제목, 메타, 아이콘 이름, 사이트 주소(drawdb.app)로는 나오지 않는다.
 * ★번들 js 는 17MB 라 스트림으로 읽는다. 조각 경계에 걸린 낱말을 놓치지 않게 앞 조각의 꼬리를 이어 붙인다.
 * ★판정은 순수 함수 brandHits 가 한다(아래 자체 점검이 같은 함수를 돌린다. 위음성이 되지 않게).
 */
const OPEN = resolve(process.cwd(), "public", "open");
const OK = "drawdb-io/drawdb";

/** 허용된 원저작자 표기 안에 들어 있지 않은 drawdb 낱말 위치를 모은다. */
export function brandHits(text: string): string[] {
  const hits: string[] = [];
  const re = /drawdb/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const i = m.index;
    const first = text.startsWith(OK, i);
    const second = i >= 10 && text.startsWith(OK, i - 10);
    if (!first && !second) hits.push(text.slice(Math.max(0, i - 20), i + 30));
  }
  if (/drawdb\.app/i.test(text)) hits.push("drawdb.app");
  return hits;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

async function scanFile(file: string): Promise<string[]> {
  const hits: string[] = [];
  let tail = "";
  const TAIL = 40;
  for await (const chunk of createReadStream(file, { encoding: "utf8", highWaterMark: 1 << 20 })) {
    const text = tail + chunk;
    for (const h of brandHits(text)) hits.push(h);
    tail = text.slice(-TAIL);
  }
  return hits;
}

describe("상표 0", () => {
  it("자체 점검: 허용 꼴은 통과하고 나머지는 잡는다", () => {
    expect(brandHits("about drawdb-io/drawdb here")).toEqual([]);
    expect(brandHits("<title>drawDB</title>").length).toBe(1);
    expect(brandHits("https://drawdb.app/editor").length).toBeGreaterThan(0);
    expect(brandHits("DrawDB-io/drawdb").length).toBeGreaterThan(0);
  });

  it("★번들 html 과 js 에 상류 이름이 원저작자 표기 밖으로 나오지 않는다", async () => {
    const files = walk(OPEN);
    expect(files.length, "public/open 에 html/js 가 있어야 한다(공허한 통과 방지)").toBeGreaterThan(3);
    const all: string[] = [];
    for (const f of files) for (const h of await scanFile(f)) all.push(f.slice(OPEN.length) + ": " + h);
    expect(all).toEqual([]);
  }, 120_000);

  it("정보 창에 원저작자 표기가 실제로 있다(아예 지워도 통과하는 일 방지)", async () => {
    const files = walk(OPEN).filter((f) => statSync(f).size > 100_000);
    let found = false;
    for (const f of files) {
      for await (const chunk of createReadStream(f, { encoding: "utf8", highWaterMark: 1 << 22 })) {
        if (chunk.includes(OK)) found = true;
      }
    }
    expect(found).toBe(true);
  }, 120_000);
});
