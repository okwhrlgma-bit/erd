// ERD 아이콘 생성: 남색 바탕에 테이블 둘과 까마귀발 관계선. node scripts/make-icons.mjs
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const svg = (n, bg = "#1f2a37") => {
  const u = n / 100;
  const table = (x, y) =>
    `<rect x="${x * u}" y="${y * u}" width="${34 * u}" height="${30 * u}" rx="${3 * u}" fill="#fafaf7"/>` +
    `<rect x="${x * u}" y="${y * u}" width="${34 * u}" height="${9 * u}" rx="${3 * u}" fill="#f2c14e"/>` +
    `<rect x="${(x + 5) * u}" y="${(y + 15) * u}" width="${24 * u}" height="${3 * u}" fill="#1f2a37"/>` +
    `<rect x="${(x + 5) * u}" y="${(y + 22) * u}" width="${16 * u}" height="${3 * u}" fill="#1f2a37"/>`;
  const line =
    `<path d="M ${51 * u} ${30 * u} L ${66 * u} ${30 * u} L ${66 * u} ${68 * u} L ${49 * u} ${68 * u}" fill="none" stroke="#fafaf7" stroke-width="${3 * u}"/>` +
    `<path d="M ${49 * u} ${68 * u} L ${40 * u} ${62 * u} M ${49 * u} ${68 * u} L ${40 * u} ${74 * u} M ${49 * u} ${68 * u} L ${40 * u} ${68 * u}" fill="none" stroke="#fafaf7" stroke-width="${3 * u}"/>`;
  const back = bg ? `<rect width="${n}" height="${n}" rx="${n * 0.18}" fill="${bg}"/>` : "";
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${n}" height="${n}">${back}${table(17, 15)}${table(17, 55)}${line}</svg>`,
  );
};
const png = (n, bg) => sharp(svg(n, bg)).png().toBuffer();
const ico = (p32) => {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(1, 4);
  head[6] = 32;
  head[7] = 32;
  head.writeUInt16LE(1, 10);
  head.writeUInt16LE(32, 12);
  head.writeUInt32LE(p32.length, 14);
  head.writeUInt32LE(22, 18);
  return Buffer.concat([head, p32]);
};
mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", await png(192));
writeFileSync("public/icons/icon-512.png", await png(512));
writeFileSync("app/apple-icon.png", await png(180));
const p32 = await png(32);
writeFileSync("app/favicon.ico", ico(p32));
// 상류 편집기 쪽 자산: 로고와 파비콘을 우리 것으로 바꾼다 (CHANGES.md 참고)
const U = "upstream/";
writeFileSync(U + "public/favicon.ico", ico(p32));
writeFileSync(U + "src/assets/logo_light_160.png", await png(160));
writeFileSync(U + "src/assets/logo_dark_160.png", await png(160));
writeFileSync(U + "src/assets/icon_dark_64.png", await png(64));
writeFileSync(U + "src/assets/icon-dark.png", await png(240));
const card = await sharp({
  create: { width: 1200, height: 630, channels: 3, background: "#1f2a37" },
})
  .composite([{ input: await png(420), gravity: "center" }])
  .png()
  .toBuffer();
writeFileSync(U + "public/hero_ss.png", card);
console.log("ok");
