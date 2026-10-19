import { Rich } from "@/src/components/Rich";
import { dict, type Locale } from "@/src/lib/i18n";

/**
 * 개인정보 처리방침 본문 — ko/en 을 한 페이지에 병기한다(부르는 로케일이 먼저).
 *
 * ★정직 원칙: 여기 적힌 것이 코드가 하는 전부여야 한다.
 *   서버가 받는 것 = app/api/track/route.ts(단계 이름, 언어, 유입 라벨, 날짜). 기기 저장 = src/lib/notice/store.ts 의 열쇠 셋(안내문 입력, 화면 안내판 입력, 마지막으로 연 날, test/privacy-surface).
 * ★아동: 계정이 없고 수집 자체가 없으므로 "만 14세 미만(영어판 13세 미만) 개인정보를 모으지 않는다"를 그대로 적는다.
 *   개인정보 보호법 제22조의2(만 14세 미만 아동의 법정대리인 동의)는 **수집할 때** 걸리는 조항이라, 수집이 없으면 동의 절차도 없다.
 * ★광고 고지 짝: 애드센스가 켜졌는지(env)에 따라 방침이 저절로 정확해진다. 제휴 고지도 태그 게이트와 같은 조건이다.
 */
const ADSENSE_ON = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);

function Section({ locale, first }: { locale: Locale; first: boolean }) {
  const t = dict(locale).privacy;
  const H = first ? "h1" : "h2";
  return (
    <section lang={locale} className="flex flex-col gap-3">
      <H className="text-lg font-semibold">{t.h1}</H>
      <p className="mt-2"><Rich t={t.lead} /></p>
      {/* cdn-disclosure-v1 */}
      <p className="max-w-[54ch] leading-relaxed"><Rich t={t.theme} /></p>
      <ul className="mt-2 list-disc pl-5">
        <li><Rich t={t.record} /></li>
        <li><Rich t={t.server} /></li>
        {ADSENSE_ON ? <li><Rich t={t.adsOn} /></li> : <li><Rich t={t.adsOff} /></li>}
        <li>{t.link}</li>
        <li>{t.deleteNote}</li>
      </ul>
      <p className="mt-2 text-neutral-700">{t.bizNote}</p>
    </section>
  );
}

export function PrivacyBody({ locale }: { locale: Locale }) {
  const other: Locale = locale === "en" ? "ko" : "en";
  const t = dict(locale).privacy;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-8 p-6 text-sm leading-relaxed">
      <Section locale={locale} first />
      <Section locale={other} first={false} />
      <a className="inline-flex min-h-8 items-center underline" href={locale === "en" ? "/en" : "/"}>{"←"} {t.backLink}</a>
    </main>
  );
}
