#!/usr/bin/env node
/**
 * 라이브 퍼널 읽기 — Gambitry 정본 이식. 사용: node scripts/read-funnel.mjs
 *
 * 읽는 규율(오독 방지·원본 주석 압축):
 * - 로그는 최근 창이지 누적이 아니다 — "총 방문 N명"이라 말하지 않는다.
 * - n<30 이면 전환율(%) 대신 원시 개수만 보여준다(작은 표본의 %는 거짓말).
 * - probe=1(확인용 호출)은 본 집계에서 뺀다 — 우리가 만든 숫자를 우리가 읽지 않게.
 */
import { readServerLog, serverLogPath, logWindow } from "./lib/host.mjs";
import { funnelSteps } from "./lib/funnel-steps.mjs";

/*
 * ★판독기와 발신부는 **짝이다**(2026-08-21). `read_page` 를 화면에 배선하면서 여기를 안 고치면
 *   서버 로그에는 찍히는데 **아무도 안 읽는다** — 오늘 형제 앱에서 정확히 그 상태를 잡았다
 *   (유입 라벨이 브라우저 밖으로 나간 적이 없어 판독기가 영원히 "미기록"만 찍던 것).
 * ★`read_page` 는 퍼널 순서상 `arrive` 다음이 아니라 **다른 축**이다(검색 유입의 착지점).
 *   그래서 단계 배열에 끼워 넣지 않고 아래에서 따로 센다 — 끼워 넣으면 전환율이 거짓이 된다.
 *
 * ★2026-08-22 — 그 짝을 **부탁이 아니라 기제로** 바꿨다.
 *   여기 단계 배열이 손으로 적혀 있었고, 그래서 정본에 있는 `share_click` 이 이 판독기의
 *   어느 칸에도 없어 **조용히 버려지고 있었다**(정확히 위 주석이 경고하던 그 상태였다).
 *   이제 정본을 파싱해 오고, 옆 축으로 뺀 것 말고는 **전부** 깊이 축에 들어간다.
 */
const CANON = funnelSteps();
/* 이 앱은 옆 축이 없다 — arrive → open_click → editor_ready → first_input → export → return_visit → share_click 이 전부 깊이 축이다(share_click 은 정본 순서대로).
 * 옆 축이 생기면(예: 소개 페이지 착지) 여기 넣는다 — 빈 배열은 아래 가드와 출력이 그대로 견딘다. */
const SIDE_STEPS = [];
const STEPS = CANON.filter((s) => !SIDE_STEPS.includes(s));
for (const s of SIDE_STEPS) {
  if (!CANON.includes(s)) throw new Error(`옆 축 '${s}' 이 정본에 없다 — 이름이 바뀌었거나 지워졌다.`);
}
const MIN_SAMPLE = 30;

// ★창을 `[FUNNEL]` 줄에 대해 잡는다 — 서버 잡음과 프로브가 손님 줄을 밀어내지 않게(lib/host.mjs).
const lines = readServerLog(8000, (l) => l.includes("[FUNNEL]"));
if (lines.length === 0) {
  console.log(`[FUNNEL] 줄 0건 — 로그(${serverLogPath()})가 짧거나 아직 방문이 없다.`);
  console.log("0건 ≠ 결함: 배선 직후엔 표본이 없는 것이 정상이다(위음성 의심 시 probe 로 경로 확인).");
  process.exit(0);
}

/*
 * ★**언제부터 언제까지인가**(2026-08-23 이식 · Gambitry 정본과 같은 형태).
 *   필드가 새로 생기면 옛 줄과 새 줄이 한 바구니에 섞이는데, 시각이 없으면 가를 수가 없다.
 *   `t=` 는 2026-08-23 부터 붙는다 — 그 앞 줄이 몇 개인지 **숫자로** 말한다.
 *   "옛 줄이 섞여 있을 수 있다"는 문구로는 아무도 안 멈춘다.
 */
{
  const stamps = lines.map((l) => l.match(/\bt=(\S+)/)?.[1]).filter(Boolean);
  const noStamp = lines.length - stamps.length;
  if (stamps.length > 0) console.log(`\uCC3D: ${stamps[0]} ~ ${stamps[stamps.length - 1]}`);
  if (noStamp > 0) {
    console.log(
      `\u2605\uC2DC\uAC01 \uC5C6\uB294 \uC904 ${noStamp}\uAC74 \u2014 2026-08-23 \uC774\uC804 \uAE30\uB85D\uC774\uB2E4. ` +
        `**\uB098\uC911\uC5D0 \uC0DD\uAE34 \uD544\uB4DC\uB85C \uC774 \uC904\uB4E4\uC744 \uAC00\uB974\uC9C0 \uB9C8\uB77C**(Gambitry \uC5D0\uC11C \uC2E4\uC81C\uB85C \uD2C0\uB838\uB2E4).`,
    );
  }
  /*
   * ★**고지로 끝내지 않는다**(2026-08-23 · 같은 날 배운 것을 같은 날 적용).
   *
   *   위 문구는 "옛 줄이 섞여 있다"고 **말만** 한다. 그런데 같은 날 형제 앱(Gambitry)에서
   *   정확히 그 이유로 판정이 무너졌다 — 실사용으로 보이던 126줄 중 111줄이 시각이 없어
   *   우리 실행과 손님을 가릴 수 없었고, 가릴 수 있는 15줄 중 14줄이 자동화였다.
   *
   * ★오늘 같은 클래스를 세 번 잡았다(busy 흡수율 · PWA 전환 · TTFT 버퍼).
   *   전부 "읽는 사람에게 확인하라고 적어 두고 판정식은 확인하지 않는" 형태였는데,
   *   그러고서 나는 **같은 것을 이 파일에 또 심었다.**
   *
   * ★깨끗한 표본이 하나도 없으면 아래 수는 실사용 판정에 못 쓴다 — 그 사실을 말한다.
   *   수치를 숨기지는 않는다(숨기는 것과 판정에 안 쓰는 것은 다르다).
   */
  if (stamps.length === 0) {
    console.log("★깨끗한 표본 0 — 아래 수는 전부 시각 없는 구간이라 **실사용 판정에 못 쓴다.**");
  }
}

