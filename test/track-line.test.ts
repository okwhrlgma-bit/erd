import { describe, it, expect, vi, afterEach } from "vitest";
import { POST } from "../app/api/track/route";

/**
 * 계측 한 줄의 **형태**를 잠근다 — 이 줄이 우리가 가진 유일한 수요 근거다.
 * ★잠그는 것은 소스 문자열이 아니라 **찍히는 줄**이다(골든 규칙 §1 — 리팩터가 RED 가 되면 안 된다).
 * ★이 앱은 표에 적은 글(칸 값 · 파일 이름)을 절대 싣지 않는다 — 보내도 줄에 닿지 않아야 한다.
 */

const lines: string[] = [];
function capture() {
  return vi.spyOn(console, "log").mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(" "));
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  lines.length = 0;
});

async function post(body: unknown) {
  lines.length = 0;
  capture();
  const res = await POST(new Request("http://x/api/track", { method: "POST", body: JSON.stringify(body) }));
  return { res, line: lines.find((l) => l.startsWith("[FUNNEL]")) ?? "" };
}

function fields(line: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of line.matchAll(/(\w+)=([^\s]*)/g)) (out[m[1]] ??= []).push(m[2]);
  return out;
}

describe("계측 한 줄", () => {
  it("필드가 하나씩만 찍힌다", async () => {
    const { res, line } = await post({ reached: "first_input", lang: "ko", probe: true });
    expect(res.status).toBe(204);
    expect(line, "줄이 실제로 찍혔다(공허한 통과 방지)").toContain("step=first_input");
    for (const [k, vals] of Object.entries(fields(line))) {
      expect(vals.length, `${k} 가 ${vals.length}번 찍혔다: ${line}`).toBe(1);
    }
  });

  it("★안내문 글을 실어 보내도 줄에 닿지 않는다(칸 값 · 파일 이름)", async () => {
    const { line } = await post({ reached: "first_input", lang: "ko", cell: "견적합계", text: "요구르트가게", file: "장부.xlsx", name: "별빛", hash: "v1.abc" });
    expect(line).toContain("step=first_input");
    expect(line).not.toMatch(/견적합계|요구르트가게|장부|별빛|abc|cell=|text=|file=|hash=/);
  });

  it("모르는 단계는 로그에 닿지 않는다", async () => {
    const { res, line } = await post({ reached: "interest", item: "x", lang: "ko" });
    expect(res.status).toBe(400);
    expect(line).toBe("");
  });

  it("probe 라벨이 실사용과 갈린다(우리 숫자를 우리가 읽지 않는다)", async () => {
    const p = await post({ reached: "arrive", lang: "en", probe: true });
    const r = await post({ reached: "arrive", lang: "en" });
    expect(p.line).toContain("probe=1");
    expect(r.line).toContain("probe=0");
    expect(r.line).toContain("lang=en");
  });
});
