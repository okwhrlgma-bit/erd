#!/usr/bin/env node
// 290호 ERD 그리기 e2e: 첫 화면, 쓰는 법, 출처, 방침(두 언어), 시작 링크, /open/ 편집기 기동, 외부 요청 0,
// 테이블 추가와 자동 저장 표시, PNG / DBML / SQL / PDF 내보내기 클릭, 정보 창(ko, en), /LICENSE.txt, 배포 커밋.
// 모든 방문 ?probe=1. 사용: node e2e/live.mjs [BASE] (기본 = 라이브)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

function onFatal(e) {
  const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
  console.log(`NG 스위트 중단 - ${msg.slice(0, 160)}`);
  process.exit(1);
}
process.on("uncaughtException", onFatal);
process.on("unhandledRejection", onFatal);

const BASE = (process.argv[2] ?? "https://erd.gwirae.com").replace(/\/$/, "");
const SHOTS = process.env.SHOTS ?? "C:/Users/okwhr/erd-shots";
mkdirSync(SHOTS, { recursive: true });
const results = [];
const check = (name, ok, detail = "") => {
  results.push([name, ok]);
  console.log((ok ? "OK " : "NG ") + name + (ok || !detail ? "" : ` - ${String(detail).slice(0, 160)}`));
};
const local = /127\.0\.0\.1|localhost/.test(BASE);

