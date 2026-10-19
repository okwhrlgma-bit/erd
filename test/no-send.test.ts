import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * 서버 전송 0(헌장 불가침 3) - 표에 적은 값과 열고 저장하는 파일은 이 브라우저 밖으로 나가지 않는다.
 * ★우리 껍데기 코드는 주석을 걷고 본다. 표 편집기는 상류 정적 빌드라 우리가 더한 계측 스크립트만 본다.
 * 반증: cad/no-send-editor(편집기 계측에 입력 글자를 실은 줄 넣기) · cad/track-body-leak(track 본문에 입력 필드 넣기).
 */
const code = (...p: string[]) =>
  readFileSync(join(__dirname, "..", ...p), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

const NET = /\bfetch\s*\(|sendBeacon|XMLHttpRequest|new WebSocket|import\(\s*["']https?:/;

describe("기기 밖으로 보내지 않는다", () => {
  it("★안내 화면 컴포넌트 중 네트워크를 부르는 곳은 funnel.ts 한 곳뿐이다", () => {
    for (const f of ["Home.tsx", "Guide.tsx", "Credits.tsx", "Privacy.tsx", "OpenLink.tsx", "Reach.tsx", "Share.tsx"]) {
      const s = code("src", "components", f);
      expect(s.length, f).toBeGreaterThan(200);
      expect(NET.test(s), f).toBe(false);
      expect(/method:\s*"POST"/.test(s), f).toBe(false);
    }
    expect(NET.test(code("src", "lib", "visit.ts"))).toBe(false);
  });

  it("★계측(track)은 단계 이름 하나만 싣는다 - body 에 입력 필드가 없다", () => {
    const f = code("src", "lib", "funnel.ts");
    const body = f.slice(f.indexOf("JSON.stringify({"), f.indexOf("keepalive"));
    expect(body).toMatch(/reached: step/);
    expect(/\b(text|title|body|values|cell|file|sheet|doc|hash)\b/i.test(body), body).toBe(false);
  });

  it("★편집기 소스(upstream/src)에는 네트워크 호출이 하나도 없다 - 원격 요청 0", () => {
    const walk = (d: string, out: string[] = []): string[] => {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(jsx?|mjs)$/.test(e.name)) out.push(p);
      }
      return out;
    };
    const files = walk(join(__dirname, "..", "upstream", "src"));
    expect(files.length).toBeGreaterThan(100);
    const NET2 = /\bfetch\s*\(|sendBeacon|XMLHttpRequest|new WebSocket|new EventSource|from ["']axios["']/;
    const bad = files.filter((f) => NET2.test(readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ")));
    expect(bad).toEqual([]);
  });

  it("★편집기 페이지에서 우리가 더한 스크립트는 /api/track 한 곳으로 단계 이름만 보낸다", () => {
    const html = readFileSync(join(__dirname, "..", "public", "open", "index.html"), "utf8");
    const at = html.indexOf("ERD 계측");
    expect(at, "ERD 계측 표식").toBeGreaterThan(0);
    const mine = html.slice(at, html.indexOf("</script>", at));
    expect(mine.length).toBeGreaterThan(400);
    const calls = mine.match(/fetch\(/g) ?? [];
    expect(calls.length, "fetch 호출은 한 곳").toBe(1);
    expect(mine).toMatch(/fetch\("\/api\/track"/);
    expect(mine).toMatch(/reached: step/);
    expect(mine.length, "계측 스크립트는 작아야 한다").toBeLessThan(4000);
    // 키 입력 내용을 읽지 않는다: e.key 는 길이만 본다, data/clipboardData 는 읽지 않는다
    expect(/\.data\b|clipboardData|\.value\b|e\.key\s*[,)]|JSON\.stringify\(\{[^}]*key/.test(mine.replace(/e\.key\.length|e\.key === "Process"|e\.key &&/g, ""))).toBe(false);
  });
});
