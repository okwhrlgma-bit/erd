# 돈 길 (2026-10-19)

| 칸 | 내용 |
|---|---|
| 손님 | DB 수업 대학생, 정보처리기사 실기 수험생, 소규모 팀 개발자. 가입 없이 ERD 한 장을 급히 그려야 하는 사람 |
| 돈 길 | 광고. 편집기 캔버스에는 0. 첫 화면(`/`, `/en`)에 한 자리가 있다. 내보내기 뒤와 쓰는 법 쪽 자리는 아직 없다(만들지는 다음 판단) |
| 광고 켜기 | `node ~/.claude/tools/ads-on.mjs --fill-missing` 로 `.env.local` 을 채우고 `--missing` 으로 확인. 슬롯 값은 PO 가 애드센스에서 만든다. 값을 지어내지 않는다. 없으면 휴면 |
| 지표 | 내보내기 수(단계 이름 `export`), GSC 의 "erd 그리기" 노출과 클릭, 저장 뒤 다시 열기(`return_visit`) |
| 병목 읽기 | `open_click` 은 많은데 `editor_ready` 가 적으면 편집기 로딩 이탈. `editor_ready` 는 많은데 `first_input` 이 적으면 첫 화면 안내를 먼저 본다. `first_input` 은 많은데 `export` 가 적으면 그리다 떠난 것이다 |
| 한계 | 광고가 첫 화면에만 있어 편집기에서 오래 머물수록 노출은 안 늘어난다. 노출 수는 방문 수에 거의 비례한다 |
| 올리는 길 | "erd 그리기" 검색에 맞는 쓰는 법 쪽 보강은 노출이 아니라 유입을 늘린다. 먼저 arrive 수를 본다 |

## 읽는 법

`node scripts/read-funnel.mjs` 가 arrive, open_click, editor_ready, first_input, export, return_visit, share_click 을 깊이 순으로 센다.
처음 며칠은 표본이 적어 비율은 참고만 한다. 측정은 아직 시작 전이다.

## 레드오션 3문 (DEV-QUEUE 35)

| 물음 | 답 | 상태 |
|---|---|---|
| ① 선점자 대비 나은 자리 | erdcloud 는 가입, dbdiagram 은 개수 제한, drawdb 는 영어 화면이라고 판정 때 적혔다. 우리는 ko+en, 가입 0, 기기 안 저장 | 직접 열어 대조하지 않은 판정 인용 |
| ② 더하는 것 | 과제 제출용 PNG, PDF 내보내기(있음). 교재 표기 전환과 정규화 점검 안내(없음) | 앞 둘만 지켰다. 뒤 둘은 po-gate |
| ③ 좁히기 | DB 과제와 정보처리기사 ERD 연습 | 문구로 좁힘 |
