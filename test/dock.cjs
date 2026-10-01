/*
 * Tablewise — dock.cjs
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 880 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  await p.goto('file://' + __dirname + '/page.html'); await p.waitForSelector('#loading', { state: 'detached' });
  await p.evaluate(() => { TW.explain.set(false); go('browse', 'customers'); TW.guide.open('learn'); }); await p.waitForTimeout(600);
  console.log('learn in helper:', await p.textContent('#guideBody .learn-title'));
  const box = async s => { const r = await p.$eval(s, e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.width)]; }); return r; };
  console.log('guide right:', await box('#guide'), 'main', await box('#main'));
  // resize guide
  const rz = await p.$('#guideResizer'); const bb = await rz.boundingBox();
  await p.mouse.move(bb.x + 3, bb.y + 300); await p.mouse.down(); await p.mouse.move(bb.x - 150, bb.y + 300, { steps: 5 }); await p.mouse.up();
  console.log('guide after resize:', await box('#guide'));
  await p.click('#dockLeft'); await p.waitForTimeout(200); console.log('dock left guide:', await box('#guide'), 'main', await box('#main'));
  await p.click('#dockFloat'); await p.waitForTimeout(200); console.log('float:', await p.$eval('#guide', e => getComputedStyle(e).position), await box('#guide'));
  const hd = await (await p.$('#guideHead .label')).boundingBox(); await p.mouse.move(hd.x + 5, hd.y + 5); await p.mouse.down(); await p.mouse.move(hd.x - 400, hd.y + 100, { steps: 5 }); await p.mouse.up();
  console.log('float moved:', await box('#guide'));
  await p.screenshot({ path: __dirname + '/dock_float.png' });
  await p.click('#dockFloat'); await p.waitForTimeout(200); console.log('re-docked:', await p.$eval('#guide', e => e.className));
  await p.click('#menuBtn'); await p.waitForTimeout(200); console.log('sidebar hidden:', await p.$eval('#sidebar', e => getComputedStyle(e).display));
  await p.click('#menuBtn');
  // compact learn: run example + next
  await p.evaluate(() => TW.guide.open('learn')); await p.waitForTimeout(300);
  await p.click('#guideBody .learn-cnav button:has-text("Next")'); await p.waitForTimeout(300); console.log('next lesson:', await p.textContent('#guideBody .learn-title'));
  await p.selectOption('#guideBody .learn-cnav select', 'where'); await p.waitForTimeout(300);
  await p.click('#guideBody .learn-ex button:has-text("Run")'); await p.waitForTimeout(300); console.log('example rows in dock:', await p.$$eval('#guideBody .learn-result tbody tr', r => r.length));
  await p.click('#guideBody .learn-where .linkbtn'); await p.waitForTimeout(900); console.log('show me main view:', await p.evaluate(() => TW.state.view), 'helper still learn:', await p.$$eval('#guideBody .learn-title', x => x.length));
  await p.screenshot({ path: __dirname + '/dock_left.png' });
  console.log('errors', errs); await b.close();
})();
