// 편집기 빌드: upstream/ (수정한 drawdb 소스) 를 빌드 작업본에 덮어 vite 로 빌드하고 public/open/ 에 놓는다.
// 사용: node scripts/build-editor.mjs   (erd 저장소 루트에서. npm 은 빌드 작업본 안에서만 돈다)
// 빌드 작업본: ERD_BUILD_SRC (기본 C:\Users\okwhr\erd-build\src) = 상류 drawdb 의 git 복제본.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = process.env.ERD_BUILD_SRC || "C:/Users/okwhr/erd-build/src";
const UP = path.join(ROOT, "upstream");
if (!fs.existsSync(path.join(UP, "vite.config.js"))) throw new Error("erd 저장소 루트에서 실행한다");
if (path.resolve(SRC) === path.resolve(ROOT)) throw new Error("빌드 작업본이 erd 저장소와 같다");
const sh = (cmd, args, cwd, extra = {}) =>
  execFileSync(cmd, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8", shell: false, ...extra });
const NODE = process.execPath;

// 1. 배포 커밋: 소스 커밋 짧은 해시. upstream/ 에 커밋 안 된 변경이 있으면 -dirty.
let commit;
try { commit = sh("git", ["rev-parse", "--short", "HEAD"], ROOT).trim(); } catch { commit = "nocommit"; }
const dirty = sh("git", ["status", "--porcelain", "--", "upstream"], ROOT).trim();
if (dirty) commit += "-dirty";
console.log("commit", commit);

// 2. 작업본을 상류 상태로 되돌리고(추적 파일만) upstream/ 을 덮어쓴다.
sh("git", ["checkout", "--", "."], SRC);
const DELETE = ["public/config.js", "public/robots.txt"];
for (const f of DELETE) fs.rmSync(path.join(SRC, f), { force: true });
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "dist") continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); }
    else fs.copyFileSync(a, b);
  }
}
copyDir(UP, SRC);

// 3. 의존성: 작업본 안에서만 설치한다 (글꼴·아이콘 자체 호스팅용 두 패키지).
const need = ["@fortawesome/fontawesome-free", "bootstrap-icons"];
if (need.some((n) => !fs.existsSync(path.join(SRC, "node_modules", n)))) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(npm, ["install", "--no-save", "--no-audit", "--no-fund", "@fortawesome/fontawesome-free@6.5.2", "bootstrap-icons@1.11.1"], { cwd: SRC, stdio: "inherit", shell: process.platform === "win32" });
}

// 4. 빌드
fs.rmSync(path.join(SRC, "dist"), { recursive: true, force: true });
execFileSync(NODE, [path.join(SRC, "node_modules/vite/bin/vite.js"), "build"], {
  cwd: SRC, stdio: "inherit", env: { ...process.env, ERD_COMMIT: commit },
});

// 5. public/open/ 으로 옮긴다.
const OUT = path.join(ROOT, "public/open");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SRC, "dist"), OUT);
fs.mkdirSync(path.join(OUT, "vs"), { recursive: true });
copyDir(path.join(SRC, "node_modules/monaco-editor/min/vs"), path.join(OUT, "vs"));
fs.copyFileSync(path.join(ROOT, "LICENSE"), path.join(ROOT, "public/LICENSE.txt"));
fs.copyFileSync(path.join(ROOT, "NOTICE"), path.join(OUT, "NOTICE"));
fs.copyFileSync(path.join(ROOT, "CHANGES.md"), path.join(OUT, "CHANGES.md"));
fs.copyFileSync(path.join(SRC, "node_modules/monaco-editor/LICENSE"), path.join(OUT, "LICENSE-monaco-editor.txt"));
fs.copyFileSync(path.join(SRC, "node_modules/@fortawesome/fontawesome-free/LICENSE.txt"), path.join(OUT, "LICENSE-fontawesome-free.txt"));
fs.copyFileSync(path.join(SRC, "node_modules/bootstrap-icons/LICENSE"), path.join(OUT, "LICENSE-bootstrap-icons.txt"));

// 6. index.html 에 우리 몫을 다시 넣는다: 제목, 로딩 문구, 계측, 배포 커밋.
const head = fs.readFileSync(path.join(ROOT, "scripts/editor-head.html"), "utf8");
const idx = path.join(OUT, "index.html");
let html = fs.readFileSync(idx, "utf8");
html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>ERD 그리기 편집기</title>");
html = html.replace(/<html lang="en">/, '<html lang="ko">');
html = html.replace("</head>", head.split("__COMMIT__").join(commit) + "</head>");
html = html.replace('<div id="root"></div>', '<div id="root"><p id="erd-loading">편집기를 여는 중입니다. Opening the editor.</p></div>');
fs.writeFileSync(idx, html);

// 7. 요약
let max = { f: "", n: 0 }, total = 0, count = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else { const n = fs.statSync(p).size; total += n; count++; if (n > max.n) max = { f: path.relative(OUT, p), n }; }
  }
})(OUT);
console.log("files", count, "total", total, "max", max.f, max.n);
