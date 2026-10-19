"use client";

import { useEffect } from "react";

/**
 * 서비스 워커를 등록한다 — 설치와 오프라인이 여기서 열린다.
 *
 * ★화면을 하나도 안 그린다. 설치를 조르는 배너는 두지 않는다 - 브라우저가 주소창에
 *   설치 아이콘을 띄우고, 누를지는 손님이 정한다(anti-dark).
 * ★등록이 실패해도 앱은 그대로 돈다. 오프라인이 안 될 뿐이다.
 */
export function InstallReady() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const t = setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 막힌 환경이면 조용히 넘어간다 */
      });
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  return null;
}
