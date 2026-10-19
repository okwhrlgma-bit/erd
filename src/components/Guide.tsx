import Link from "next/link";
import { JsonLd, articleJsonLd, breadcrumbJsonLd } from "@/src/lib/json-ld";
import { dict, pathFor, type Locale } from "@/src/lib/i18n";

/**
 * 사용 안내 본문, ko/en 공용. 여섯 절(하는 일, 시작, 테이블과 관계, 저장, 내보내기, 막힐 때) + 차례.
 *
 * ★적은 것은 직접 눌러 본 것뿐이다(e2e/live.mjs 가 같은 순서로 누른다).
 * ★광고는 이 쪽에 없다. 광고는 첫 화면 한 자리뿐이다(test/ads-path).
 */
export function GuideBody({ locale, revisedISO }: { locale: Locale; revisedISO: string }) {
  const t = dict(locale).guide;
  const sections = [
    { id: "what", title: t.s1Title, body: t.s1Body },
    { id: "start", title: t.s2Title, body: t.s2Body },
    { id: "model", title: t.s3Title, body: t.s3Body },
    { id: "save", title: t.s4Title, body: t.s4Body },
    { id: "export", title: t.s5Title, body: t.s5Body },
    { id: "trouble", title: t.s6Title, body: t.s6Body },
  ];
  return (
    <main className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-8 px-5 py-10">
      <JsonLd
        data={articleJsonLd({
          headline: t.jsonHeadline,
          description: t.jsonDesc,
          path: pathFor(locale, "/guide"),
          revisedISO,
          lang: locale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.breadcrumbHome, path: pathFor(locale, "/") },
          { name: t.breadcrumbSelf, path: pathFor(locale, "/guide") },
        ])}
      />

      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{t.h1}</h1>
        <p className="max-w-[52ch] text-sm leading-relaxed">{t.lead}</p>
      </header>

      <nav aria-label={t.tocLabel} className="text-sm">
        <p className="font-semibold">{t.tocLabel}</p>
        <ol className="list-decimal pl-5">
          {sections.map((s) => (
            <li key={s.id}>
              <a className="inline-flex min-h-8 items-center underline" href={`#${s.id}`}>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((s) => (
        <section key={s.id} className="flex flex-col gap-2">
          <h2 id={s.id} className="text-lg font-semibold">{s.title}</h2>
          {s.body.map((p) => (
            <p key={p} className="max-w-[60ch] text-sm leading-relaxed">{p}</p>
          ))}
        </section>
      ))}

      <nav className="text-sm">
        <Link href={locale === "en" ? "/en" : "/"} className="inline-flex min-h-8 items-center underline">
          {t.footerLink}
        </Link>
      </nav>

    </main>
  );
}
