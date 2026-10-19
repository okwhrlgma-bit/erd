/**
 * 도구들이 바라보는 **주소와 저장 위치** — 한 곳.
 *
 * ## ★왜 모았나 (2026-08-14)
 *
 * 계정이 막혀 자체 운영으로 옮긴 뒤, 스크립트 **열 개**가 여전히 `gambitry.vercel.app` 을
 * 기본값으로 들고 있었다. 그 주소는 지금 402 를 답한다. 그대로 두면 도구가 **죽은 주소를 훑고
 * 결과를 보고**한다 — 실패보다 나쁜 것은 엉뚱한 대상을 보고 통과했다고 말하는 것이다.
 *
 * 주소는 앞으로도 또 바뀐다(자체 도메인). 그러니 **바뀔 것을 한 곳에 둔다.**
 */
import { join } from "node:path";
import { existsSync, readFileSync } from "node:fs";

/**
 * 우리 사이트 주소.
 *
 * ★`NEXT_PUBLIC_SITE_URL` 을 먼저 본다 — 서버가 쓰는 값과 같은 이름이라 둘이 어긋날 수 없다.
 *   `GB_BASE` 는 도구를 다른 대상(로컬·프리뷰)에 잠깐 겨눌 때 쓴다.
 */
export const SITE =
  process.env.WC_BASE ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://erd.gwirae.com";

/** 명령줄에 URL 이 있으면 그것을 쓴다(기존 스크립트들의 관행을 유지한다). */
export function baseFromArgv(argv = process.argv) {
  return (argv.find((a) => a.startsWith("http")) ?? SITE).replace(/\/+$/, "");
}

/**
 * 저장 디렉터리 기본값.
 *
 * ## ★저장소를 저장소(repo) 안에 두지 않는다
 *
 * 처음에는 `<repo>/.data` 였다. `.gitignore` 에 넣어 두었으니 안전해 보이지만 **정반대다** —
 * `git clean -xfd` 는 **무시된 파일을 지우는 명령**이다. 개발 중에 흔히 쓰는 그 한 줄이
 * 순위표와 진행 중인 대국을 통째로 지운다. 백업도 없다.
 *
 * → 기본값을 저장소 **밖**으로 옮긴다. 코드와 데이터가 같은 나무에 있으면 언젠가 같이 잘린다.
 */
export function defaultStorageDir() {
  const base =
    process.env.LOCALAPPDATA ?? process.env.XDG_DATA_HOME ?? join(homeish(), ".local", "share");
  return join(base, "erd", "data");
}

function homeish() {
  return process.env.USERPROFILE ?? process.env.HOME ?? ".";
}

/** 실제로 쓸 저장 디렉터리. */
export const STORAGE_DIR = process.env.WC_STORAGE_DIR ?? defaultStorageDir();

/**
 * 서버가 남긴 로그를 읽는다 — **한 곳**.
 *
 * ## ★왜 생겼나 (2026-08-16 · 이 파일의 경고가 로그 쪽에서 그대로 재발했다)
 *
 * 위 주석은 "도구가 죽은 주소를 훑고 결과를 보고한다"를 경고하며 **주소와 저장 위치**를 모았다.
 * 그런데 **로그를 어디서 읽는가**는 안 모았고, 거기서 같은 사고가 났다:
 *
 *   `read-funnel.mjs` · `read-feedback.mjs` 가 여전히 `vercel logs` 를 부르고 있었다.
 *   우리는 2026-08-14 에 자체 운영으로 옮겼으므로 Vercel 에는 아무것도 없다.
 *
 * 그래서 퍼널 도구가 **"이 로그 창에 퍼널 기록이 없다 … 사용자가 실제로 0명일 수도 있다"** 고
 * 답했다. 정직해 보이는 문장이지만 **틀린 안내**다 — 실제로는 `host.log` 에 39건이 있었다.
 * 없는 것이 아니라 **엉뚱한 곳을 본 것**이고, 이건 실패보다 나쁘다(0 이라고 믿게 만든다).
 *
 * ★이음매를 옮길 때 소비처를 다 세지 못하면 남는 쪽은 조용히 거짓을 말한다.
 *   그래서 읽는 경로도 여기 하나로 모은다. 다음에 로그 위치가 바뀌면 이 함수만 고치면 된다.
 *
 * @param {number} maxLines 뒤에서부터 몇 줄까지 볼지(로그는 계속 자란다)
 * @returns {string[]} 로그 줄. 파일이 없으면 빈 배열(호출부가 "없다"와 "못 읽었다"를 구분하게).
 */
