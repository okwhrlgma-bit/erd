import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

/**
 * 퍼널 단계 정본을 **파싱해서** 가져온다 — 손으로 다시 적지 않는다.
 *
 * ## 왜 (골든 §14.2 "판정식은 정본에서 파생한다")
 *
 * `read-funnel.mjs` 는 단계 이름을 **손으로 적은 배열**로 갖고 있었다. 그래서 정본에는 있는
 * `share_click` 이 판독기의 어느 칸에도 없었고, `continue` 로 **조용히 버려지고 있었다** —
 * 서버 로그에는 찍히는데 아무도 안 읽는, 이 repo 가 이미 두 번 잡은 그 클래스다.
 * 발신부와 판독기는 짝이다. 짝을 주석으로 부탁하면 지켜지지 않는다.
 *
 * ★`.mjs` 는 `.ts` 를 import 할 수 없다. 그래서 정본 파일을 읽어 배열을 뽑는다.
 * ★못 뽑으면 **크게 실패한다**(`scripts/lib/years.mjs` 와 같은 규율).
 *   기본값으로 넘어가는 순간이 중복이 시작되는 순간이고, 그 뒤로는 조용히 어긋난다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CANON = join(HERE, "..", "..", "src", "lib", "funnel.ts");

export function funnelSteps() {
  const src = readFileSync(CANON, "utf8");
  const m = src.match(/export const FUNNEL_STEPS = \[([\s\S]*?)\] as const;/);
  if (!m) throw new Error(`${CANON} 에서 FUNNEL_STEPS 를 못 찾았다 — 정본 형태가 바뀌었다.`);
  // 주석 안의 문자열이 딸려 오지 않게 주석을 먼저 걷는다(골든 §2: 검사는 주석이 아니라 코드를 본다).
  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const steps = [...body.matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
  if (steps.length < 2) throw new Error(`FUNNEL_STEPS 파싱 결과가 ${steps.length}개 — 파서가 틀렸다.`);
  return steps;
}
