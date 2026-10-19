/**
 * 퍼널 계측 — Gambitry 정본 이식(결정 근거는 그쪽 funnel.ts·track/route.ts 주석).
 * ★식별자 무수집: IP·UA·쿠키·Referer 를 읽지 않는다. ★안내문 글, 빈칸 값, 주소 조각은 보내지 않는다 —
 *   서버가 받는 것은 단계 이름 하나뿐이다.
 *
 * 순서가 의미를 가진다 - 인덱스가 곧 깊이다(끝에 끼워 넣으면 전환율이 거짓이 된다).
 * 돈으로 가는 길: arrive -> open_click -> editor_ready -> first_input -> export(첫 지표) -> return_visit(재방문).
 * 광고는 첫 화면 한 자리뿐이다(편집기 /open/ 과 안내문 0).
 * editor_ready, first_input, export 는 편집기 정적 페이지(public/open/index.html)의 인라인 스크립트가 같은 키로 보낸다.
 */
export const FUNNEL_STEPS = [
  /** 첫 화면을 열었다. */
  "arrive",
  /** ERD 그리기 시작 링크를 눌렀다. */
  "open_click",
  /** 편집기가 떠서 시작했다. */
  "editor_ready",
  /** 편집기에서 첫 입력(클릭이나 키)을 했다. 무엇을 그렸는지는 싣지 않는다. */
  "first_input",
  /** 파일로 내보냈다(PNG, PDF 등). 이 앱의 첫 지표. 내용은 싣지 않는다. */
  "export",
  /** 다른 날 왔던 이 기기가 다시 열었다(기기 안에 마지막 날짜만 적는다). */
  "return_visit",
  /** 링크를 보냈다 - 공유가 실제로 일어나는지 본다(추측 대신 계측). */
  "share_click",
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

const KEY = "erd.funnel.v1";

/*
 * 유입 라벨 — 주소의 ?src= 를 읽고, 없으면 앞선 페이지의 **도메인**만 본다(2026-08-30).
 * 경로와 질의는 안 보고, 우리 도메인에서 온 이동은 유입이 아니라 뺀다.
 * 형태 검사는 서버와 같아야 한다 — 한쪽만 넓히면 보내는 값과 받는 값이 조용히 어긋난다.
 */
const SRC_RE = /^[a-z][a-z0-9.-]{0,31}$/;

function srcLabel(): string {
  try {
    // 공유 링크는 ?from=share 를 붙인다 — src 만 읽으면 공유 방문이 direct 로 찍힌다(2026-09-06 · share-src-parity-lint).
    const sp = new URLSearchParams(location.search);
    const q = sp.get("src") ?? sp.get("from") ?? "";
    if (SRC_RE.test(q)) return q;
    const ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
    if (ref && ref !== location.hostname && SRC_RE.test(ref)) return ref;
    return "direct";
  } catch {
    return "direct";
  }
}

/** 화면 언어 — 경로가 정한다(/en 아래면 en). */
function langNow(): "ko" | "en" {
  try {
    return location.pathname === "/en" || location.pathname.startsWith("/en/") ? "en" : "ko";
  } catch {
    return "ko";
  }
}

/**
 * 단계 도달을 보낸다 — 세션당 단계별 1회(중복은 로컬에서 걸러 서버 잡음을 줄인다).
 * 실패는 조용히 삼킨다: 계측이 죽어도 화면은 산다.
 */
export function track(step: FunnelStep): void {
  try {
    const seen = new Set<string>(JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[]);
    if (seen.has(step)) return;
    seen.add(step);
    sessionStorage.setItem(KEY, JSON.stringify([...seen]));
    const probe = new URLSearchParams(location.search).get("probe") === "1";
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reached: step, lang: langNow(), probe, src: srcLabel() }),
      keepalive: true,
    });
  } catch {
    /* 계측 실패는 화면에 영향 없음 */
  }
}
