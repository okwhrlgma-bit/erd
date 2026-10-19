import { after } from "next/server"; // track-relay-after — 중계는 응답 뒤(2026-09-22)
import { NextResponse } from "next/server";
import { FUNNEL_STEPS } from "@/src/lib/funnel";

// track-relay-v1 — Workers 에서는 console.log 가 host.log 로 안 가므로 허브가 대신 적는다(2026-09-22). 로컬 Node 에서는 아무것도 안 한다.
const RELAY_APP = "erd";
const RELAY_URL = "https://gwirae.com/api/relay";
async function relay(line: string): Promise<void> {
  const onWorkers = typeof navigator !== "undefined" && /Cloudflare-Workers/.test(String(navigator.userAgent ?? ""));
  if (!onWorkers) return;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 1500);
  try {
    await fetch(RELAY_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ app: RELAY_APP, line }), signal: ac.signal });
  } catch { /* 계측은 손님 요청을 막지 않는다 */ } finally { clearTimeout(t); }
}

/**
 * 퍼널 요약 수집 — Gambitry 정본 이식. 저장소 0: 서버 로그 한 줄 → 허브 중계 → scripts/read-funnel.mjs 가 집계한다.
 *
 * ★한 사람을 특정할 방법이 구조적으로 없다: IP·UA·쿠키·Referer 를 읽지 않고, 클라이언트가 단계 이름 하나만 보낸다
 *   (안내문 글 · 빈칸 값은 애초에 안 실린다 — funnel.ts).
 * ★남용 방어 = 입력을 좁힌다: 화이트리스트 단계 + 화이트리스트 lang 만 받는다.
 * ★날짜는 KST 로, 연월일까지만 찍는다(시각을 실으면 "한 줄과 다른 줄을 이을 방법이 없다"는 고지가 약해진다).
 */
function kstDate(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }

  const { reached, lang, probe, src } = (body ?? {}) as Record<string, unknown>;

  if (typeof reached !== "string" || !(FUNNEL_STEPS as readonly string[]).includes(reached)) {
    return NextResponse.json({ error: "모르는 단계" }, { status: 400 });
  }
  const depth = FUNNEL_STEPS.indexOf(reached as (typeof FUNNEL_STEPS)[number]);
  const seenLang = lang === "ko" || lang === "en" ? lang : "-";

  // ★probe 태그 — 확인용 호출이 실사용 집계를 오염시키지 않게 라벨만 붙인다(지우지 않는다).
  // ★클라이언트와 **같은 형태 검사**를 쓴다. 한쪽만 넓히면 보내는 값과 받는 값이 조용히 어긋난다.
  const seenSrc = typeof src === "string" && /^[a-z][a-z0-9.-]{0,31}$/.test(src) ? src : "direct";
  const isProbe =
    req.headers.get("x-gil-probe") === "1" || req.headers.get("x-gwirae-probe") === "1" || probe === true;

  const line = `[FUNNEL] t=${kstDate()} step=${reached} depth=${depth} lang=${seenLang} src=${seenSrc} probe=${isProbe ? "1" : "0"}`;
  console.log(line);
  try { after(() => relay(line)); } catch { void relay(line); }
  return new NextResponse(null, { status: 204 });
}
