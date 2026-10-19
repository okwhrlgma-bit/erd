import type { Metadata } from "next";
import { CreditsBody } from "@/src/components/Credits";

export const metadata: Metadata = {
  title: "Domyeonkan credits and licenses: unofficial build and font notice",
  description:
    "Source repository, the MIT and Apache-2.0 dual license, the built-in Korean font license and the unofficial build notice for the editor.",
  alternates: { canonical: "/en/credits", languages: { ko: "/credits", en: "/en/credits" } },
};

export default function CreditsEn() {
  return <CreditsBody locale="en" revisedISO="2026-10-19" />;
}
