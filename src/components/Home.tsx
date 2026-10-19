import { AdSlot } from "@/src/components/AdSlot";
import { OpenLink } from "@/src/components/OpenLink";
import { ShareLink } from "@/src/components/Share";
import { Reach } from "@/src/components/Reach";
import { dict, pathFor, type Locale } from "@/src/lib/i18n";
import { JsonLd, webAppJsonLd } from "@/src/lib/json-ld";

/**
 * 290호 첫 화면. ko/en 공용이고 문구는 사전에서만 온다.
 *
 * ## 한 문장 (2026-10-15 창립)
 * DB 수업 과제나 정보처리기사 실기 연습으로 ERD 를 급히 그려야 하는 사람이, 가입 없이 브라우저에서 편집기를 열어
 * 테이블과 관계를 그리고 PNG 나 PDF 로 내보낸다. 그린 ERD 는 서버로 가지 않는다.
 *
 * ★ERD 편집기는 정적 파일(/open/)이라 우리 레이아웃 밖이다. 이 쪽은 안내와 입구뿐이고, 서버 HTML 에 실콘텐츠가 있다(BOOTSTRAP 16).
 * ★광고는 이 쪽 한 자리뿐이다(편집기, 안내, 출처, 방침에는 없다. test/ads-path).
 */
export function HomeBody({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const h = t.home;
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-8 px-4 py-10 sm:px-5">
      <Reach step="arrive" />
      <JsonLd data={webAppJsonLd({ name: t.title, description: h.lead, path: pathFor(locale, "/"), lang: locale })} />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{h.h1}</h1>
          <a href={t.otherLang.href} hrefLang={locale === "en" ? "ko" : "en"} className="inline-flex min-h-8 items-center -my-1 text-sm underline">
            {t.otherLang.label}
          </a>
        </div>
        <p className="max-w-[56ch] leading-relaxed">{h.lead}</p>
        <p className="max-w-[56ch] text-sm leading-relaxed text-neutral-700">{h.promise}</p>
        <div className="flex flex-col items-start gap-2">
          <OpenLink label={h.openCta} />
          <p className="max-w-[56ch] text-xs leading-relaxed text-neutral-700">{h.openNote}</p>
        </div>
      </header>

      <AdSlot locale={locale} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{h.howTitle}</h2>
        <ol className="list-decimal pl-5 text-sm leading-relaxed">
          {h.howSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{h.fitTitle}</h2>
        <ul className="list-disc pl-5 text-sm leading-relaxed">
          {h.fitBody.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{h.limitTitle}</h2>
        <ul className="list-disc pl-5 text-sm leading-relaxed">
          {h.limitBody.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <ShareLink label={h.shareLabel} cta={h.shareCta} doneText={h.shareDone} />
      </section>

      <section className="flex flex-col gap-2 text-sm text-neutral-700">
        <h2 className="text-base font-medium text-neutral-800">{h.siblingTitle}</h2>
        <p>{h.siblingDesc}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {h.siblings.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="inline-flex min-h-8 items-center -my-1 underline">{s.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex flex-wrap gap-3 text-xs">
        <a className="inline-flex min-h-8 items-center -my-1 underline" href={locale === "en" ? "/en/guide" : "/guide"}>{h.footer.guide}</a>
        <a className="inline-flex min-h-8 items-center -my-1 underline" href={locale === "en" ? "/en/credits" : "/credits"}>{h.footer.credits}</a>
        <a className="inline-flex min-h-8 items-center -my-1 underline" href={locale === "en" ? "/en/privacy" : "/privacy"}>{h.footer.privacy}</a>
        <a className="inline-flex min-h-8 items-center -my-1 underline" href="https://gwirae.com">{h.footer.gwirae}</a>
      </footer>
    </main>
  );
}
