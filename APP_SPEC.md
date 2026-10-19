# 290호 ERD 그리기 명세

> 가입 없는 무료 웹 ERD 편집기. 편집기는 오픈소스 drawdb(AGPL-3.0)를 기기 안 저장만 남기고 한국어 기본으로 고친 비공식 빌드이고, 우리가 쓰는 코드는 껍데기(안내, 방침, 출처, 계측)와 편집기에 더한 수정(CHANGES.md)이다.

## 한 문장

브라우저에서 테이블과 관계를 그려 ERD 를 만들고 PNG, PDF, SQL 로 내보내며, 그린 ERD 는 이 기기 밖으로 나가지 않는다.

## 화면과 전이

| 화면 | 주소 | 하는 일 |
|---|---|---|
| 첫 화면 | `/`, `/en` | 한 문장 답, ERD 그리기 시작 링크, 쓰는 순서, 한계, 비공식 빌드 고지, 광고 한 자리(첫 화면에만), 푸터 |
| ERD 편집기 | `/open/#/editor` | 상류를 고친 정적 빌드. 데이터베이스 고르기, 테이블 추가, 관계, 내보내기, 정보와 라이선스 창 |
| 쓰는 법 | `/guide`, `/en/guide` | 눌러 본 순서대로 시작, 테이블과 관계, 저장, 내보내기, 막힐 때 |
| 출처와 라이선스 | `/credits`, `/en/credits` | 원저작자, AGPL-3.0, 소스 링크, 함께 들어 있는 오픈소스, 원문 링크 |
| 방침 | `/privacy`, `/en/privacy` | 서버가 받는 것과 안 받는 것, 기기 저장 |

전이: 첫 화면에서 ERD 그리기 시작을 누르면 `/open/#/editor` 로 가고 로딩 문구가 뜬 뒤 데이터베이스 고르는 창이 열린다. 푸터에서 쓰는 법, 출처, 방침으로 간다.

## 빈 상태

편집기는 빈 다이어그램으로 열린다. 첫 화면은 항상 같다(저장된 ERD 를 우리가 보관하지 않는다).

## 실패 상태

- 편집기 파일을 못 받으면(오프라인, 느린 망) 로딩 문구에 머문다.
- 서버 공유와 가져오기 링크는 이 빌드에 없다. 파일로 내보낸다고 안내했다.
- 한국어 번역이 빈 항목은 영어로 남는다. 안내와 정보 창에 적었다.
- 교재 표기(IE, Barker, Chen) 전환과 정규화 점검은 없다. 첫 화면 한계에 적었다.
- 존재하지 않는 주소는 not-found 한 화면(두 언어 한 줄)으로 돌려보낸다.

## 되돌리기

저장은 브라우저 저장소(IndexedDB)에 자동으로 되고 되돌릴 우리 쪽 상태는 없다. 편집기 안의 실행 취소는 상류 기능이다. 마지막으로 연 날짜는 브라우저 사이트 데이터 지우기로 없앤다.

## 레드오션 3문

선점자(erdcloud, dbdiagram, drawdb)가 있으니 세 가지로 답한다(판정 인용). ①나은 자리: ko+en, 가입 0, 기기 안 저장. ②더하는 것: 과제 제출용 PNG, PDF 내보내기. 교재 표기 전환과 정규화 점검 안내는 상류에 없어 이 빌드에도 없다(docs/po-gate.md). ③좁히기: DB 과제와 정보처리기사 ERD 연습.

## buyer-and-metric

- 손님: DB 수업 대학생, 정보처리기사 실기 수험생, 소규모 팀 개발자.
- 돈 길: 광고(편집기 캔버스 0, 첫 화면 한 자리. 슬롯 값은 PO 가 넣으면 켜진다). 결제와 가입은 없다.
- 지표(read-funnel 이벤트 이름): `arrive`, `open_click`, `editor_ready`, `first_input`, `export`(내보내기 수, 첫 지표), `return_visit`(저장 뒤 다시 열기), `share_click`. 검색은 GSC 의 "erd 그리기".
- 읽는 법: `node scripts/read-funnel.mjs`. `editor_ready` 대비 `export` 가 낮으면 그리다 떠난 것이다.

## 상류 정보

drawdb-io/drawdb(AGPL-3.0, commit 7683bdf). 우리가 고친 소스는 `upstream/` 에 있고 빌드는 `scripts/build-editor.mjs` 가 한다. 고친 내용은 CHANGES.md. 원문은 LICENSE, NOTICE, `public/LICENSE.txt`. 함께 들어가는 Monaco Editor, Font Awesome Free, Bootstrap Icons 의 원문은 `public/open/LICENSE-*.txt`.

## 어투 규정

> PO 상시 2026-09-16 "모든 앱은 타겟에 맞는 정교한 어투를 사용 해야만함".
> 갈래 규격 = `~/.claude/TONE-CATALOG.md` 유틸변환. 검사 = `node ~/.claude/tools/tone-spec-lint.mjs erd`

- 갈래: 유틸변환
- 호칭: 없음 (학생도 개발자도 같은 화면을 쓴다. 부르는 말을 쓰지 않는다)
- 종결어미: 합니다체
- 문장 길이: 45자 이내 (고지와 라이선스 문장은 예외, 뜻이 먼저다)
- 쓰는 말: ERD, 테이블, 관계, 열, 기본키, 외래키, 저장, 내보내기, 브라우저, 데이터베이스
- 안 쓰는 말: 지금 바로, 한정, 오늘만, 서두르세요, 놓치지 마세요, 완벽, 전문가급, 최고, 역대급, 대박
- 문턱: 30%

**왜 합니다체이고 짧은가.** 손님은 ERD 한 장을 급히 그려야 하는 사람이라 군더더기 없이 무엇이 되고 안 되는지만 읽는다. 해요체는 가볍고 하십시오체는 멀다. 합니다체로 한 문장에 한 가지만 말하고, 현장 낱말(테이블, 기본키, 외래키)을 그대로 쓴다. 재촉, 거짓 희소성, 손실 압박은 없다.

예문 다섯
1. ERD 그리기 시작을 누르면 편집기가 열립니다.
2. 테이블 추가를 눌러 테이블을 만드세요.
3. 그린 ERD 는 서버로 보내지 않습니다.
4. 내보내기에서 PNG 나 PDF 를 고르면 파일로 받습니다.
5. 한국어 번역이 빈 항목은 영어로 보입니다.

**en**: you 로 직접 부르고 짧은 명령형(`Hit Add table.` `Drag a dot onto another table.`). 영어권 DB 현장어(table, column, primary key, foreign key, relation)를 쓰고 옮긴 티를 내지 않는다. "limited time", "don't miss", "last chance", "perfect", "best" 는 쓰지 않는다.

en examples
1. Hit Start drawing an ERD to open the editor.
2. Hit Add table to make a table.
3. Your diagram never leaves this device.
4. Pick PNG or PDF under Export to get a file.
5. Items without a Korean translation show in English.
