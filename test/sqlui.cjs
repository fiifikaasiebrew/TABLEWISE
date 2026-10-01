/*
 * Tablewise — sqlui.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); TW.guide.close(); go('sql'); }); await p.waitForTimeout(500);
  console.log('lib items:', await p.$$eval('.lib-item', x => x.length));
  await p.selectOption('.sqllib select', 'Window functions'); await p.click('.lib-title:has-text("Running total")'); await p.click('.lib-item.open button:has-text("Try it")'); await p.waitForTimeout(400);
  console.log('running total rows:', await p.$$eval('.results tbody tr', r => r.length), await p.$eval('.results thead', t => t.textContent));
  await p.fill('#libSearch', 'month'); await p.waitForTimeout(100); console.log('search month:', await p.$$eval('.lib-title span:first-child', x => x.map(y => y.textContent).join(' | ')));
  // autocomplete
  await p.fill('#sqlEditor', ''); await p.type('#sqlEditor', 'SELECT * FROM cust');
  await p.waitForTimeout(150); console.log('ac:', await p.$$eval('.ac-item', x => x.map(y => y.textContent).join(' | ')));
  await p.keyboard.press('Tab'); console.log('editor:', await p.inputValue('#sqlEditor'));
  await p.click('button:has-text("How will it run?")'); await p.waitForTimeout(300); console.log('plan:', (await p.textContent('.results')).slice(0, 120));
  await p.screenshot({ path: __dirname + '/sql.png' });
  // builder calc + fn + having
  const r = await p.evaluate(async () => {
    go('builder'); await new Promise(r => setTimeout(r, 200));
    await qbAddTable('order_items'); await qbAddTable('orders');
    const [oi, o] = TW.qb.tables;
    TW.qb.cols = [{ tid: o.id, col: 'order_date', fn: 'YM', agg: '' }, { calc: { a: { tid: oi.id, col: 'quantity' }, op: '*', b: { tid: oi.id, col: 'unit_price' } }, label: 'line_total', agg: 'SUM' }, { tid: null, col: '*', agg: 'COUNT' }];
    TW.qb.having = [{ ref: 1, op: '>=', v: '5000' }];
    TW.qb.filters.rules = [{ key: o.id + '|order_date', op: 'thisyear', ft: 'date' }];
    TW.qb.sorts = [{ ref: 'out:0', dir: 'ASC' }];
    const bq = qbBuild(); const res = await TW.adapter.query(bq.sql, bq.params);
    return { sql: bq.sql, english: bq.english.replace(/<[^>]+>/g, ''), rows: res.rows.slice(0, 4) };
  });
  console.log(r.sql); console.log(r.english); console.log(JSON.stringify(r.rows));
  await p.evaluate(() => go('builder')); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/builder2.png' });
  // browse date filter
  await p.evaluate(() => go('browse', 'orders')); await p.waitForTimeout(300);
  await p.click('#dataGrid th:nth-child(5) .th-filter'); await p.selectOption('.frule select[aria-label="Condition"]', 'lastdays'); await p.fill('.frule input[aria-label="Value"]', '30'); await p.waitForTimeout(700);
  console.log('last 30 days:', await p.textContent('.grid-foot span'));
  await p.selectOption('.frule select[aria-label="Condition"]', 'thismonth'); await p.waitForTimeout(500); console.log('this month:', await p.textContent('.grid-foot span'));
  console.log('errors', errs); await b.close();
})();
