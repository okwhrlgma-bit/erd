#!/usr/bin/env node
// 창립 골든의 반증 등록(한 번 돌리는 도구) - falsify-add.mjs 를 항목마다 부른다(셸 따옴표를 거치지 않게 execFileSync).
// 돌린 뒤 `node ~/.claude/tools/falsify-registry.mjs --repo erd` 로 전부 RED 인지 본다.
import { execFileSync } from "node:child_process";

const T = "C:/Users/okwhr/.claude/tools/falsify-add.mjs";
const KEY36 = "a".repeat(36);
const E = [
  ["ad-in-guide", "test/ads-path.test.ts", "src/components/Guide.tsx", '<h1 className="text-2xl font-semibold tracking-tight">{t.h1}</h1>', '<h1 className="text-2xl font-semibold tracking-tight">{t.h1}</h1><ins className="adsbygoogle" />', "쓰는 법 화면에 광고 자리를 넣으면 광고 경로 검사가 빨개져야 한다"],
  ["ad-script-everywhere", "test/ads-path.test.ts", "src/lib/ads-path.ts", "export const AD_PATHS: RegExp = /^(\\/en)?$/;", "export const AD_PATHS: RegExp = /^.*$/;", "광고 스크립트를 모든 경로에 허용하면 첫 화면 한정 검사가 빨개져야 한다"],
  ["no-send-editor", "test/no-send.test.ts", "public/open/index.html", "keepalive: true", 'keepalive: true\n        }); fetch("/api/leak", {\n          method: "POST", body: document.title', "편집기 계측 스크립트에 두 번째 전송을 넣으면 한 곳 검사가 빨개져야 한다"],
  ["track-body-leak", "test/no-send.test.ts", "src/lib/funnel.ts", "reached: step, lang: langNow()", "reached: step, text: document.title, lang: langNow()", "계측 본문에 글자 필드를 실으면 단계 이름만 검사가 빨개져야 한다"],
  ["editor-network-call", "test/no-send.test.ts", "upstream/src/utils/erdStep.js", 'window.dispatchEvent(new CustomEvent("erd:step", { detail: name }));', 'window.dispatchEvent(new CustomEvent("erd:step", { detail: name })); fetch("https://example.invalid/x");', "편집기 소스에 네트워크 호출을 넣으면 원격 요청 0 검사가 빨개져야 한다"],
  ["open-click-unwired", "test/telemetry-pair.test.ts", "src/components/OpenLink.tsx", 'onClick={() => track("open_click")}', "onClick={() => undefined}", "시작 링크에서 계측을 지우면 짝 검사가 빨개져야 한다"],
  ["return-every-open", "test/telemetry-pair.test.ts", "src/lib/visit.ts", 'if (last && last !== today) track("return_visit");', 'if (last) track("return_visit");', "같은 날에도 다시 옴을 세면 짝 검사가 빨개져야 한다"],
  ["export-step-unwired", "test/telemetry-pair.test.ts", "public/open/index.html", 'if (e && e.detail === "export") track("export");', "", "내보내기 사건을 듣는 줄을 지우면 export 단계 검사가 빨개져야 한다"],
  ["pressure-copy", "test/anti-dark.test.ts", "src/lib/i18n/ko.ts", 'openCta: "ERD 그리기 시작",', 'openCta: "오늘만 무료, ERD 그리기 시작",', "거짓 희소성 문구를 넣으면 anti-dark 검사가 빨개져야 한다"],
  ["agpl-ban-copy", "test/anti-dark.test.ts", "src/lib/i18n/ko.ts", 'openCta: "ERD 그리기 시작",', 'openCta: "ERD 그리기 시작 (복제 금지)",', "AGPL 과 맞서는 복제 금지 문구를 넣으면 항목 10 검사가 빨개져야 한다"],
  ["store-keys", "test/privacy-surface.test.ts", "src/lib/visit.ts", 'export const VISIT_KEY = "erd.lastVisit.v1";', 'export const VISIT_KEY = "erd.lastVisit.v1"; export const EXTRA_KEY = "erd.extra.v1";', "저장 열쇠를 하나 더 만들면 방침 일치 검사가 빨개져야 한다"],
  ["track-line-leak", "test/track-line.test.ts", "app/api/track/route.ts", 'probe=${isProbe ? "1" : "0"}', 'probe=${isProbe ? "1" : "0"} name=${String((body as Record<string, unknown>).name)}', "계측 줄에 본문 필드를 찍으면 줄 검사가 빨개져야 한다"],
  ["brand-in-title", "test/brand-zero.test.ts", "public/open/index.html", "<title>ERD 그리기 편집기</title>", "<title>drawDB</title>", "편집기 제목에 상류 이름을 쓰면 상표 0 검사가 빨개져야 한다"],
  ["license-drift", "test/licenses.test.ts", "public/LICENSE.txt", "Version 3, 19 November 2007", "Version 3, 19 November 2009", "공개 라이선스 파일이 원문과 달라지면 일치 검사가 빨개져야 한다"],
  ["secret-token", "test/no-secrets.test.ts", "NOTICE", "WITHOUT ANY WARRANTY", "WITHOUT ANY WARRANTY ghp_" + KEY36, "저장소에 토큰 꼴이 들어가면 비밀 0 검사가 빨개져야 한다"],
];
for (const [id, test, file, find, replace, why] of E) {
  try {
    const out = execFileSync("node", [T, "--id", `erd/${id}`, "--repo", "erd", "--test", test, "--file", file, "--find", find, "--replace", replace, "--why", why], { encoding: "utf8" });
    console.log(`${id}: ${out.trim().split("\n").pop()}`);
  } catch (e) {
    console.log(`${id}: 실패 ${String(e.stdout || e.message).slice(0, 300)}`);
  }
}
