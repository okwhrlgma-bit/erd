import { describe, it, expect } from "vitest";
import { POST } from "../app/api/track/route";
import { FUNNEL_STEPS } from "../src/lib/funnel";

function req(body: unknown) {
  return new Request("http://x/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("퍼널 수집 관문(6호)", () => {
  it("화이트리스트 단계만 받는다", async () => {
    for (const s of FUNNEL_STEPS) expect((await POST(req({ reached: s, lang: "ko" }))).status).toBe(204);
    expect((await POST(req({ reached: "evil" }))).status).toBe(400);
    expect((await POST(req("garbage"))).status).toBe(400);
  });
});
