/*
 * Tablewise — run.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html');
  await p.waitForSelector('#loading', { state: 'detached', timeout: 20000 });
  const log = (...a) => console.log(...a);
  log('tables:', await p.$$eval('#tree .tnode .nm', e => e.map(x => x.textContent).join(',')));
  await p.screenshot({ path: __dirname + '/home.png' });
  // browse customers
  await p.click('#tree .tnode:has-text("customers")');
  await p.waitForSelector('#dataGrid');
  log('rows shown:', await p.$$eval('#dataGrid tbody tr', r => r.length), await p.textContent('.grid-foot span'));
  await p.click('#addFilterBtn'); await p.waitForTimeout(100);
  const selects = await p.$$('.frule select');
  await selects[0].selectOption('city'); await selects[1].selectOption('eq');
  await p.fill('.frule input[aria-label="Value"]', 'Accra');
  await p.waitForTimeout(700);
  log('after filter:', await p.textContent('.grid-foot span'));
  await p.click('th:has-text("company_name")'); await p.waitForTimeout(200);
  // inline edit
  const cell = (await p.$$('#dataGrid tbody tr:first-child td'))[3];
  await cell.dblclick(); await p.keyboard.press('Control+A'); await p.keyboard.type('Test Contact'); await p.keyboard.press('Enter');
  await p.waitForTimeout(400);
  log('edited cell:', await p.textContent('#dataGrid tbody tr:first-child td:nth-child(4)'));
  // add row
  await p.click('#addRowBtn'); await p.fill('#f_company_name', 'Kaasiebrew Holdings'); await p.fill('#f_city', 'Accra');
  await p.click('.modal footer .btn.primary'); await p.waitForTimeout(400);
  log('after add:', await p.textContent('.grid-foot span'));
  // delete selected
  await p.check('#dataGrid tbody tr:first-child .ck input'); await p.click('#delSelBtn');
  await p.click('.modal footer .btn.danger'); await p.waitForTimeout(400);
  log('after delete:', await p.textContent('.grid-foot span'), 'undo visible:', await p.isVisible('#undoBtn'));
  await p.click('#undoBtn'); await p.waitForTimeout(400);
  // builder
  await p.click('nav button[data-view="builder"]'); await p.waitForSelector('#qbCanvas');
  await p.evaluate(async () => { await qbAddTable('orders'); await qbAddTable('customers'); });
  await p.click('#qbAddSel'); await p.selectOption('#qbAddSel', 'order_items'); await p.waitForTimeout(500);
  await p.check('.tcard:has-text("Customers") li[data-col="company_name"] input');
  await p.check('.tcard:has-text("Order Items") li[data-col="quantity"] input');
  await p.waitForTimeout(300);
  await p.selectOption('.colrow:has-text("Quantity") select[aria-label="Show or summarise"]', 'SUM'); await p.waitForTimeout(300);
  await p.click('text=+ Sort by'); await p.waitForTimeout(300);
  const sortSel = await p.$$('.side-panels .panel:has-text("Sort and limit") .frule select');
  await sortSel[0].selectOption('out:1'); await sortSel[1].selectOption('DESC');
  await p.waitForTimeout(300);
  log('english:', await p.textContent('.english'));
  await p.click('#qbRun'); await p.waitForTimeout(600);
  log('builder result rows:', await p.$$eval('#qbResults tbody tr', r => r.length), await p.$eval('#qbResults tbody tr', r => r.textContent));
  await p.screenshot({ path: __dirname + '/builder.png' });
  // design: create table
  await p.click('nav button[data-view="design"]'); await p.click('#createTableBtn');
  await p.click('.modal button:has-text("Tasks")'); await p.click('.modal footer .btn.primary'); await p.waitForTimeout(600);
  log('after create, view:', await p.textContent('h1'));
  await p.click('#addRowBtn'); await p.fill('#f_title', 'Call supplier'); await p.click('.modal footer .btn.primary'); await p.waitForTimeout(300);
  log('tasks rows:', await p.textContent('.grid-foot span'));
  // design add column with link
  await p.evaluate(() => go('design', 'tasks')); await p.waitForTimeout(300);
  await p.click('button:has-text("Add a column")'); await p.fill('#ncName', 'customer_id'); await p.selectOption('#ncType', 'link'); await p.selectOption('#ncLink', 'customers');
  await p.click('.modal footer .btn.primary'); await p.waitForTimeout(400);
  log('tasks columns:', await p.$$eval('.coltable tbody tr td:first-child', r => r.map(x => x.textContent).join(',')));
  // SQL editor
  await p.click('nav button[data-view="sql"]'); await p.fill('#sqlEditor', "SELECT status, COUNT(*) n FROM orders GROUP BY status ORDER BY n DESC;");
  await p.click('#sqlRun'); await p.waitForTimeout(300);
  log('sql rows:', await p.$$eval('.results tbody tr', r => r.map(x => x.textContent).join(' | ')));
  await p.fill('#sqlEditor', "SELEC * FROM nope"); await p.click('#sqlRun'); await p.waitForTimeout(300);
  log('sql error:', await p.textContent('.notice.bad b'));
  // import CSV
  await p.click('nav button[data-view="import"]');
  await p.setInputFiles('#importFile', { name: 'suppliers.csv', mimeType: 'text/csv', buffer: Buffer.from('Name,Country,Rating,Since,Active\n"Acme, Inc",Ghana,4.5,2021-03-01,yes\nBeta Co,Kenya,3,2019-07-12,no\n') });
  await p.waitForSelector('#impGo'); await p.click('#impGo'); await p.waitForTimeout(600);
  log('imported:', await p.textContent('h1'), await p.textContent('.grid-foot span'));
  const schema = await p.evaluate(async () => (await describe('suppliers')).columns.map(c => c.name + ':' + c.type).join(', '));
  log('suppliers schema:', schema);
  // activity + guide + ai tab
  await p.click('nav button[data-view="activity"]'); log('log items:', await p.$$eval('.log-item', r => r.length));
  await p.click('#aiBtn'); await p.waitForTimeout(200); log('ai panel:', (await p.textContent('#guideBody')).slice(0, 80));
  await p.fill('#chatInput', 'hi'); await p.click('#chatSend'); await p.waitForTimeout(500);
  log('ai reply (no claude runtime):', (await p.$$eval('.msg.ai', m => m[m.length - 1].textContent)).slice(0, 120));
  // tour
  await p.click('#tourBtn'); await p.waitForTimeout(500); log('tour:', await p.textContent('.tour-card h3'));
  await p.screenshot({ path: __dirname + '/tour.png' });
  await p.click('text=Skip tour');
  // mobile
  await p.setViewportSize({ width: 400, height: 800 }); await p.evaluate(() => go('browse', 'customers')); await p.waitForTimeout(400);
  const ow = await p.evaluate(() => document.documentElement.scrollWidth); log('mobile scrollWidth', ow);
  await p.screenshot({ path: __dirname + '/mobile.png' });
  log('ERRORS:', errs.length ? errs : 'none');
  await b.close();
})();
