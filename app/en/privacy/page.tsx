import type { Metadata } from "next";
import { PrivacyBody } from "@/src/components/Privacy";

export const metadata: Metadata = {
  title: "Privacy Policy / 개인정보 처리방침",
  robots: { index: false },
  alternates: { canonical: "/en/privacy", languages: { ko: "/privacy", en: "/en/privacy" } },
};

export default function PrivacyEn() {
  return <PrivacyBody locale="en" />;
}
