/**
 * 프로세스가 살아 있는지 묻는 **한 곳**.
 *
 * ## ★왜 함수 하나에 이만한 설명이 붙나 (2026-08-14)
 *
 * 처음에는 이 세 줄을 두 스크립트에 각각 적었고, **둘 다 같은 방식으로 틀렸다**:
 *
 *     spawnSync("tasklist", ["/FI", `PID eq ${pid}`], { shell: true })
 *
 * `shell: true` 로 주면 Node 는 인자를 따옴표로 감싸지 않고 **그냥 이어붙인다.** 그래서 실제로 도는 명령은
 *
 *     tasklist /FI PID eq 33176
 *
 * 가 되고, `tasklist` 는 필터를 못 읽는다. 출력에 PID 가 없으니 **살아 있는 프로세스를 죽었다고 답한다.**
 * 오류도 안 난다 — 조용히 반대로 답한다.
 *
 * 그 거짓말이 만든 것:
 *   - 감독자 중복 방지가 통과해 버려 감독자가 둘이 됐다
 *   - 배포의 "프로세스가 사라질 때까지 기다린다"가 **기다리지 않고** 즉시 지나갔다
 *     → 살아 있는 서버가 실행 폴더를 잡은 채 지우기를 시도해 `EPERM`·`EBUSY`
 *
 * ★증상만 보면 파일 잠금 문제로 보였다. 대기 시간을 늘리고 재시도를 넣어도 안 나았을 것이다 —
 *   기다림 자체가 없었기 때문이다. **틀린 답을 주는 검사는 검사가 없는 것보다 나쁘다.**
 */
import { spawnSync } from "node:child_process";

/**
 * 그 PID 가 지금 살아 있는가.
 *
 * ★`shell` 을 쓰지 않는다. Node 가 인자를 알아서 올바르게 감싼다.
 * ★판단할 수 없으면 **살아 있다고 답한다**(보수적). 죽었다고 잘못 말하면 남의 파일을 지우러 간다.
 */
export function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  const r = spawnSync("tasklist", ["/NH", "/FI", `PID eq ${pid}`], { encoding: "utf8" });
  if (r.error || typeof r.stdout !== "string") return true;
  /*
   * ★PID 만 보면 속는다(2026-09-09 samsam 실사고) — 재부팅 뒤 Windows 가 우리 감독자가 쓰던
   *   PID 를 무관한 시스템 서비스(AggregatorHost.exe)에 재사용했고, 이 함수는 "살아 있다"고
   *   답해 새 서버가 영원히 안 떴다. PID 가 있어도 **그 줄의 이미지 이름이 node.exe 인지**까지 본다.
   */
  const line = r.stdout.split(/\r?\n/).find((l) => l.includes(String(pid)));
  return Boolean(line) && /\bnode\.exe\b/i.test(line);
}

/** 그 PID 가 사라질 때까지 기다린다. 사라졌으면 true, 시간이 다 되면 false. */
export async function waitGone(pid, { timeoutMs = 15_000, stepMs = 300 } = {}) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (!isAlive(pid)) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return !isAlive(pid);
}
