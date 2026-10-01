/*
 * Tablewise — learn2.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); TW.guide.close(); });
  const res = await p.evaluate(async () => {
    const out = { lessons: LESSONS.length, levels: LEVELS.map(l => l[0] + ':' + LESSONS.filter(x => x.lv === l[0]).length).join(' '), practice: 0, quiz: 0, exFail: [], demoFail: [], tryFail: [], appBad: [], missing: [] };
    for (const L of LESSONS) {
      for (const k of ['t', 'story', 'body', 'how']) if (!L[k]) out.missing.push(L.id + ' ' + k);
      const ad = await TW.learn.ensure(true);
      if (L.demo) try { await ad.query(L.demo[0], []); } catch (e) { out.demoFail.push(L.id + ': ' + e.message); }
      for (const [q] of (L.ex || [])) { try { await ad.query(q, []); } catch (e) { out.exFail.push(L.id + ': ' + e.message.slice(0, 90)); } }
      for (const T of (L.practice || [])) {
        out.practice++;
        try {
          await TW.learn.ensure(true);
          if (T.check) { const c = await TW.learn.clone(); await c.query(T.answer, []); const r = await c.query(T.check, []); if (!r.rows.length) out.tryFail.push(L.id + ' check empty'); c.close(); }
          else { const r = await TW.learn.adapter.query(T.answer, []); if (!r.rows.length) out.tryFail.push(L.id + ' no rows: ' + T.task.slice(0, 40)); }
        } catch (e) { out.tryFail.push(L.id + ': ' + e.message); }
      }
      out.quiz += (L.quiz || []).length;
      for (const w of (L.app || [])) if (!TW.views[w[1]]) out.appBad.push(L.id + ' -> ' + w[1]);
    }
    await TW.learn.ensure(true);
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await p.click('#nav button[data-view="learn"]'); await p.waitForTimeout(400);
  await p.evaluate(() => { store.set('learnCur', 'where'); go('learn'); }); await p.waitForTimeout(500);
  await p.fill('.learn-try >> nth=0', "SELECT * FROM orders WHERE status = 'pending'"); await p.click('.learn-check >> nth=0'); await p.waitForTimeout(200);
  console.log('task1:', await p.textContent('.learn-feedback >> nth=0'));
  await p.screenshot({ path: __dirname + '/learn2.png', fullPage: false });
  await p.evaluate(() => go('learn', 'data')); await p.waitForTimeout(300);
  await p.click('.learn-opts button >> nth=0'); await p.waitForTimeout(100); console.log('quiz fb:', await p.textContent('.learn-qfb'));
  await p.evaluate(() => go('learn', 'tables')); await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/learn3.png' });
  console.log('errors', errs); await b.close();
})();
