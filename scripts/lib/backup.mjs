/**
 * 저장 데이터 백업 — 순위표와 진행 중인 대국을 잃지 않기 위해.
 *
 * ## ★무엇을 막고 무엇을 못 막는지 정확히
 *
 * **막는 것**: 실수로 지우는 것. 배포 사고. 파일이 반쯤 쓰이다 깨지는 것.
 * 이게 실제 위험이다 — 우리는 저장 기본값이 `<repo>/.data` 여서 `git clean -xfd` 한 줄에
 * 전부 날아갈 수 있는 상태로 며칠을 보냈다.
 *
 * **못 막는 것**: 디스크 고장. 같은 디스크에 복사하기 때문이다.
 * ★그러니 "백업이 있으니 안전하다"고 말하지 않는다. 다른 매체로 옮기는 것은 사람이 해야 한다.
 *
 * ## 왜 감독자가 직접 부르나
 *
 * 예약 작업(작업 스케줄러·cron)을 따로 걸면 **그것이 도는지 아무도 안 본다.**
 * 감독자는 어차피 24시간 떠 있고, 감독자가 죽으면 사이트도 죽어서 바로 안다.
 * 살아 있는 것에 얹는 편이 새로 만드는 것보다 덜 조용히 실패한다.
 */
import { appendFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

/** 몇 벌을 남길지. ★무한히 쌓으면 디스크를 먹고, 그건 사이트를 죽인다. */
const KEEP = 7;

/**
 * 지금 상태를 한 벌 복사해 둔다. 이미 오늘 것이 있으면 덮는다(하루 한 벌).
 *
 * @returns 만든 경로, 또는 백업할 것이 없으면 null
 */
/**
 * 계측 이력 보존 — **로그로 분류돼 있지만 실제로는 우리 유일한 분석 저장소인 것**을 지킨다.
 *
 * ★2026-08-21 실측으로 생겼다. 이 앱은 데이터베이스가 없다(repo 전체 `createClient`·`INSERT` 참조 0).
 *   그래서 방문·단계·유입 라벨이 전부 `host.log` 의 `[FUNNEL]` 줄에만 산다.
 *   그런데 아래 `SKIP` 이 `host.log` 를 빼고 있었고, 그 판단은 **쓸 당시엔 맞았다** —
 *   그 뒤 퍼널 계측이 이 파일로 들어오면서 분류가 낡았다. 로그라 부르는 것이 실은 분석 DB 다.
 *
 * ★원본 로그를 백업에 넣지는 않는다. 아래 주석의 걱정(20MB × 7벌)이 진짜다.
 *   대신 **계측 줄만 뽑아 따로 쌓는다** — 실측 압축비 15배(전체 1,883줄 중 계측 123줄).
 *   그러면 이 파일은 SKIP 에 없으므로 백업이 저절로 가져간다.
 *
 * ★줄에 시각이 없다(로그 형식이 그렇다). 그래서 날짜로 자르지 못하고,
 *   **마지막으로 보관한 줄**을 현재 로그에서 찾아 그 다음부터 잇는다.
 *   못 찾으면(회전·절단) 전부 다시 보관한다 — 몇 줄 겹치는 편이 조용히 잃는 것보다 낫다.
 */
export function archiveFunnel(storageDir) {
  const log = join(storageDir, "host.log");
  if (!existsSync(log)) return 0;
  const current = readFileSync(log, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("[FUNNEL]"))
    .map((l) => l.trim());
  if (current.length === 0) return 0;

  const archivePath = join(storageDir, "funnel-archive.jsonl");
  let last = null;
  if (existsSync(archivePath)) {
    const rows = readFileSync(archivePath, "utf8").split(/\r?\n/).filter(Boolean);
    for (let i = rows.length - 1; i >= 0; i--) {
      try {
        const r = JSON.parse(rows[i]);
        if (r.line) { last = r.line; break; }
      } catch { /* 깨진 줄은 건너뛴다 — 보관은 계속돼야 한다 */ }
    }
  }
  const from = last ? current.lastIndexOf(last) : -1;
  const fresh = last && from >= 0 ? current.slice(from + 1) : current;
  if (fresh.length === 0) return 0;

  const seenAt = new Date().toISOString();
  const payload = fresh.map((line) => JSON.stringify({ seenAt, line })).join("\n") + "\n";
  if (existsSync(archivePath)) appendFileSync(archivePath, payload, "utf8");
  else writeFileSync(archivePath, payload, "utf8");
  return fresh.length;
}

export function backupOnce(storageDir, now = new Date()) {
  if (!existsSync(storageDir)) return null;
  // ★뜨기 직전에 계측을 뽑아 둔다 — 이 한 줄이 없으면 아래 SKIP 이 그것을 영원히 버린다.
  archiveFunnel(storageDir);
  /*
   * ★PID 파일과 잠금은 빼고 복사한다. 그것들은 "지금 도는 프로세스"에 대한 사실이라
   *   복원 시점에는 전부 거짓이다. 되살렸을 때 없는 프로세스를 죽이러 가면 안 된다.
   * ★로그도 뺀다. 최대 20MB 가 일곱 벌이면 140MB 다 — 백업이 디스크를 채워 사이트를 죽이면
   *   백업이 아니라 사고다. 잃으면 곤란한 것은 순위표와 대국이지 로그가 아니다.
   */
  const SKIP = new Set(["server.pid", "supervisor.pid", "deploying", "host.log", "host.log.1"]);
  const entries = readdirSync(storageDir).filter((n) => !SKIP.has(n));
  if (entries.length === 0) return null;

  const root = join(dirname(storageDir), "backups");
  mkdirSync(root, { recursive: true });
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const dest = join(root, stamp);

  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const name of entries) {
    cpSync(join(storageDir, name), join(dest, name), { recursive: true });
  }

  prune(root);
  return dest;
}

/** 오래된 것부터 지워 `KEEP` 벌만 남긴다. */
function prune(root) {
  /*
   * ★`_before-restore` 는 세지 않는다 (2026-08-16).
   *
   *   복구 도구가 되살리기 직전 상태를 `<날짜>_before-restore` 로 떠 둔다. 그걸 백업으로 세면
   *   이름 정렬에서 진짜 백업보다 **뒤(=더 새것)** 로 잡혀, 복구를 몇 번 하면 KEEP 을 채워
   *   **진짜 백업을 밀어낸다.** 안전망이 원본을 잡아먹는 셈이라 여기서 제외한다.
   *   (그 폴더들은 같은 stamp 로 복구할 때마다 덮이므로 무한정 늘지 않는다.)
   */
  const dirs = readdirSync(root)
    .map((n) => ({ n, p: join(root, n) }))
    .filter(({ n, p }) => statSync(p).isDirectory() && !n.endsWith("_before-restore"))
    .sort((a, b) => (a.n < b.n ? 1 : -1)); // 이름이 날짜라 이름 정렬이 곧 시간 정렬이다
  for (const { p } of dirs.slice(KEEP)) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {
      /* 다음에 다시 시도한다 */
    }
  }
}
