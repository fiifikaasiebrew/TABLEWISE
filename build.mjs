// Builds the browser artifact page and the desktop app page from src/
import fs from 'node:fs';
const R = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const NM = './desktop/node_modules/';
const shell = R('./src/shell.html').replace('/*STYLE*/', R('./src/style.css'));
const sqljs = R(NM + 'sql.js/dist/sql-wasm-browser.js');
const wasm = fs.readFileSync(new URL(NM + 'sql.js/dist/sql-wasm-browser.wasm', import.meta.url)).toString('base64');
const order = ['sqlite-core.js', 'sample-data.js', 'app-core.js', 'view-home.js', 'view-browse.js', 'view-builder.js', 'view-design.js', 'sql-library.js', 'view-sql.js', 'learn-1.js', 'learn-2.js', 'learn-3.js', 'learn-4.js', 'view-learn.js', 'view-import.js', 'view-misc.js', 'guide.js', 'explain.js', 'app-main.js'];
const app = order.map(f => `/* ==== ${f} ==== */\n` + R('./src/' + f)).join('\n');
const VERSION = JSON.parse(R('./desktop/package.json')).version;
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const body = (xlsxTag) => `${shell}
${xlsxTag}
<script>${safe(sqljs)}</script>
<script>window.TW_WASM_B64="${wasm}";window.TW_VERSION="${VERSION}";</script>
<script>${safe(app)}</script>
`;
fs.mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./dist/tablewise.html', import.meta.url), body('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>'));
fs.mkdirSync(new URL('./desktop/app/lib/', import.meta.url), { recursive: true });
fs.copyFileSync(new URL(NM + 'xlsx/dist/xlsx.full.min.js', import.meta.url), new URL('./desktop/app/lib/xlsx.full.min.js', import.meta.url));
fs.copyFileSync(new URL('./src/sqlite-core.js', import.meta.url), new URL('./desktop/app/sqlite-core.js', import.meta.url));
fs.writeFileSync(new URL('./desktop/app/index.html', import.meta.url), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>[hidden]{display:none!important}</style>
</head><body>
${body('<script src="lib/xlsx.full.min.js"></script>')}
</body></html>`);
console.log('built', (fs.statSync(new URL('./dist/tablewise.html', import.meta.url)).size / 1e6).toFixed(2) + ' MB');
