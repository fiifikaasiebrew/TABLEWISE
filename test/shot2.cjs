/*
 * Tablewise — shot2.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 880 } });
  const errs=[]; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => { const u=r.request().url(); (u.startsWith('file:')||u.includes('fonts.g')) ? r.continue() : r.abort(); });
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); TW.guide.close(); }); await p.waitForTimeout(600);
  await p.screenshot({ path: __dirname + '/v_home.png' });
  await p.evaluate(() => go('browse', 'orders')); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/v_browse.png' });
  await p.evaluate(async () => { go('builder'); await new Promise(r=>setTimeout(r,200)); await qbAddTable('orders'); await qbAddTable('customers'); TW.qb.cols=[{tid:TW.qb.tables[1].id,col:'company_name',agg:''},{tid:null,col:'*',agg:'COUNT'}]; TW.qb.sorts=[{ref:'out:1',dir:'DESC'}]; TW.qb.limit=10; go('builder'); });
  await p.waitForTimeout(600); await p.click('#qbRun'); await p.waitForTimeout(600); await p.evaluate(()=>$('#viewHost').scrollTop=0); await p.screenshot({ path: __dirname + '/v_builder.png' });
  await p.evaluate(() => go('design', 'orders')); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/v_design.png' });
  console.log(errs);
  await b.close();
})();