export function readServerLog(maxLines = 4000, keep = null) {
  const path = join(STORAGE_DIR, "host.log");
  if (!existsSync(path)) return [];
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  /*
   * ★거르고 나서 자른다(2026-08-23 · 운영 각도 실측).
   *
   * 전에는 **모든 로그 줄**에서 창을 자른 뒤 그 안에서 필요한 줄을 골랐다. 그런데 실측하니
   * 옛지도밟기 로그 2,451줄 중 1,396줄이 **우리 확인 호출**이었다(57%). 서버 잡음까지 더하면,
   * 파일이 창을 넘는 날 밀려나는 것은 우리가 만든 줄이 아니라 **손님 데이터**다.
   *
   * 창의 목적은 메모리와 시간을 묶는 것이지 무엇을 세느냐를 정하는 것이 아니다.
   * ★오늘은 파일이 창보다 작아 숫자가 안 바뀐다 — 바뀌는 날이 곧 이 수리가 값을 하는 날이다.
   */
  const wanted = typeof keep === "function" ? lines.filter(keep) : lines;
  return wanted.slice(-maxLines);
}

/**
 * **잘랐는가, 전부 읽었는가.** 판독기가 사람에게 그 차이를 말해야 한다.
 *
 * ## 왜 (2026-08-22 · 운영 각도에서 알았다)
 *
 * 판독기 머리말은 "로그는 최근 창이지 누적이 아니다"라고 경고한다. 그런데 **지금은 반대다** —
 * 파일이 창(4000·8000줄)보다 작아서 사실상 **전부**를 읽고 있다. 즉 지금 나오는 숫자는 누적이다.
 *
 * 그리고 로그에 **회전이 없어** 파일은 계속 자란다. 어느 날 창을 넘기는 순간
 * **아무 예고 없이** "누적"에서 "부분 창"으로 바뀐다 — 그날 우리는 같은 화면을 보면서
 * 다른 뜻의 숫자를 읽게 된다.
 *
 * ★그래서 상태를 **말하게** 만든다. 경고 문구를 늘리는 것으로는 못 막는다(오늘 그 실증이 여럿이다).
 */
export function logWindow(maxLines = 4000, keep = null) {
  const path = join(STORAGE_DIR, "host.log");
  if (!existsSync(path)) return { exists: false, total: 0, read: 0, truncated: false };
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  /*
   * ★판독과 **같은 줄**을 센다(2026-08-23). `readServerLog` 를 "거르고 나서 자르기"로 바꿨는데
   *   여기가 파일 전체 줄로 판정하면 둘이 갈린다 — 파일 9,000줄에 FUNNEL 3,000줄이면
   *   실제로는 전부 읽었는데 화면은 "잘렸다"고 말하게 된다.
   *   판정을 두 곳에 적으면 한쪽이 뒤처진다(오늘 이 클래스를 여러 번 잡았다).
   */
  const wanted = typeof keep === "function" ? lines.filter(keep) : lines;
  const total = wanted.length;
  return { exists: true, total, read: Math.min(total, maxLines), truncated: total > maxLines };
}

/** 로그 파일 경로(안내 문구에 쓴다 — 어디를 봤는지 사람에게 알려야 오독이 안 생긴다). */
export function serverLogPath() {
  return join(STORAGE_DIR, "host.log");
}
