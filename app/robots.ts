import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://erd.gwirae.com";

export default function robots(): MetadataRoute.Robots {
  return {
    // ★Yeti(네이버 크롤러) 명시 — 한국 검색의 42~56% 가 네이버다.
    //   와일드카드로 이미 허용되지만, 명시가 있으면 규칙 해석이 어긋날 여지가 없다.
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: "Yeti", allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
