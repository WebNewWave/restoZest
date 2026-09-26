// Генератор QR-кодов для столов.
// Использование:
//   node scripts/make-qr.mjs "https://ваш-домен/t/7" assets/qr/table-7.svg
//   node scripts/make-qr.mjs --tables 1..12 https://ваш-домен [assets/qr/имя-концепта]
//
// Третий аргумент в режиме --tables — папка, куда класть файлы. У каждого концепта
// свой адрес, поэтому и свой набор кодов: assets/qr/espresso, assets/qr/lumen и т.д.
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const args = process.argv.slice(2);

async function make(url, out) {
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#2b1c15', light: '#ffffff' },
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, svg, 'utf8');
  console.log(`  ${out}  →  ${url}`);
}

if (args[0] === '--tables') {
  const range = args[1] ?? '1..12';
  const base = (args[2] ?? 'http://127.0.0.1:4201').replace(/\/$/, '');
  const dir = (args[3] ?? 'assets/qr').replace(/\/$/, '');
  const [from, to] = range.split('..').map(Number);
  console.log(`QR для столов (${dir}):`);
  for (let n = from; n <= to; n++) {
    await make(`${base}/t/${n}`, `${dir}/table-${n}.svg`);
  }
} else {
  const url = args[0] ?? 'http://127.0.0.1:4201/t/7';
  const out = args[1] ?? 'assets/qr/table-7.svg';
  await make(url, out);
}
