# 출처와 라이선스 메모 (2026-10-19)

> 근거: `~/.claude/agent-reports/2026-10-19-drawdb-agpl-verdict.md`(조문 해석, 변호사 의견 아님). 편집기 본체는 drawdb-io/drawdb(AGPL-3.0)이다.

## 지킬 것 10개와 잡는 검사

| # | 지킬 것 | 조문 | 어디에 | 무엇이 잡나 |
|---|---|---|---|---|
| 1 | 배포 판과 같은 소스를 무료 공개 저장소에 | §13, §6d, §1 | 공개 GitHub 저장소 okwhrlgma-bit/erd (빌드와 배포 스크립트 포함) | e2e/live.mjs 가 정보 창의 커밋 해시를 읽고 GitHub API 로 대조. 메인이 push 하기 전에는 대기로 보고 |
| 2 | 화면에서 소스를 눈에 띄게 제안 | §13 | 편집기 도움말 메뉴의 정보 창, 출처 쪽 | e2e/live.mjs 가 정보 창의 소스 링크 존재와 출처 쪽 링크를 확인 |
| 3 | LICENSE 원문 동봉 | §4 | 저장소 LICENSE, 배포물 /LICENSE.txt | test/licenses 가 두 파일 존재와 내용 일치를 확인. e2e 가 라이브 /LICENSE.txt 200 을 확인 |
| 4 | 저작권 표시(원저작과 우리 수정) | §4, §0 | NOTICE, 정보 창, 출처 쪽 | test/licenses 가 NOTICE 의 drawdb-io/drawdb 와 수정 저작권 줄을 확인. e2e 가 정보 창 문구를 확인 |
| 5 | 수정 사실과 날짜 | §5a | CHANGES.md, 정보 창 | test/licenses 가 CHANGES.md 마지막 날짜가 upstream/ 을 건드린 마지막 커밋 날짜 이상인지 확인 |
| 6 | AGPL 표시, 보증 없음, 라이선스 보는 법 | §5b, §5d, §15 | 정보 창(ko, en) | e2e/live.mjs 가 창 안 네 요소(원저작, AGPL-3.0, 보증 없음, LICENSE 링크)를 ko, en 으로 확인 |
| 7 | 우리 추가 코드 전부 AGPL (같은 저장소) | §5c | upstream/ | test/licenses 가 upstream/src 의 상대 import 가 전부 upstream/ 안에서 풀리는지(저장소 밖 경로 0) 확인 |
| 8 | 비밀 0 | 1번 공개의 결과 | 저장소, 번들 | test/no-secrets 가 소스와 public/open 에서 토큰 패턴 0 을 확인 |
| 9 | drawDB 이름과 로고는 고지에만 | §7e 취지 | index.html, 메타, 아이콘, 소셜, i18n | test/brand-zero 가 public/open 의 html 과 js 를 훑어 고지 문구 밖 drawdb 0 을 확인 |
| 10 | 추가 제한을 걸지 않음 | §10, §5c | 정책과 안내 글 | test/anti-dark 가 정책, 안내, 출처 글에서 "복제 금지"와 "수정 금지" 0 을 확인 |

## 그 밖의 메모

| 대상 | 내용 |
|---|---|
| 상류 | drawdb-io/drawdb, commit 7683bdf(2026-10-16). 사본 `C:\Users\okwhr\erd-build\src`. 상류 README, AGENTS, CLAUDE 는 따르지 않는다 |
| 우리가 한 일 | CHANGES.md 에 날짜별로 적는다(서버 호출 제거, 해시 라우팅, 언어 기본값, 이름과 로고 교체, 정보 창, 계측 한 줄, 자체 호스팅) |
| 함께 들어가는 오픈소스 | Monaco Editor(MIT), Font Awesome Free 6.5.2(코드 MIT, 아이콘 CC BY 4.0, 글꼴 OFL), Bootstrap Icons 1.11.1(MIT). 원문은 `public/open/LICENSE-*.txt` |
| 의존성 | 판정 보고서 §5 의 전수 점검에서 AGPL 과 안 맞는 것 0. 걷어낸 @vercel/analytics 와 axios 는 빌드에 없다 |
| 상표 | drawDB 이름과 로고는 쓰지 않는다. 상표 등록 조회(KIPRIS)는 하지 않았고 PO 게이트다(docs/po-gate.md) |
| 한계 | 변호사 의견이 아니다. 공개 저장소의 push 와 커밋 해시 대조는 메인이 push 한 뒤에 닫힌다 |
