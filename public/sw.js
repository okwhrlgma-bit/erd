/*
 * 서비스 워커 — 설치와 오프라인.
 *
 * ★왜(2026-08-31 · PO "모든 앱 다운로드 하도록"): manifest 와 아이콘은 있는데 서비스 워커가
 *   없어서 브라우저가 설치를 권하지 않았고, 네트워크가 없으면 아예 안 열렸다.
 * ★라이브러리를 안 얹는다. 화면이 몇 개뿐이라 네트워크 우선에 실패하면 캐시 한 겹이면 된다.
 * ★새 배포가 옛 화면에 갇히지 않도록 **네트워크를 먼저** 본다(라이브 회귀 금지).
 */
const CACHE = "shell-v1";
const SHELL = ["/"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // ERD 편집기(/open/)의 큰 파일은 서비스 워커 캐시에 복사하지 않는다. 브라우저 HTTP 캐시에 맡긴다.
  if (url.pathname.startsWith("/open/")) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? caches.match("/"))),
  );
});