const counts = new Map(STEPS.map((s) => [s, 0]));
const interest = new Map();
const side = new Map(); // 다른 축(읽을거리) — 퍼널 순서에 안 넣는다
let interestProbes = 0;
const byLang = new Map();
const bySrc = new Map(); // arrive 유입 소스(5호 복제분 — 6호도 from= 파라미터 쓰면 갈린다)
let probes = 0;
for (const l of lines) {
  const step = /step=(\S+)/.exec(l)?.[1];
  const lang = /lang=(\S+)/.exec(l)?.[1] ?? "-";
  const probe = /probe=1/.test(l);
  // 이 앱은 유료 후보 관심(interest) 단계가 없다 — 서버가 400 으로 거절한다(app/api/track/route.ts).
  // 다른 축(읽을거리 착지) — 퍼널 전환율에 섞지 않고 따로 센다.
  if (SIDE_STEPS.includes(step)) {
    if (probe) probes++;
    else side.set(step, (side.get(step) ?? 0) + 1);
    continue;
  }
  if (!STEPS.includes(step)) continue;
  if (probe) {
    probes++;
    continue;
  }
  counts.set(step, counts.get(step) + 1);
  /*
   * ★이 단계 한정은 **여기서는 옳다**(2026-08-21 전수 확인 · 형제 앱과 반대다).
   *
   * 이 앱의 클라이언트는 `send({ reached: step })` 을 **단계마다 한 번씩** 보낸다
   * (`src/lib/funnel.ts` · 세션당 단계별 1회). 그래서 세션 하나당 `arrive` 줄이 정확히 하나이고,
   * 여기서 세면 분모가 곧 "도착한 사람 수"가 된다.
   *
   * ★**Gambitry 는 구조가 달라 같은 코드가 결함이었다**: 거기는 세션당 **요약 한 줄**이고
   *   그 줄은 가장 깊은 단계만 담는다 → `step==="arrive"` 줄은 "도착만 하고 나간 사람"뿐이라
   *   **이탈자의 유입 채널만** 세고 있었다(실측 arrive 108 vs 소스 합 8).
   *   그 수리를 이 파일로 그대로 옮기면 **깊이 들어간 손님이 단계 수만큼 중복 집계**된다.
   *   판정 근거는 형태가 아니라 보내는 쪽의 계약이다 — 옮기기 전에 emitter 를 읽는다.
   */
  if (step === "arrive") {
    const s = /src=(\S+)/.exec(l)?.[1] ?? "direct";
    bySrc.set(s, (bySrc.get(s) ?? 0) + 1);
  }
  if (!byLang.has(lang)) byLang.set(lang, new Map(STEPS.map((s) => [s, 0])));
  byLang.get(lang).set(step, byLang.get(lang).get(step) + 1);
}

