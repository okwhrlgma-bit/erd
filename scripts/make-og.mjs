// 공유 카드 1200x630: 남색 바탕, 왼쪽에 ERD 그리기 글자, 오른쪽에 테이블 둘과 관계선. node scripts/make-og.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";

let cells = "";
const x0 = 880, y0 = 150, w = 66, h = 56, g = 8;
for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) {
  const fill = r === 0 ? "#f2c14e" : "#fafaf7";
  cells += `<rect x="${x0 + c * (w + g)}" y="${y0 + r * (h + g)}" width="${w}" height="${h}" rx="6" fill="${fill}" opacity="${r === 0 ? 1 : 0.92}"/>`;
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<rect width="1200" height="630" fill="#1f2a37"/>
${cells}
<text x="80" y="290" font-family="Malgun Gothic, Noto Sans KR, sans-serif" font-size="110" font-weight="700" fill="#fafaf7">ERD 그리기</text>
<text x="84" y="370" font-family="Malgun Gothic, Noto Sans KR, sans-serif" font-size="40" fill="#cbd5e1">가입 없이 쓰는 무료 ERD 편집기</text>
<text x="84" y="430" font-family="Malgun Gothic, Noto Sans KR, sans-serif" font-size="30" fill="#94a3b8">그린 ERD 는 기기 밖으로 나가지 않습니다.</text>
</svg>`;
writeFileSync("public/og-card.png", await sharp(Buffer.from(svg)).png().toBuffer());
console.log("ok");
