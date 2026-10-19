"use client";

import { useEffect } from "react";
import { track } from "@/src/lib/funnel";
import { checkReturn } from "@/src/lib/visit";

/** 쪽에 닿은 것을 한 번 센다(세션당 단계별 1회, 이름만 보낸다). 다시 온 날이면 return_visit 도 센다. */
export function Reach({ step }: { step: "arrive" }) {
  useEffect(() => {
    track(step);
    checkReturn();
  }, [step]);
  return null;
}
