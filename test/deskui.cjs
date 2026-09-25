const Module = require('module'); const path = require('path'); const fs = require('fs'); const os = require('os');
const handlers = {}; const ud = fs.mkdtempSync(path.join(os.tmpdir(), 'twud'));
const fake = { app: { getPath: () => ud, requestSingleInstanceLock: () => false, quit() {}, on() {}, whenReady: () => new Promise(() => {}), getVersion: () => '1' }, ipcMain: { handle: (c, f) => handlers[c] = f }, dialog: {}, safeStorage: { isEncryptionAvailable: () => false }, shell: {}, Menu: { buildFromTemplate: () => ({}) }, net: {}, BrowserWindow: function () {} };
const orig = Module._load; Module._load = function (r, ...a) { return r === 'electron' ? fake : orig.call(this, r, ...a); };
require(path.join(__dirname, '../desktop/main.js'));
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  for (const kind of ['postgres', 'mysql']) {
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.exposeFunction('__ipc', async (ch, args) => { const r = await handlers[ch](null, ...args); return JSON.parse(JSON.stringify(r)); });
    await p.addInitScript(() => {
      const call = async (ch, ...a) => { const r = await window.__ipc(ch, a); if (!r.ok) throw new Error(r.error); return r.v; };
      window.twDesktop = new Proxy({}, { get: (t, k) => ({ connect: 'db:connect', testConnection: 'db:test', query: 'db:query', listTables: 'db:listTables', describe: 'db:describe', transaction: 'db:transaction', snapshot: 'db:snapshot', restore: 'db:restore', close: 'db:close', listConnections: 'conn:list', saveConnection: 'conn:save', deleteConnection: 'conn:delete', getAISettings: 'ai:get' })[k] ? (...a) => call(({ connect: 'db:connect', testConnection: 'db:test', query: 'db:query', listTables: 'db:listTables', describe: 'db:describe', transaction: 'db:transaction', snapshot: 'db:snapshot', restore: 'db:restore', close: 'db:close', listConnections: 'conn:list', saveConnection: 'conn:save', deleteConnection: 'conn:delete', getAISettings: 'ai:get' })[k], ...a) : undefined });
    });
    await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
    await p.goto('file://' + path.join(__dirname, '../desktop/app/index.html')); await p.waitForSelector('#loading', { state: 'detached' });
    await p.evaluate(k => TW.desk.connect({ kind: k, host: '127.0.0.1', port: k === 'mysql' ? 3306 : 5432, database: 'twdb', user: 'tw', password: 'tw' }), kind);
    await p.waitForTimeout(800);
    const out = [kind];
    out.push('tree: ' + await p.$$eval('#tree .tnode .nm', e => e.map(x => x.textContent).join(',')));
    await p.evaluate(() => go('browse', 'customers')); await p.waitForSelector('#dataGrid');
    await p.click('#addRowBtn'); await p.fill('#f_name', 'New Co'); await p.selectOption('#f_active', 'yes'); await p.click('.modal footer .btn.primary'); await p.waitForTimeout(500);
    out.push('rows: ' + await p.textContent('.grid-foot span'));
    await p.fill('#browseSearch', 'new'); await p.waitForTimeout(600); out.push('search: ' + await p.textContent('.grid-foot span'));
    const cell = (await p.$$('#dataGrid tbody tr:first-child td'))[4]; await cell.dblclick(); await p.keyboard.type('77.5'); await p.keyboard.press('Enter'); await p.waitForTimeout(500);
    out.push('edited credit: ' + await p.textContent('#dataGrid tbody tr:first-child td:nth-child(5)'));
    await p.evaluate(async () => { go('builder'); await new Promise(r => setTimeout(r, 200)); await qbAddTable('orders'); await qbAddTable('customers'); TW.qb.cols = [{ tid: TW.qb.tables[1].id, col: 'name', agg: '' }, { tid: null, col: '*', agg: 'COUNT' }]; TW.qb.sorts = [{ ref: 'out:1', dir: 'DESC' }]; go('builder'); });
    await p.waitForTimeout(700); await p.click('#qbRun'); await p.waitForTimeout(700);
    out.push('builder: ' + await p.$$eval('#qbResults tbody tr', r => r.map(x => x.textContent).join(' | ')));
    await p.evaluate(() => go('design', 'customers')); await p.waitForTimeout(400);
    await p.click('button:has-text("Add a column")'); await p.fill('#ncName', 'joined_on'); await p.selectOption('#ncType', 'date'); await p.click('.modal footer .btn.primary'); await p.waitForTimeout(600);
    out.push('cols: ' + await p.$$eval('.coltable tbody tr td:first-child', r => r.map(x => x.textContent).join(',')));
    await p.evaluate(() => go('import'));
    await p.setInputFiles('#importFile', { name: 'suppliers.csv', mimeType: 'text/csv', buffer: Buffer.from('Name,Rating,Since,Active\nAcme,4.5,2021-03-01,yes\nBeta,3,2019-07-12,no\n') });
    await p.waitForSelector('#impGo'); await p.click('#impGo'); await p.waitForTimeout(900);
    out.push('import: ' + await p.textContent('h1') + ' ' + await p.textContent('.grid-foot span'));
    await p.evaluate(() => go('sql')); await p.fill('#sqlEditor', 'SELECT name, rating FROM suppliers ORDER BY rating DESC'); await p.click('#sqlRun'); await p.waitForTimeout(500);
    out.push('sql: ' + await p.$$eval('.results tbody tr', r => r.map(x => x.textContent).join(' | ')));
    await p.evaluate(() => go('design', 'suppliers')); await p.waitForTimeout(300); await p.click('button:has-text("Delete table")'); await p.fill('#confirmType', 'suppliers'); await p.click('.modal footer .btn.danger'); await p.waitForTimeout(600);
    out.push('after drop: ' + await p.$$eval('#tree .tnode .nm', e => e.map(x => x.textContent).join(',')));
    out.push('errors: ' + JSON.stringify(errs) + ' toasts: ' + JSON.stringify(await p.$$eval('.toast.bad', t => t.map(x => x.textContent))));
    console.log(out.join('\n  ')); await b.close();
  }
  process.exit(0);
})();
