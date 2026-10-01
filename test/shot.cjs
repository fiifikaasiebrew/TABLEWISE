/*
 * Tablewise — shot.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 860 } });
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.click('#tree .tnode .tw >> nth=2'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/s_home.png' });
  await p.evaluate(() => go('browse', 'orders')); await p.waitForTimeout(400);
  await p.hover('#dataGrid tbody tr:nth-child(2) td.fk'); await p.waitForTimeout(200);
  await p.screenshot({ path: __dirname + '/s_browse.png' });
  await b.close();
})();
