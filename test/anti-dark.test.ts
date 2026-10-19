import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * anti-dark — 표를 여는 학생과 소상공인에게 재촉 · 손실 압박 · 거짓 희소성을 쓰지 않는다(헌장 불가침).
 * ★손님이 표에 무엇을 적든 그건 손님 몫이다. 여기서 보는 것은 **우리 화면 문구**다.
 *
 * ★사전(src/lib/i18n/*.ts)까지 본다. 문구가 전부 .ts 에 있다.
 * ★주석은 걷고 본다 — 주석에 금지어를 적어 두면 통과하는 것이 이 클래스의 함정이다.
 * ★공용 순위 부품(src/components/rank)은 원본이 따로 검사받으니 뺀다(여기서 고치지 않는 파일).
 */
const PRESSURE = /연속 ?기록|스트릭|끊겨|놓쳤|아직도 안|잊지 마|매일 꼭|당장|서두르|늦으면|품절|한정 수량|오늘만|마감 임박|지금 안 하면|\bstreaks?\b|don't miss|you missed|hurry|limited time|only today|last chance|selling fast/i;

function files(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!/node_modules|\.next|\.git|^rank$/.test(e.name)) files(p, out);
    } else if (/\.tsx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ");

describe("anti-dark", () => {
  const list = [...files(join(process.cwd(), "app")), ...files(join(process.cwd(), "src"))];

  it("화면 파일과 사전을 실제로 읽었다(공허한 통과 방지)", () => {
    expect(list.some((f) => f.endsWith(join("i18n", "ko.ts")))).toBe(true);
    expect(list.some((f) => f.endsWith(join("i18n", "en.ts")))).toBe(true);
    expect(list.some((f) => f.endsWith(join("components", "Home.tsx")))).toBe(true);
    expect(list.reduce((n, f) => n + statSync(f).size, 0)).toBeGreaterThan(20000);
  });

  it("★재촉 · 연속 기록 · 손실 압박 · 거짓 희소성 문구가 없다", () => {
    const hits: string[] = [];
    for (const f of list) {
      const src = stripComments(readFileSync(f, "utf8"));
      for (const line of src.split("\n")) {
        if (PRESSURE.test(line)) hits.push(`${f.split(/[\\/]/).slice(-2).join("/")}: ${line.trim().slice(0, 70)}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("★무료 몫(도면 열기 · 수식 · 저장)은 횟수를 묶지 않는다(열기 · 저장 횟수를 세는 코드가 없다)", () => {
    const code = list.map((f) => stripComments(readFileSync(f, "utf8"))).join("\n");
    const editor = readFileSync(join(process.cwd(), "public/open/index.html"), "utf8");
    expect(/openCount|saveCount|remaining|남은 횟수|freeLimit/.test(code + editor)).toBe(false);
  });

  it("★AGPL 항목 10: 정책, 안내, 출처 글에 복제 금지 · 수정 금지 같은 AGPL 과 맞서는 말이 없다", () => {
    const BAN = /복제 ?금지|수정 ?금지|재배포 ?금지|no copying|do not copy|no modification/i;
    const texts = [
      ...list.filter((f) => f.includes("i18n")).map((f) => readFileSync(f, "utf8")),
      readFileSync(join(process.cwd(), "public/llms.txt"), "utf8"),
      readFileSync(join(process.cwd(), "NOTICE"), "utf8"),
    ];
    expect(texts.length).toBeGreaterThanOrEqual(3);
    expect(BAN.test("복제 금지")).toBe(true); // 검사기 자체 점검
    for (const t of texts) expect(BAN.test(t)).toBe(false);
  });

  it("알림 · 푸시를 부르는 코드가 없다", () => {
    const code = list.map((f) => stripComments(readFileSync(f, "utf8"))).join("\n");
    expect(/Notification\.requestPermission|pushManager|showNotification/.test(code)).toBe(false);
  });
});
