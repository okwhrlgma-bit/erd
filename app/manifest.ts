import type { MetadataRoute } from "next";

/**
 * PWA manifest. 조용한 PWA: 홈 화면에 올려 두면 여는 길이 짧아진다. 푸시와 재촉은 없다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ERD 그리기",
    short_name: "ERD 그리기",
    description: "가입 없이 브라우저에서 테이블과 관계를 그려 ERD 를 만드는 무료 편집기입니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#1f2a37",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
