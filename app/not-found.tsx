/** 404 - 기본 영문 화면 대체. 두 언어 한 줄 + 돌아가는 링크. */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-3 p-10 text-center">
      <p className="text-sm leading-relaxed">
        이 주소에는 페이지가 없습니다. ERD 는 첫 화면에서 시작합니다.
        <br />
        <span className="text-neutral-700">This page does not exist. The drawing editor opens from the home page.</span>
      </p>
      <a className="inline-flex min-h-8 items-center underline" href="/">돌아가기 / Home</a>
    </main>
  );
}
