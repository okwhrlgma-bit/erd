import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

/**
 * 비밀 0 (AGPL 판정 항목 8) - 소스를 공개하므로 저장소와 번들에 토큰 꼴이 없다.
 * 광고 게시자 ID(ca-pub-)와 슬롯 번호는 어차피 HTML 에 보이는 공개값이라 대상이 아니다.
 * ★판정은 순수 함수 secretHits 가 하고, 자체 점검이 같은 함수를 돌린다.
 */
const ROOT = process.cwd();
const PATTERNS: [string, RegExp][] = [
  ["openai/anthropic key", /\bsk-(?:ant-)?[A-Za-z0-9_-]{24,}/],
  ["aws access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["github token", /\b(?:ghp|gho|ghs|ghu)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}/],
  ["slack token", /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ["google api key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  // 이 파일 자신이 걸리지 않게 두 조각으로 나눠 조립한다.
  ["private key block", new RegExp("-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIV" + "ATE KEY-----")],
  ["cloudflare token assignment", /CLOUDFLARE_API_TOKEN\s*[=:]\s*["']?[A-Za-z0-9_-]{20,}/],
  ["personal email", new RegExp("ok98" + "1121@")],
];

export function secretHits(text: string): string[] {
  const hits: string[] = [];
  for (const [name, re] of PATTERNS) if (re.test(text)) hits.push(name);
  return hits;
}

const SKIP = new Set(["node_modules", ".next", ".open-next", ".git", ".wrangler", "vs", "coverage"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP.has(e.name)) walk(p, out);
    } else if (/\.(ts|tsx|js|jsx|mjs|json|jsonc|md|html|txt|css|ya?ml|toml|env\w*)$/i.test(e.name) || e.name.startsWith(".env") || !e.name.includes(".")) out.push(p); // NOTICE, LICENSE 처럼 확장자 없는 파일도 본다
  }
  return out;
}

describe("비밀 0", () => {
  it("자체 점검: 토큰 꼴은 잡고 평범한 글은 놔둔다", () => {
    expect(secretHits("key sk-ant-" + "a".repeat(30)).length).toBe(1);
    expect(secretHits("AKIA" + "A".repeat(16)).length).toBe(1);
    expect(secretHits("ghp_" + "a".repeat(36)).length).toBe(1);
    expect(secretHits("-----BEGIN PRIV" + "ATE KEY-----").length).toBe(1);
    expect(secretHits("ca-pub-1234567890123456 slot 1234567890")).toEqual([]);
    expect(secretHits("hello world")).toEqual([]);
  });

  it("★저장소 파일과 번들에서 토큰 꼴이 0 이다", () => {
    const files = walk(ROOT).filter((f) => !/package-lock\.json$/.test(f) && statSync(f).size < 40_000_000);
    expect(files.length).toBeGreaterThan(50);
    const hits: string[] = [];
    for (const f of files) {
      const h = secretHits(readFileSync(f, "utf8"));
      if (h.length) hits.push(f.slice(resolve(ROOT).length) + ": " + h.join(","));
    }
    expect(hits).toEqual([]);
  }, 120_000);

  it(".env 실물은 저장소에 두지 않는다(.gitignore 가 막는다)", () => {
    const gi = readFileSync(join(ROOT, ".gitignore"), "utf8");
    expect(gi).toMatch(/^\.env/m);
    expect(existsSync(join(ROOT, "upstream", ".env"))).toBe(false);
  });
});
