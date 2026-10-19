import type { Metadata } from "next";
import { HomeBody } from "@/src/components/Home";

/**
 * 290 first screen (en). Same body component as ko. The title uses the phrases people search for.
 */
export const metadata: Metadata = {
  title: "Free ERD maker with no sign-up: draw tables and relations | ERD Maker",
  description:
    "Draw tables and relations in your browser and make an ER diagram. Export PNG, PDF or SQL. Your diagram stays in this browser and is never sent to a server.",
  alternates: { canonical: "/en", languages: { ko: "/", en: "/en" } },
};

export default function HomeEn() {
  return <HomeBody locale="en" />;
}
