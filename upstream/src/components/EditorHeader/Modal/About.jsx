import { useTranslation } from "react-i18next";

// Build facts are injected by vite define (scripts/build-editor.mjs).
/* global __ERD_COMMIT__ */
const COMMIT = typeof __ERD_COMMIT__ === "string" ? __ERD_COMMIT__ : "dev";
const SOURCE = "https://github.com/okwhrlgma-bit/erd";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 text-sm leading-6">
      <p>{t("about_original")}</p>
      <p>{t("about_agpl")}</p>
      <p>{t("about_warranty")}</p>
      <p>{t("about_ko_note")}</p>
      <ul className="list-disc ps-5">
        <li>
          <a href="/LICENSE.txt" target="_blank" rel="noreferrer" className="text-blue-600">
            {t("about_license_link")}
          </a>
        </li>
        <li>
          <a href={SOURCE} target="_blank" rel="noreferrer" className="text-blue-600">
            {t("about_source_link")}
          </a>
        </li>
        <li>
          {t("about_commit")}: <code>{COMMIT}</code>
        </li>
      </ul>
    </div>
  );
}
