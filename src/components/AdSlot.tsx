"use client";

import { useEffect, useRef } from "react";

/**
 * 광고 슬롯 — 수익화 표면(2026-08-27 PO "모든 앱은 수익화 요소 있을것·궁극 목표=수익화").
 *
 * ★정직한 휴면 설계: 애드센스 퍼블리셔 ID(NEXT_PUBLIC_ADSENSE_CLIENT)가 env 에 없으면
 *   아무것도 렌더하지 않는다(빈 자리·가짜 배너 없음). PO 가 계정 ID 를 채우면 그때 켜진다.
 * ★제3자 데이터: 광고가 켜지면 구글이 쿠키를 쓸 수 있어 privacy 에 고지한다(광고 절).
 * ★불쾌하지 않게: 콘텐츠 아래 한 자리·비강제·게임 흐름을 막지 않는다.
 */
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
const SLOT_MULTIPLEX = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MULTIPLEX;
const SLOT_INFEED = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED;
/** 애드센스가 준 인피드 레이아웃 키 — 이 값 없이는 fluid 슬롯이 안 그려진다. */
const INFEED_LAYOUT_KEY = "-6t+ed+2i-1n-4w";

type Variant = "responsive" | "multiplex" | "infeed";

/**
 * ★목록·안내 페이지용 — 멀티플렉스·인피드는 기본 반응형 자리와 **같은 정직한 휴면 설계**를 따른다.
 *   해당 변형의 슬롯 env 가 없으면 아무것도 안 그린다.
 */
export function AdSlot({ locale = "ko", variant = "responsive" }: { locale?: "ko" | "en"; variant?: Variant } = {}) {
  const slot = variant === "multiplex" ? SLOT_MULTIPLEX : variant === "infeed" ? SLOT_INFEED : SLOT;
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    /*
     * ★그리는 조건과 **같은 조건**으로 막는다 (2026-09-06 · 라이브 실측).
     *   아래 렌더는 `!CLIENT || !SLOT` 이면 null 을 내는데 여기서는 CLIENT 만 봤다.
     *   그래서 슬롯이 없는 동안(승인 대기 중) **자리는 안 그리면서 push 는 불러**
     *   애드센스가 `TagError` 를 던졌다 — 방문자 콘솔에 그대로 남는 오류다.
     *   ★게이트가 둘이면 언젠가 어긋난다. 같은 조건을 쓴다.
     */
    if (!CLIENT || !slot) return;
    /*
     * ★**이미 채워진 자리에 또 밀지 않는다** (2026-09-05 · 실제로 TagError 가 났다).
     *
     *   화면 안에서 다른 쪽으로 넘어가면(예: 한국어 → English) 이 컴포넌트가 다시 붙는데,
     *   애드센스는 같은 `<ins>` 에 두 번 밀면 `TagError` 를 던진다. 그 오류는 방문자
     *   브라우저에 그대로 남고, 우리 라이브 검사도 그것 때문에 빨개졌다.
     *   애드센스가 채운 자리에는 `data-adsbygoogle-status` 가 붙는다 — 그것을 보고 건너뛴다.
     */
    const el = ref.current;
    /*
     * ★**우리 점검 방문에는 광고를 부르지 않는다** (2026-09-05 실측).
     *
     *   라이브 e2e 는 한 브라우저로 여러 장을 잇달아 연다. 그때마다 광고를 새로 부르니
     *   애드센스가 어느 지점부터 거절하며 `TagError` 를 던졌고, 표본 여덟 앱 중 셋이
     *   **늘 빨간** 상태였다. 늘 빨간 검사는 초록만큼이나 아무 말도 못 한다.
     *   ★한 장만 열면 오류가 0 이다 — 앱 결함이 아니라 **우리 그물이 만든 것**이다.
     *
     *   ★그리고 그편이 옳다: 자동 방문이 광고를 부르면 **사람이 안 본 노출**이 잡힌다.
     *     그건 애드센스가 금지하는 무효 트래픽이고, 우리 광고 지표도 그만큼 거짓이 된다.
     *   방문 신호에 이미 쓰는 `?probe=1` 을 그대로 본다(계측과 같은 표식이라 두 벌이 안 생긴다).
     */
    if (new URLSearchParams(location.search).get("probe") === "1") return;

    if (el?.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 애드센스 스크립트가 아직 안 실렸으면 조용히 넘어간다(다음 렌더에 재시도).
    }
  }, [slot]);

  /*
   * ★슬롯 번호까지 있어야 낸다(2026-08-29). 퍼블리셔 ID 만 보고 자리를 내면 애드센스가
   *   채우지 못하는 빈 <ins> 가 남는데, 그건 렌더도 되고 검사도 통과하면서 수익만 0 이다
   *   (같은 모델을 굴리는 다른 사이트가 가이드 12장 중 11장에서 실제로 이 상태였다).
   *   자리를 안 내는 쪽이 정직하다 — 없는 수익을 있는 것처럼 보이게 하지 않는다.
   */
  if (!CLIENT || !slot) return null;

  if (variant === "infeed") {
    return (
      <aside aria-label={locale === "en" ? "Advertisement" : "광고"} className="my-2">
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="fluid"
          data-ad-layout-key={INFEED_LAYOUT_KEY}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
        />
      </aside>
    );
  }

  return (
    <aside aria-label={locale === "en" ? "Advertisement" : "광고"} className="my-2 flex justify-center">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={variant === "multiplex" ? "autorelaxed" : "auto"}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
