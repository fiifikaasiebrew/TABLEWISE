/*
 * Tablewise — shot3.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const scheme of ['light','dark']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 880 }, colorScheme: scheme });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u=r.request().url(); (u.startsWith('file:')||u.includes('fonts.g')) ? r.continue() : r.abort(); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); }); 
  await p.evaluate(() => go('browse', 'customers')); await p.waitForTimeout(400);
  await p.hover('#dataGrid th:nth-child(7)'); await p.click('#dataGrid th:nth-child(7) .th-filter'); await p.waitForTimeout(200);
  await p.keyboard.type('Accra'); await p.waitForTimeout(700);
  console.log(scheme, await p.textContent('.grid-foot span'), errs);
  await p.screenshot({ path: __dirname + `/w_${scheme}.png` });
  }
  await b.close();
})();