/*
 * ★**창 상태를 먼저 말한다**(2026-08-22). 파일이 창보다 작으면 이 숫자는 사실상 **누적**이고,
 *   넘어서는 순간 예고 없이 **부분 창**이 된다 — 같은 화면이 다른 뜻이 되는 자리다.
 *   로그에 회전이 없어서 그 전환은 반드시 온다.
 */
{
  const w = logWindow(8000, (l) => l.includes("[FUNNEL]"));
  console.log(
    w.truncated
      ? `계측 줄 ${w.total} 중 **최근 ${w.read}줄만** 읽었다 — 그 앞은 안 봤다(부분 창).`
      : `계측 줄 ${w.total}개를 **전부** 읽었다 — 아래 숫자는 처음부터의 누적이다.`,
  );
}
console.log(`퍼널 (probe ${probes}건 제외)`);
/*
 * ★probe 표식 경계를 함께 말한다 (2026-09-05 · PROBE_MARK_FIX).
 *   probe 표식을 제대로 붙이기 시작한 날이 2026-09-02 다. 그 이전 줄에는 **우리 방문이 표시 없이**
 *   섞여 있어서, 이 창의 숫자를 실사용으로 읽으면 부풀린다. 실제로 그렇게 읽어 "도착 29 대 완료 1"
 *   이라 단정한 적이 있고, 표식이 확실한 창으로는 7세션이었다(아무것도 못 단정하는 크기).
 *   ★실사용 크기는 `usage-digest`(표식 확실 창)로 본다. 이 도구는 **그 앱 안에서 어디서 멈추는가**를 본다.
 */
{
  const beforeMark = lines.filter((l) => {
    const m = /t=(\d{4}-\d{2}-\d{2})/.exec(l);
    return m ? m[1] < "2026-09-02" : true;
  }).length;
  if (beforeMark > 0) {
    console.log(`  \u2605\uc774 \ucc3d\uc758 ${beforeMark}\uc904\uc740 probe \ud45c\uc2dd \uc774\uc804(2026-09-02 \uc774\uc804)\uc774\ub77c \uc6b0\ub9ac \ubc29\ubb38\uc774 \uc11e\uc5ec \uc788\uc744 \uc218 \uc788\ub2e4.`);
    console.log("     \uc2e4\uc0ac\uc6a9 \ud06c\uae30\ub294 usage-digest \ub85c \ubcf8\ub2e4 \u2014 \uc5ec\uae30 \uc22b\uc790\ub294 \uc5b4\ub514\uc11c \uba48\ucd94\ub294\uac00\ub97c \ubcf4\ub294 \uc6a9\ub3c4\ub2e4.");
  }
}

const arrive = counts.get("arrive");
/*
 * ★불변식: 유입 소스의 합은 **도착 수와 정확히 같아야 한다**(주석은 재발을 못 막으므로 기계로 둔다).
 *   위 가드를 잘못 넓히면(예: Gambitry 수리를 그대로 옮기면) 한 세션이 단계 수만큼 세어져 합이 넘친다.
 *   반대로 좁히면 모자란다. 둘 다 "어느 채널이 먹혔나"를 조용히 틀리게 만든다.
 */
{
  let srcTotal = 0;
  for (const n of bySrc.values()) srcTotal += n;
  if (srcTotal !== arrive) {
    console.log(`\n⚠ 소스 합 ${srcTotal} ≠ 도착 ${arrive} — 유입 집계의 분모가 어긋났다.`);
    console.log("   보내는 쪽(src/lib/funnel.ts)이 단계마다 한 줄을 보내는지 먼저 읽는다.");
    console.log("   형제 앱 Gambitry 는 세션당 요약 한 줄이라 계약이 다르다 — 형태를 그대로 옮기지 않는다.");
  }
}

for (const s of STEPS) {
  const n = counts.get(s);
  const rate = arrive >= MIN_SAMPLE ? ` (${Math.round((n / arrive) * 100)}%)` : "";
  console.log(`  ${s.padEnd(13)} ${n}${rate}`);
}
if (arrive < MIN_SAMPLE) console.log(`  ★n=${arrive} < ${MIN_SAMPLE} — 전환율은 표본이 쌓인 뒤에만 말한다.`);

if (bySrc.size > 0) {
  console.log("\n유입 소스(arrive)");
  for (const [s, n] of [...bySrc.entries()].sort((a, b) => b[1] - a[1])) console.log("  " + s.padEnd(8) + " " + n);
}


if (byLang.size > 0) {
  console.log("\n언어별");
  for (const [lang, m] of [...byLang.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  [${lang}] ` + STEPS.map((s) => `${s}=${m.get(s)}`).join(" · "));
  }
}

/*
 * 읽을거리 착지 — **다른 축이라 따로 낸다.** 이 앱의 승부처가 격자가 아니라 깊은 설명이라는
 * 판단(2026-08-21)이 맞았는지는 이 줄로만 알 수 있다. 0 이면 "아직 표본 없음"이지 부재의 증거가 아니다.
 */
/*
 * ★2026-08-22 — 여기도 **이름을 손으로 적고 있었다.** 옆 축을 전부 더해 놓고 라벨은 `read_page`
 *   하나로 찍었다. `today_page` 를 배선하자마자 그 줄에 **섞여 들어가 이름 없이 사라졌다**
 *   (골든이 그걸 잡았다). 위에서 깊이 축을 정본에서 파생하게 고치고도 옆 축은 그대로 뒀던 것이다.
 *   목록은 대상과 함께 자라야 한다 — 오늘만 이 클래스가 세 번째다.
 */
{
  if (SIDE_STEPS.length > 0) console.log("\n다른 축(퍼널 전환율에 안 섞는다)");
  for (const s of SIDE_STEPS) {
    const n = side.get(s) ?? 0;
    console.log(`  ${s.padEnd(12)} ${n}${n === 0 ? "   ★0건 = 표본 없음(부재 증거 아님)" : ""}`);
  }
}

console.log("\n★자기 방문 주의: 라이브 실물 점검(브라우저로 직접 열기)은 probe 가 아니라 본 집계에 섞인다.");
console.log("  배포·점검 직후의 한 자릿수 arrive 는 우리 방문일 수 있다 — 실사용자 신호로 읽지 않는다.");
console.log("  점검할 때는 주소에 ?probe=1 을 붙인다(그러면 분리 집계된다).");
