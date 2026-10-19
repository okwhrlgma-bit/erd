import type { NextConfig } from "next";

/*
 * ★앞단이 주입하는 추적 스크립트를 브라우저가 거부하게 만든다 (csp-beacon-block-v1 · 2026-09-01).
 *
 * 클라우드플레어가 우리 앱 HTML 에 beacon.min.js 를 자동으로 끼워 넣는다. 우리 코드에는
 * 없고, 끄는 자리는 클라우드플레어 계정 설정인데 터널 토큰에는 권한이 없다.
 * 그래서 우리 쪽에서 막는다. 내려받아 실행하는 것은 브라우저라, CSP 가 그 호스트를
 * 안 허용하면 값이 안 나간다. 태그는 남아도 기록은 안 간다.
 *
 * ★Next.js 하이드레이션이 인라인 스크립트라 'unsafe-inline' 은 남긴다. 막으려는 것은
 *   바깥 호스트다. ★광고를 켜는 날에는 그 호스트를 여기 더한다.
 */
/*
 * ★광고를 켠 날 이 자리를 같이 열어야 한다 (2026-09-05 · 실제로 빠뜨렸다).
 *
 *   위 주석이 "광고를 켜는 날에는 그 호스트를 여기 더한다"고 적어 두었는데, 오늘 애드센스를
 *   켜면서 그 단계를 건너뛰었다. 결과: 84개 앱이 광고 스크립트를 실어 놓고 **우리 CSP 가
 *   그것을 막아** 광고가 한 곳도 못 떴다. 슬롯은 있는데 채워질 수 없는 상태였고,
 *   방문자 브라우저마다 콘솔 오류가 하나씩 났다(데일리 검사 44/44 가 그 오류로 멈춰 있었다).
 *
 *   ★여는 것은 애드센스가 실제로 쓰는 호스트만이다. 클라우드플레어 beacon 은 **계속 막는다**
 *     (cloudflareinsights.com 을 넣지 않는다 — 위 주석의 본래 뜻).
 */
const AD_SCRIPT = "https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.googletagservices.com https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google";
const AD_FRAME = "https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google";
const AD_IMG = "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google";
const AD_CONNECT = "https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${AD_SCRIPT}`,
  // ranks.gwirae.com = 공용 구독 부품(src/components/rank · 꾸미기 테마 구독 확인) — 없으면 fetch 가 막힌다(rank docs/integration.md 2-1)
  // data: blob: 는 편집기의 이미지 내보내기(PNG 등)가 그림 조각을 기기 안에서 읽는 데 쓴다. 네트워크 요청이 아니다(2026-10-19).
  `connect-src 'self' data: blob: https://ranks.gwirae.com ${AD_CONNECT}`,
  // 편집기의 코드 창(monaco)이 작업 스레드를 blob: 로 만든다. 기기 안에서 도는 것이라 네트워크 요청이 아니다(2026-10-19).
  "worker-src 'self' blob:",
  `frame-src ${AD_FRAME}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${AD_IMG}`,
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  // 자체 운영 빌드에서만 standalone(개발 편의 유지 — gambitry 동일 패턴)
  ...(process.env.WC_SELFHOST ? ({ output: "standalone" } as const) : {}),
  /* config options here */
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev()).catch(() => {});
