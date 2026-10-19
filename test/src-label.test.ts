import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 유입 라벨의 형태 검사가 **클라이언트와 서버에서 같은가**.
 *
 * ★2026-08-21 실사건: 이 앱은 `?from=tti` 하나만 인정하고 나머지를 전부 `direct` 로 뭉갰다.
 *   형제 앱 링크만 재려던 것인데, 그러면 **우리가 어디에 뿌리든 그 채널이 안 보인다** —
 *   PO 가 링크를 뿌리는 날이 수익의 시작점인데 그때 어느 채널이 먹혔는지 모르면
 *   다음에 어디에 힘을 쓸지 정할 수 없다.
 * ★넓히되 자유 문자열은 막는다. 그리고 **양쪽이 같은 형태**를 써야 한다 —
 *   한쪽만 넓히면 클라이언트가 보낸 값을 서버가 버리고, 그 사실을 아무도 모른다
 *   (이 저장소가 반복해 겪은 '이음매 바꾸면 소비처가 조용히 남는다' 클래스).
 */

const codeOf = (p: string) =>
  readFileSync(join(__dirname, "..", p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

/**
 * **src 를 판정하는 줄에서만** 형태 검사 리터럴을 뽑는다.
 *
 * ★파일 전체에서 첫 정규식을 집었더니 서버의 **상품 id 검사**(`{0,30}`)를 잡아
 *   클라이언트(`{0,15}`)와 다르다고 빨개졌다. 제품이 아니라 내 추출이 틀린 것이었다.
 *   같은 파일에 형태 검사가 여럿 있을 수 있다 — 무엇을 재는지 좁혀야 한다.
 */
function shapeIn(code: string): string | null {
  const line = code
    .split("\n")
    .find((l) => (/\bsrc\b/i.test(l) || /SRC_RE/.test(l)) && (/\.test\(/.test(l) || /=\s*\//.test(l)));
  // ★문자 클래스를 박아 두지 않는다(2026-08-30) — 도메인의 점을 허용하자 제품이 옳게 넓어진
  //   자리에서 이 검사가 빨개졌다. 잠글 것은 허용 문자가 아니라 양쪽이 같은 검사를 쓰는가다.
  const m = line?.match(/\/\^\[a-z\]\[[^\]]+\]\{0,\d+\}\$\//);
  return m ? m[0] : null;
}

describe("유입 라벨", () => {
  const client = codeOf(join("src", "lib", "funnel.ts"));
  const server = codeOf(join("app", "api", "track", "route.ts"));

  it("클라이언트가 형태 검사를 한다(자유 문자열이 로그에 못 간다)", () => {
    expect(shapeIn(client), "클라이언트 형태 검사").not.toBeNull();
  });

  it("서버도 형태 검사를 한다(클라이언트를 믿지 않는다)", () => {
    expect(shapeIn(server), "서버 형태 검사").not.toBeNull();
  });

  it("★두 형태가 같다(한쪽만 넓히면 조용히 어긋난다)", () => {
    expect(shapeIn(server)).toBe(shapeIn(client));
  });

  it("한 값만 인정하던 옛 판정이 남아 있지 않다", () => {
    // `from === "tti" ? "tti" : "direct"` 형태가 남아 있으면 넓힌 것이 무의미하다.
    expect(/===\s*"tti"\s*\?/.test(client), "클라이언트 옛 판정").toBe(false);
    expect(/===\s*"tti"\s*\?/.test(server), "서버 옛 판정").toBe(false);
  });

  it("모르는 값은 direct 로 떨어진다(버리지 않고 라벨을 붙인다)", () => {
    expect(/"direct"/.test(client) && /"direct"/.test(server)).toBe(true);
  });
});
