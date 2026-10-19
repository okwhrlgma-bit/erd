"use client";

import { useState } from "react";
import { track } from "@/src/lib/funnel";
import { DEFAULT_LOCALE } from "@/src/lib/i18n";

/**
 * 공유 버튼 — 카드를 만들어 두고 보낼 동선이 없으면 아무 일도 일어나지 않는다.
 * ★조르지 않는다(anti-dark): 누르면 링크를 넘겨줄 뿐이고, 안 눌러도 화면은 그대로다.
 * Web Share 가 되는 기기에서는 그걸 쓰고(모바일 기본 동작), 아니면 클립보드로 떨어뜨린다.
 *
 * ★2026-08-22 — 월 페이지 전용이던 것을 공용으로 옮겼다.
 *   홈에서 방향을 고르면 주소가 곧 답이 되는데(`?going=east`) **복사할 자리가 없었다.**
 *   답이 있는 화면에 보낼 길이 없고, 보낼 길이 있는 화면엔 그 답이 없던 셈이다.
 * ★주소는 부르는 쪽이 정하지 않는다 — 지금 보고 있는 주소를 그대로 넘긴다.
 *   그래야 화면에 보이는 것과 상대가 받는 것이 어긋나지 않는다.
 */
export function ShareLink({ label, cta, doneText }: { label: string; cta: string; doneText: string }) {
  const [done, setDone] = useState(false);

  /**
   * 보낼 주소 — 지금 보고 있는 주소에 **유입 라벨**을 붙인다.
   *
   * ★2026-08-22: 여기가 `window.location.href` 를 **그대로** 복사하고 있었다.
   *   그래서 손님이 단톡에 던져 들어온 사람이 전부 `direct` 로 찍혔고,
   *   판독기에는 '유입 소스' 칸이 있는데 **공유는 영원히 보이지 않았다.**
   *   계정 없이 되는 유일한 홍보가 손님의 공유인데, 그게 도는지 잴 수가 없었다.
   * ★사람을 식별하는 것이 아니다 — **우리가 우리 링크에 적어 둔 단어**를 되읽는 것이고,
   *   처리방침이 이미 그렇게 말한다(같은 날 네 앱 고지를 그 문장으로 고쳤다).
   * ★이미 라벨이 있으면 덮지 않는다(그 사람이 온 경로가 먼저다).
   */
  function shareUrl(): string {
    const u = new URL(window.location.href);
    if (!u.searchParams.get("from")) u.searchParams.set("from", "share");
    u.searchParams.delete("probe"); // 확인용 표시는 남에게 보내지 않는다
    return u.toString();
  }

  async function onShare() {
    const url = shareUrl();
    track("share_click");
    try {
      if (navigator.share) {
        await navigator.share({ title: label, url });
        return;
      }
    } catch {
      // 사용자가 취소한 경우도 여기로 온다 — 조용히 클립보드로 넘어간다.
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
    } catch {
      /* 복사가 막힌 환경에서는 아무 말도 하지 않는다(주소창이 이미 답이다) */
    }
  }

  return (
    <button type="button" onClick={onShare} className="min-h-9 rounded border px-3 text-sm">
      {done ? doneText : cta}
    </button>
  );
}
