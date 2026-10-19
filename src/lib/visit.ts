import { track } from "@/src/lib/funnel";

/**
 * 다시 온 날을 센다. 기기에는 마지막으로 연 날짜(연월일) 하나만 적는다.
 * 오늘이 적힌 날과 다르면 return_visit 을 보내고 오늘로 바꾼다. 같은 날 여러 번 열어도 세지 않는다.
 * 저장소가 막힌 환경이면 조용히 넘어간다(계측이 죽어도 화면은 산다).
 */
export const VISIT_KEY = "erd.lastVisit.v1";

export function todayLocal(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function checkReturn(): void {
  try {
    const today = todayLocal();
    const last = localStorage.getItem(VISIT_KEY);
    if (last && last !== today) track("return_visit");
    if (last !== today) localStorage.setItem(VISIT_KEY, today);
  } catch {
    /* 저장소 접근 실패는 무시 */
  }
}
