import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sitemap from "@/app/sitemap";

/**
 * 사이트맵에 올린 페이지는 **사이트 안에서 닿을 수 있어야 한다.**
 *
 * ## 왜 (2026-08-21 발견성 실측)
 *
 * 형제 앱(띠지기)에서 **사이트맵의 83%(82쪽)가 사이트 안에서 진입 불가**인 것을 실측으로 찾았다.
 * 페이지끼리는 이어져 있었는데 **그 사슬에 들어갈 입구가 없었다** — 검색으로 떨어진 사람만
 * 볼 수 있는 페이지는, 검색 유입이 적은 우리에겐 없는 것과 같다.
 * 같은 클래스가 이 앱에도 있었다(`/guide`·연도 페이지). 그래서 5앱 전부에 심는다.
 *
 * ★이 검사가 보는 것은 "링크라는 글자가 있는가"가 아니라 **군집마다 입구가 있는가**이다.
 *   동적 경로(`/tti/year/[year]`)를 하나하나 세면 소스에 82개 링크를 박으라는 뜻이 되어
 *   오히려 나쁜 설계를 강요한다. 그래서 **경로 패턴 단위**로 입구를 요구한다.
 */
/**
 * ★스캔 범위(2026-08-21 · 이식하면서 오탐이 났다): `app/` 만 보면 **컴포넌트에서 거는 링크를
 *   통째로 놓친다**(형제 앱에서 실제로 `/ladder` 를 고아로 오판했다 — 실측 고아는 0이었다).
 *   화면을 만드는 소스는 전부 본다.
 */
const ROOTS = ["app", "src"].map((d) => resolve(process.cwd(), d)).filter((d) => existsSync(d));

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (n.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** 주석은 걷어낸다 — 주석 속 경로로 만족되면 그 검사는 아무것도 안 본 것이다. */
const allSource = ROOTS.flatMap((r) => sourceFiles(r))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n")
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, " ");

/** 사이트맵 경로를 군집으로 접는다: `/tti/year/1987` → `/tti/year/:seg` */
function cluster(path: string): string {
  return path.replace(/\/\d+$/, "/:num");
}

