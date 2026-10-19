import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * 개인정보 처리방침이 **있고 · 닿고 · 사실이어야 한다.**
 *
 * ## 왜 (2026-08-21 · 형제 앱 전수 대조에서 나온 클래스)
 *
 * 라이브인데 방침이 아예 없는 앱이 둘 있었다 — 계측을 우리 서버로 보내면서 **그 사실을 사람이
 * 볼 수 있는 자리가 없었다.** 그때 만든 골든이 그 두 앱에만 있었고, 이미 방침이 있던 앱들은
 * 잠기지 않은 채였다. 지워지거나 링크가 끊겨도 아무도 모른다.
 * ★`golden-authoring.md` 머리말의 그 클래스다 — 규칙이 일부 repo 에만 살아 있는 것.
 *
 * ★이 검사가 잠그는 것은 문구가 아니라 **고지와 코드의 짝**이다:
 *   "로컬에만 저장한다"고 말하면서 서버에 쓰기 시작하면 빨개져야 한다.
 */
const APP = resolve(process.cwd(), "app");
const SRC = resolve(process.cwd(), "src");
const PRIVACY = join(APP, "privacy", "page.tsx");
/*
 * ★2026-09-04 en 추가: 방침 라우트는 얇아졌고(ko·en 둘 다 `<PrivacyBody>` 를 단다) 고지 문구는
 *   src/components/Privacy.tsx 와 사전(src/lib/i18n/ko.ts·en.ts)에 산다. 문구 검사는 그 셋을 읽는다.
 *   라우트 파일은 존재·색인 제외를 계속 잠근다.
 */
const PRIVACY_TEXT = () =>
  [join(SRC, "components", "Privacy.tsx"), join(SRC, "lib", "i18n", "ko.ts"), join(SRC, "lib", "i18n", "en.ts")]
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

/** 주석은 걷어낸다 — 머리말 주석 문구로 만족되면 그 검사는 본문을 안 본 것이다(실제로 그랬다). */
function bodyOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
}

function files(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) files(p, out);
    else if (n.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("개인정보 처리방침 표면", () => {
  it("페이지가 있다", () => {
    expect(existsSync(PRIVACY), "app/privacy/page.tsx 가 없다").toBe(true);
  });

  it("★닿을 수 있다(어딘가에서 링크한다)", () => {
    // 화면을 만드는 소스는 전부 본다(컴포넌트에서 거는 링크를 놓치지 않게).
    const linked = [...files(APP), ...files(SRC)].some((f) => f !== PRIVACY && /"\/privacy"|pathFor\(locale, "\/privacy"\)/.test(bodyOf(readFileSync(f, "utf8"))));
    expect(linked, "방침이 있는데 아무 데서도 안 닿는다 — 없는 것과 같다").toBe(true);
    const linkedEn = files(SRC).some((f) => /"\/en\/privacy"|pathFor\(locale, "\/privacy"\)/.test(bodyOf(readFileSync(f, "utf8"))));
    expect(readFileSync(join(SRC, "lib", "i18n", "index.ts"), "utf8")).toMatch(/\/en/);
    expect(linkedEn, "영어 방침이 있는데 아무 데서도 안 닿는다").toBe(true);
  });

  it("★안 하는 것을 안 한다고 쓴다(넓게 적어 면피하지 않는다)", () => {
    const body = bodyOf(PRIVACY_TEXT());
    expect(body, "IP·기기정보 미수집 고지가 없다").toMatch(/IP\s*주소/);
    expect(body, "쿠키 관련 고지가 없다").toMatch(/쿠키/);
    expect(body, "영문 고지에 IP 미수집이 없다").toMatch(/IP address/);
    expect(bodyOf(readFileSync(PRIVACY, "utf8")), "ko 라우트가 본문을 안 단다").toMatch(/<PrivacyBody locale="ko" \/>/);
  });

  it("★로컬 저장이라고 말하면 서버 저장 코드가 없어야 한다(고지·코드 짝)", () => {
    const body = bodyOf(PRIVACY_TEXT());
    const claimsLocalOnly = /브라우저[^<]{0,40}에만/.test(body);
    if (!claimsLocalOnly) return; // 그런 주장을 안 하면 이 검사는 대상이 아니다
    const track = join(APP, "api", "track", "route.ts");
    if (!existsSync(track)) return;
    const t = readFileSync(track, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    expect(/writeFile|mkdir|\bput\s*\(|INSERT\s+INTO/i.test(t), "로컬 저장이라 해 놓고 track 라우트가 저장한다").toBe(false);
  });

  /*
   * ★"이 기기의 브라우저 저장소(localStorage)에만" 의 뒷면 — 기기에 쓰는 곳은 src/lib/notice/store.ts 한 곳이고,
   *   쓰는 열쇠는 방침이 말하는 셋(안내문 입력 · 화면 안내판 입력 · 마지막으로 연 날)뿐이어야 한다.
   *   다른 파일이 저장소에 쓰기 시작하거나 열쇠가 늘면 방침이 거짓이 된다.
   *   (계측의 sessionStorage 는 세션 안 중복 거르기 · 탭을 닫으면 사라진다 · src/lib/funnel.ts)
   */
  it("★기기 저장은 visit.ts 한 곳 · 열쇠 하나뿐이고 방침이 그것을 말한다", () => {
    const strip = (f: string) => readFileSync(resolve(process.cwd(), f), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
    for (const f of ["src/components/Home.tsx", "src/components/Guide.tsx", "src/components/Credits.tsx", "src/components/OpenLink.tsx"]) {
      const c = strip(f);
      expect(c.length, f).toBeGreaterThan(300);
      expect(/localStorage|indexedDB|document\.cookie/.test(c), f).toBe(false);
    }
    const visit = strip("src/lib/visit.ts");
    expect([...visit.matchAll(/"(erd\.[a-zA-Z]+\.v\d)"/g)].map((m) => m[1])).toEqual(["erd.lastVisit.v1"]);
    const body = bodyOf(PRIVACY_TEXT());
    expect(body).toMatch(/저장소\(localStorage\)에는 마지막으로 연 날짜/);
    expect(body).toMatch(/Our own storage \(localStorage\) holds one thing: the date you last opened/);
  });

  it("색인에서 뺀다(법무 문서는 검색 표면이 아니다)", () => {
    expect(readFileSync(PRIVACY, "utf8")).toMatch(/robots:\s*\{[^}]*index:\s*false/);
  });
});
