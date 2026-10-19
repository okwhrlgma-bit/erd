import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/src/lib/json-ld";
import { dict, pathFor, type Locale } from "@/src/lib/i18n";

/**
 * 출처와 라이선스 쪽, ko/en 공용. 상류 고지와 비공식 빌드 고지와 글꼴 고지를 화면에 둔다.
 *
 * ★문구는 번들 안 NOTICE, LICENSE-MIT, LICENSE-APACHE, OFL-NotoSansKR.txt 를 읽고 썼다(docs/license-notes.md).
 * ★광고는 이 쪽에 없다.
 */
export function CreditsBody({ locale, revisedISO }: { locale: Locale; revisedISO: string }) {
  const t = dict(locale).credits;
  const home = dict(locale).guide.breadcrumbHome;
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-8 px-5 py-10">
      <JsonLd
        data={articleJsonLd({
          headline: t.jsonHeadline,
          description: t.jsonDesc,
          path: pathFor(locale, "/credits"),
          revisedISO,
          lang: locale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: home, path: pathFor(locale, "/") },
          { name: t.h1, path: pathFor(locale, "/credits") },
        ])}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t.h1}</h1>
        <p className="max-w-[52ch] text-sm leading-relaxed">{t.lead}</p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t.unofficialTitle}</h2>
        {t.unofficial.map((p) => (
          <p key={p} className="max-w-[60ch] text-sm leading-relaxed">{p}</p>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t.sourceTitle}</h2>
        {t.sourceBody.map((p) => (
          <p key={p} className="max-w-[60ch] text-sm leading-relaxed">{p}</p>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t.libTitle}</h2>
        {t.libBody.map((p) => (
          <p key={p} className="max-w-[60ch] text-sm leading-relaxed">{p}</p>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t.filesTitle}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {t.files.map((f) => (
            <li key={f.href}>
              <a className="inline-flex min-h-8 items-center underline" href={f.href}>{f.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <nav className="text-sm">
        <a href={pathFor(locale, "/")} className="inline-flex min-h-8 items-center underline">{"←"} {t.backLink}</a>
      </nav>
    </main>
  );
}