describe("사이트맵에 올린 것은 사이트 안에서 닿는다", () => {
  const paths = sitemap().map((e) => new URL(e.url).pathname.replace(/\/$/, "") || "/");

  it("사이트맵을 실제로 읽었다(공허한 통과 방지)", () => {
    expect(paths.length, "사이트맵이 비었다").toBeGreaterThan(0);
  });

  it("★군집마다 입구가 있다 — 링크 0인 경로 묶음이 없다", () => {
    const clusters = new Map<string, string[]>();
    for (const p of paths) {
      if (p === "/") continue;
      const c = cluster(p);
      if (!clusters.has(c)) clusters.set(c, []);
      clusters.get(c)!.push(p);
    }
    /*
     * ★템플릿 링크를 읽어야 한다(2026-08-21 · 이 검사가 처음에 12쪽을 오탐했다).
     *   `/tti/rat` 은 소스에 그 문자열로 없다 — `href={`/tti/${d.key}`}` 로 생성된다.
     *   그걸 못 읽으면 "동적으로 잘 링크한 코드"를 결함으로 부르게 되고, 그건 검사가 아니라 소음이다.
     *   → 소스에서 템플릿 접두사를 뽑아 두고, 그 아래 경로는 닿는 것으로 본다.
     */
    /*
     * ★템플릿은 **통째로 정규식으로 바꾼다**(2026-08-21 · 여기서 오탐이 세 번 났다).
     *   접두사만 보면 `` href={`/${y}`} `` 는 접두사가 `/` 라 판단이 안 서고,
     *   접두사+칸수로 고쳤더니 이번엔 `` href={`/${y}/print`} `` 처럼 **보간 뒤에 더 붙는** 형태를
     *   놓쳤다. 부분만 흉내 내면 계속 새 형태에 진다.
     *   → 백틱 안을 그대로 읽어 `${…}` 만 "한 칸"으로 바꾸고 나머지는 문자 그대로 맞춘다.
     */
    /*
     * ★백틱 템플릿은 중괄호 바로 안에만 있지 않다(2026-08-30). 삼항으로 고르는 형태
     *   `` href={locale === "ko" ? "/guide" : `/${locale}/guide`} `` 에서는 템플릿이 조건식 안에 있어
     *   앞의 패턴에 안 걸렸고, 실제로 링크된 세 쪽을 고아로 오판했다.
     *   그래서 **중괄호 표현식 안의 백틱을 전부** 걷는다. 보간의 중괄호 때문에 닫는 괄호를
     *   세려다 실패했어서(`${locale}` 의 `}` 에서 끊긴다), 뒤 200자를 문맥으로 본다.
     */
    const tmplRes = [
      ...allSource.matchAll(/href=\{`([^`]*)`\}/g),
      ...[...allSource.matchAll(/href=\{(?=([\s\S]{0,200}))/g)].flatMap((m) => [...m[1].matchAll(/`([^`]*)`/g)]),
    ]
      .map((m) => m[1])
      .filter((body) => body.startsWith("/"))
      // ★쿼리는 잘라낸다 — 사이트맵 경로에는 쿼리가 없다. 형제 앱이 `?lang=` 을 붙여 링크하는데
      //   그걸 그대로 맞추려다 **64군집을 고아로 오판**했다(이 자리 네 번째 오탐).
      .map((body) => body.split("?")[0])
      .map((body) => {
        const pattern = body
          .split(/\$\{[^}]*\}/)
          .map((lit) => lit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("[^/]+");
        return new RegExp(`^${pattern}$`);
      });
    /*
     * ★이 검사가 **못 보는 것**(2026-08-21 반증에서 드러남 · 숨기지 않고 적는다):
     *   한 칸짜리 보간 템플릿(`` href={`/${y}`} ``)은 정규식이 `^/[^/]+$` 가 되어
     *   **아무 한 칸 경로나 닿는다고 인정**한다. 실제로 형제 앱(옛지도밟기)에서 존재하지 않는
     *   경로를 사이트맵에 심었더니 이 검사가 통과했다 — 그 앱의 한 칸 군집은 여기서 검증되지 않는다.
     *   더 좁히면 `/${y}` 로 잘 링크한 코드를 고아로 오판하므로, 좁히는 대신 **한계를 적는다.**
     *   (5앱 중 4앱은 결정적 반증에서 RED 를 냈다 — 검사 자체는 살아 있다.)
     */
    const covers = (path: string) => tmplRes.some((re) => re.test(path));

    /*
     * ★**부모가 닿는다고 자식이 닿는 것이 아니다**(2026-08-21 · 이 검사가 실제로 놓친 자리).
     *   처음엔 "동적 군집은 부모 경로로 가는 링크가 있으면 입구가 있다"고 봤다. 그런데
     *   옛지도밟기 연도 페이지가 **월 페이지를 하나도 안 잇고 있었다** — 부모는 닿는데 자식 48쪽이
     *   고아였고, 이 검사는 초록이었다. 손으로 찾은 것을 검사가 못 잡으면 그 검사는 아직 없는 것이다.
     *   → 부모 크레딧을 뺀다. **그 페이지 자체를 가리키는 링크**(문자열이든 템플릿이든)만 인정한다.
     *
     * ★★그래도 **이 검사로는 못 잡는 것이 남는다**(반증으로 확인했다·숨기지 않는다):
     *   월 페이지끼리 앞뒤로 이어져 있으면 "링크가 있다"는 만족되지만 **그 사슬에 들어갈 입구가
     *   없을 수 있다.** 실제로 옛지도밟기가 그 상태였고 이 검사는 초록이었다.
     *   정적 소스만 보고 "홈에서 도달 가능한가"를 풀려면 결국 그래프를 걸어야 하는데,
     *   하이드레이션 뒤 링크가 달라지는 우리 앱들에서는 소스로 그 그래프를 못 만든다.
     *   → **진짜 판정은 라이브 크롤이 한다**: `~/.claude/tools/reachability.mjs`(sweep-all 에 포함).
     *   이 골든은 그 앞단에서 "아무 데서도 안 링크된 군집"만 값싸게 막는다.
     */
    const unreachable: string[] = [];
    for (const [c, members] of clusters) {
      /*
       * ★링크의 형태는 셋이다(2026-08-30 에 세 번째가 드러났다).
       *   ①`href="/guide"` 문자열 ②`` href={`/x/${y}`} `` 템플릿
       *   ③**중괄호 안의 문자열** — `href={locale === "ko" ? "/guide" : ...}` 나 `href={GUIDE[locale]}`
       *   처럼 조건이나 표로 고르는 형태. 네 언어 판본이 있는 앱에서 자연스럽게 나오는 꼴인데
       *   앞의 둘만 보던 검사가 **실제로 링크된 안내 네 쪽을 고아로 오판**했다.
       *   훉내로 좁혀 붙이면 다음 형태에도 지므로(§14.3), 중괄호 표현식 안의 경로 문자열을
       *   통째로 걷어 같은 자격으로 인정한다. 사이트맵 파일은 `href=` 를 쓰지 않아 섞이지 않는다.
       */
      const inBraces = new Set(
        [...allSource.matchAll(/href=\{(?=([\s\S]{0,200}))/g)]
          .flatMap((m) => [...m[1].matchAll(/["'](\/[^"']*)["']/g)].map((q) => q[1].split("?")[0])),
      );
      const linked = members.some(
        (m) => allSource.includes(`href="${m}"`) || inBraces.has(m) || covers(m),
      );
      if (!linked) unreachable.push(`${c} (${members.length}쪽)`);
    }
    expect(unreachable, "사이트맵에 있는데 사이트 안에서 못 가는 군집이 있다").toEqual([]);
  });

});
