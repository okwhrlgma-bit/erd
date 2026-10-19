import type { Metadata } from "next";
import { GuideBody } from "@/src/components/Guide";

export const metadata: Metadata = {
  title: "How to use Domyeonkan: open a drawing, command line, Korean text, save files",
  description:
    "Open a drawing and draw a line, dimensions and snap, Korean text, open and export files, and what to do when you get stuck.",
  alternates: { canonical: "/en/guide", languages: { ko: "/guide", en: "/en/guide" } },
};

export default function GuideEn() {
  return <GuideBody locale="en" revisedISO="2026-10-19" />;
}
