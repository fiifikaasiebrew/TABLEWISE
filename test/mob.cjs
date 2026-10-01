/*
 * Tablewise — mob.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 820 } });
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  for (const v of ['home','browse','builder','design','sql','import','activity','connect','settings']) {
    await p.evaluate(v => go(v, v==='browse'?'customers':v==='design'?'orders':undefined), v); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const W = innerWidth; const bad = []; for (const el of document.querySelectorAll('#app *')) { const rc = el.getBoundingClientRect(); if (rc.right > W + 1 && rc.width > 0 && !el.closest('.grid-wrap,.canvas,pre,[style*="overflow"],.sidebar,.guide')) bad.push(el.tagName + '.' + el.className + ' ' + Math.round(rc.right)); } return [document.documentElement.scrollWidth, bad.slice(0, 5)]; });
    console.log(v, JSON.stringify(r));
  }
  await p.evaluate(() => go('home')); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/mhome.png' });
  await b.close();
})();
