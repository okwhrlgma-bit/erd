// ads.txt — 애드센스가 광고를 채우려면 사이트 루트에 게시자 인증이 있어야 한다.
// ★휴면: 게시자 ID(NEXT_PUBLIC_ADSENSE_CLIENT)가 없으면 빈 파일이다. ads-on.mjs 로 ID 를 넣고
//   재배포하면 인증 줄이 나온다. AdSlot 의 휴면과 같은 결이다.
export const dynamic = "force-dynamic";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  // ads.txt 의 pub 은 "ca-" 접두 없이 쓴다. f08c47fec0942fa0 은 구글의 고정 인증 기관 ID.
  const body = client ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n` : "";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