const browser = await chromium.launch({ args: ["--no-proxy-server"] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: "ko-KR", acceptDownloads: true });
const page = await ctx.newPage();
const errs = [];
let stage = "시작";
page.on("pageerror", (e) => errs.push(`[${stage}] ${String(e)}`));
const posts = [];
page.on("requestfinished", (r) => { if (r.method() === "POST") posts.push(r.url()); });
const origin = new URL(BASE).origin;
const external = [];
page.on("request", (r) => { if (!r.url().startsWith(origin) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });

// 1) 정적 쪽
for (const [path, must] of [
  ["/?probe=1", "ERD 그리기 시작"],
  ["/en?probe=1", "Start drawing"],
  ["/guide?probe=1", "데이터베이스"],
  ["/en/guide?probe=1", "database"],
  ["/credits?probe=1", "AGPL"],
  ["/en/credits?probe=1", "AGPL"],
  ["/privacy?probe=1", "localStorage"],
  ["/en/privacy?probe=1", "localStorage"],
]) {
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  const text = await page.locator("body").innerText();
  check(`${path} 200 + 문구`, res?.status() === 200 && text.includes(must), `${res?.status()} ${must}`);
}

// 2) 법 고지 파일
for (const p of ["/LICENSE.txt", "/open/NOTICE", "/open/CHANGES.md"]) {
  const r = await ctx.request.get(BASE + p);
  const body = await r.text();
  check(`${p} 200`, r.status() === 200 && body.length > 500, r.status());
  if (p === "/LICENSE.txt") check("LICENSE.txt 는 AGPL-3.0 원문", /GNU AFFERO GENERAL PUBLIC LICENSE/.test(body));
}

// 3) 첫 화면에서 시작 -> 편집기
await page.goto(BASE + "/?probe=1", { waitUntil: "networkidle" });
await page.evaluate(() => sessionStorage.clear());
await page.goto(BASE + "/?probe=1", { waitUntil: "networkidle" });
const link = page.locator('a[href="/open/#/editor"]');
check("첫 화면에 시작 링크", (await link.count()) >= 1, await link.count());
const arrived = (await page.evaluate(() => JSON.parse(sessionStorage.getItem("erd.funnel.v1") || "[]"))).includes("arrive");
check("도착 계측이 나갔다", arrived);
await link.first().click();
await page.waitForTimeout(1500);
// next start 는 /open/ 을 /open 으로 돌려 404 를 줄 수 있다(Workers 정적 자산은 /open/ 을 index.html 로 준다). 로컬에서는 파일 주소로 간다.
if (local) await page.goto(BASE + "/open/index.html?probe=1#/editor", { waitUntil: "domcontentloaded" });
else await page.waitForURL("**/open/**", { timeout: 20000 });
// 광고는 첫 화면에만 있다. 편집기에 들어온 뒤의 외부 요청과 오류만 센다.
external.length = 0;
errs.length = 0;
await page.waitForFunction(() => JSON.parse(sessionStorage.getItem("erd.funnel.v1") || "[]").includes("editor_ready"), null, { timeout: 90000 });
check("편집기가 떴다(editor_ready)", true);
errs.length = 0; // 첫 화면 광고 스크립트가 오프라인에서 늦게 내는 오류는 편집기 것이 아니다
check("한국어 브라우저면 한국어로 열린다", (await page.locator("body").innerText()).includes("테이블 추가"));

stage = "// 4) DB 고르기";
// 4) DB 고르기, 테이블 추가, 자동 저장 표시
const modal = page.locator(".semi-modal");
await page.getByText("일반", { exact: true }).first().click();
await modal.locator("button", { hasText: "확인" }).last().click();
await page.waitForTimeout(500);
await page.getByText("테이블 추가").first().click();
await page.waitForTimeout(900);
const body1 = await page.locator("body").innerText();
check("테이블 (1) 이 올라갔다", /테이블 \(1\)/.test(body1));
check("id 열이 생겼다", /\bid\b/.test(body1));
check("마지막 저장 시각이 나온다", /마지막 저장/.test(body1));
await page.screenshot({ path: `${SHOTS}/erd-table.png` });
check("first_input 계측", (await page.evaluate(() => JSON.parse(sessionStorage.getItem("erd.funnel.v1") || "[]"))).includes("first_input"));

stage = "// 5) 내보내기 클";
// 5) 내보내기 클릭: 안내 글이 말한 것만 확인한다
async function openExport(label) {
  await page.getByText("파일", { exact: true }).first().hover();
  await page.getByText("내보내기", { exact: true }).first().hover();
  await page.getByText(label, { exact: true }).first().click();
}
async function downloadVia(label) {
  await openExport(label);
  await page.waitForTimeout(1200);
  const btn = page.locator(".semi-modal button", { hasText: "내보내기" }).last();
  await btn.waitFor({ timeout: 10000 });
  const [d] = await Promise.all([page.waitForEvent("download", { timeout: 40000 }), btn.click()]);
  return d.suggestedFilename();
}
for (const [label, ext] of [["PNG", /\.png$/i], ["DBML", /\.dbml$/i]]) {
  try {
    const name = await downloadVia(label);
    check(`${label} 내보내기 파일이 받아진다`, ext.test(name), name);
  } catch (e) {
    check(`${label} 내보내기 파일이 받아진다`, false, e.message.split("\n")[0]);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
}
stage = "// PDF 는 창 없";
// PDF 는 창 없이 바로 받아진다.
try {
  await page.getByText("파일", { exact: true }).first().hover();
  await page.getByText("내보내기", { exact: true }).first().hover();
  const [d] = await Promise.all([page.waitForEvent("download", { timeout: 40000 }), page.getByText("PDF", { exact: true }).first().click()]);
  check("PDF 내보내기 파일이 받아진다", /\.pdf$/i.test(d.suggestedFilename()), d.suggestedFilename());
} catch (e) {
  check("PDF 내보내기 파일이 받아진다", false, e.message.split("\n")[0]);
}
await page.mouse.click(700, 300);
await page.waitForTimeout(500);
stage = "// SQL 로 내보내";
// SQL 로 내보내기는 파일 메뉴의 하위 메뉴다. 첫 항목(MySQL)을 누르면 코드 창이 뜬다.
try {
  await page.getByText("파일", { exact: true }).first().hover();
  await page.getByText("SQL로 내보내기", { exact: true }).first().hover();
  await page.waitForTimeout(500);
  await page.getByText("MySQL", { exact: true }).last().click();
  await page.waitForTimeout(1200);
  const t = await page.locator(".semi-modal").last().innerText({ timeout: 8000 });
  check("SQL로 내보내기 창에 CREATE TABLE 이 나온다", /CREATE\W+TABLE/i.test(t), t.slice(0, 80));
} catch (e) {
  check("SQL로 내보내기 창에 CREATE TABLE 이 나온다", false, e.message.split("\n")[0]);
}
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const steps = await page.evaluate(() => JSON.parse(sessionStorage.getItem("erd.funnel.v1") || "[]"));
check("내보내기 계측(export)이 나갔다", steps.includes("export"), JSON.stringify(steps));

stage = "// 다시 열어도";
// 다시 열어도 그린 테이블이 남아 있다(자동 저장 확인). 열린 창도 함께 정리된다.
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector("text=테이블 추가", { timeout: 60000 });
await page.waitForTimeout(1200);
check("다시 열어도 테이블 (1) 이 남아 있다", /테이블 \(1\)/.test(await page.locator("body").innerText()));

stage = "// 6) 정보와";
// 6) 정보와 라이선스 창 (ko)
async function openAbout(helpLabel) {
  await page.getByText(helpLabel, { exact: true }).first().hover();
  await page.waitForTimeout(300);
  await page.locator(".semi-dropdown-menu .semi-dropdown-item").last().click();
  await page.waitForTimeout(600);
  return await page.locator(".semi-modal").last().innerText();
}
const aboutKo = await openAbout("도움말");
check("정보 창(ko): 원저작자 + AGPL-3.0", /drawdb-io\/drawdb/.test(aboutKo) && /AGPL/.test(aboutKo), aboutKo.slice(0, 100));
check("정보 창(ko): 보증 없음", /보증/.test(aboutKo));
check("정보 창(ko): /LICENSE.txt 링크", (await page.locator('.semi-modal a[href$="/LICENSE.txt"]').count()) >= 1);
check("정보 창(ko): 소스 링크", (await page.locator('.semi-modal a[href="https://github.com/okwhrlgma-bit/erd"]').count()) >= 1);
const hash = await page.locator('meta[name="erd-commit"]').getAttribute("content");
check("정보 창(ko): 배포 커밋 해시", !!hash && aboutKo.includes(hash), hash);
await page.screenshot({ path: `${SHOTS}/erd-about-ko.png` });
await page.keyboard.press("Escape");

// 7) 영어 브라우저
const ctxEn = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: "en-US" });
const pe = await ctxEn.newPage();
await pe.goto(BASE + "/open/index.html?probe=1#/editor", { waitUntil: "domcontentloaded" });
await pe.waitForSelector("text=Add table", { timeout: 60000 });
check("영어 브라우저면 영어로 열린다", true);
const confirmEn = pe.locator(".semi-modal button", { hasText: "Confirm" }).last();
await confirmEn.waitFor({ timeout: 20000 });
await pe.getByText("Generic", { exact: true }).first().click();
await confirmEn.click(); // 데이터베이스 고르기 창을 기본값으로 닫는다
await pe.waitForTimeout(600);
await pe.getByText("Help", { exact: true }).first().hover();
await pe.waitForTimeout(300);
await pe.locator(".semi-dropdown-menu .semi-dropdown-item").last().click();
await pe.waitForTimeout(600);
const aboutEn = await pe.locator(".semi-modal").last().innerText();
check("정보 창(en): 원저작자 + AGPL + warranty", /drawdb-io\/drawdb/.test(aboutEn) && /AGPL/.test(aboutEn) && /warranty/i.test(aboutEn), aboutEn.slice(0, 100));
await ctxEn.close();

// 8) 편집기 안 요청 0, 광고 0, 저장소 열쇠와 전송 목록
check("외부 요청 0", external.length === 0, external.slice(0, 3).join(","));
const bad = posts.filter((u) => !u.endsWith("/api/track"));
check("POST 는 /api/track 뿐", bad.length === 0, bad.join(","));
check("편집기 안에 광고 자리 0", (await page.locator("ins.adsbygoogle").count()) === 0);
check("페이지 오류 0", errs.length === 0, errs[0]);
console.log("localStorage keys:", JSON.stringify(await page.evaluate(() => Object.keys(localStorage).sort())));
console.log(local ? "NOTE 커밋 일치(GitHub)는 푸시 뒤 메인이 확인한다" : `NOTE 배포 커밋 ${hash}`);

await browser.close();
const ng = results.filter(([, ok]) => !ok).length;
console.log(`\n${results.length - ng}/${results.length} 통과`);
process.exit(ng ? 1 : 0);
