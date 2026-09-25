const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); TW.guide.close(); });
  // all examples + all exercise answers on fresh practice copies
  const res = await p.evaluate(async () => {
    const out = { lessons: LESSONS.length, exFail: [], tryFail: [], whereBad: [] };
    for (const L of LESSONS) {
      const ad = await TW.learn.ensure(true);
      for (const q of (L.sql || [])) { if (/^\s*--/.test(q) && !/SELECT/i.test(q.replace(/--.*$/gm, ''))) continue; try { await ad.query(q, []); } catch (e) { out.exFail.push(L.id + ': ' + e.message); } }
      if (L.try) {
        try {
          const ad2 = await TW.learn.ensure(true);
          if (L.try.check) { const c = await TW.learn.clone(); await c.query(L.try.answer, []); const r = await c.query(L.try.check, []); if (!r.rows.length || (r.rows[0][0] === 0 && /COUNT/.test(L.try.check) && L.id !== 'delete')) out.tryFail.push(L.id + ' check empty'); }
          else { const r = await ad2.query(L.try.answer, []); if (!r.rows.length) out.tryFail.push(L.id + ' no rows'); }
        } catch (e) { out.tryFail.push(L.id + ': ' + e.message); }
      }
      for (const w of (L.where || [])) if (!TW.views[w[1]]) out.whereBad.push(L.id + ' -> ' + w[1]);
    }
    await TW.learn.ensure(true);
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  // UI flow
  await p.click('#nav button[data-view="learn"]'); await p.waitForTimeout(300);
  await p.click('.learn-link:has-text("WHERE: keeping only some rows")'); await p.waitForTimeout(200);
  await p.click('.learn-ex button:has-text("Run")'); await p.waitForTimeout(200);
  console.log('example rows:', await p.$$eval('.learn-result tbody tr', r => r.length));
  await p.fill('#learnTry', "SELECT * FROM orders WHERE status = 'shipped'"); await p.click('#learnCheck'); await p.waitForTimeout(200);
  console.log('wrong:', await p.textContent('.learn-feedback'));
  await p.fill('#learnTry', "select id, customer_id, employee_id, order_date, status, ship_city from orders where status='pending'"); await p.click('#learnCheck'); await p.waitForTimeout(200);
  console.log('right:', await p.textContent('.learn-feedback'), '| done:', await p.textContent('.learn-nav > p'));
  await p.click('.learn-link:has-text("INSERT: adding rows")'); await p.waitForTimeout(200);
  await p.fill('#learnTry', "INSERT INTO departments (name, floor, budget) VALUES ('Research', 4, 90000)"); await p.click('#learnCheck'); await p.waitForTimeout(300);
  console.log('insert check:', await p.textContent('.learn-feedback'));
  await p.screenshot({ path: __dirname + '/learn.png' });
  await p.click('.learn-where .linkbtn >> nth=0'); await p.waitForTimeout(1200);
  console.log('show me went to:', await p.evaluate(() => TW.state.view), await p.$$eval('.tour-ring', x => x.length));
  console.log('errors', errs); await b.close();
})();
