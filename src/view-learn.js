/* Learn SQL: course view. Everything runs on a private practice copy, so real data is never touched. */
TW.learn = {
  db: null, adapter: null,
  async ensure(reset) {
    if (this.adapter && !reset) return this.adapter;
    const S = await sqlEngine();
    if (this.db) try { this.db.close(); } catch (e) { }
    this.db = new S.Database(); this.db.run(TWSample.buildSampleSQL());
    this.adapter = TWSqlite.makeSqliteAdapter(this.db, { name: 'Practice copy' });
    return this.adapter;
  },
  async clone() { const S = await sqlEngine(); return TWSqlite.makeSqliteAdapter(new S.Database(this.adapter.exportBytes()), { name: 'check' }); },
  done() { return new Set(store.get('learnDone', [])); },
  mark(id) { const d = this.done(); d.add(id); store.set('learnDone', [...d]); }
};
function showMe(view, arg, sel) {
  const exists = !arg || TW.state.tables.some(t => t.name === arg);
  go(view, exists ? arg : undefined).then(() => {
    if (!sel) return;
    setTimeout(() => {
      const el = $(sel); if (!el) return;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        const r = el.getBoundingClientRect();
        const ring = h('div', { class: 'tour-ring', style: { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: Math.min(r.height, innerHeight - 40) + 12 + 'px' } });
        document.body.append(ring); setTimeout(() => ring.remove(), 2200);
      }, 300);
    }, 250);
  });
  if (!exists) toast(`This database has no "${arg}" table, so the screen opened without it. Load the practice database from "Open a database" to follow along exactly.`);
}
function normRows(rows, ordered) {
  const out = rows.map(r => JSON.stringify(r.map(v => typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v === null ? null : String(v))));
  return ordered ? out : out.sort();
}
function learnMd(text) {                 // markdown with ``` code fences rendered as highlighted SQL
  const box = h('div', { class: 'learn-md' });
  String(text).split(/```\w*\n?([\s\S]*?)```/g).forEach((part, i) => {
    if (i % 2) box.append(sqlBlock(part.replace(/\n$/, '')));
    else if (part.trim()) box.append(h('div', { html: miniMarkdown(part) }));
  });
  return box;
}
TW.views.learn = async function (root, arg, opts) {
  opts = opts || {};
  root.classList.add(opts.compact ? 'learn-compact' : 'learnview');
  await TW.learn.ensure();
  let cur = arg || store.get('learnCur', LESSONS[0].id);
  if (!LESSONS.find(l => l.id === cur)) cur = LESSONS[0].id;
  const nav = h('nav', { class: 'learn-nav', 'aria-label': 'Lessons' });
  const body = h('article', { class: 'learn-body' });
  if (opts.compact) root.append(nav, body);
  else root.append(h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Learn SQL'), h('p', { class: 'sub' }, `A complete course in ${LESSONS.length} lessons and ${LEVELS.length} levels, from "what is data?" to window functions, security and a full project. Every new word is explained before it is used. Examples and exercises run on a private practice copy, so your real data is never touched.`)),
    h('div', { class: 'row' },
      h('button', { class: 'btn', title: 'Keep the lesson open in the side panel while you use the rest of the app', onclick: () => { TW.guide.open('learn'); go('home'); } }, 'Dock beside the app'),
      h('button', { class: 'btn', onclick: async () => { await TW.learn.ensure(true); toast('Practice copy reset to fresh data.'); } }, 'Reset practice data'))),
    h('div', { class: 'learn' }, nav, body));

  function drawNav() {
    const done = TW.learn.done();
    if (opts.compact) {
      const i = LESSONS.findIndex(l => l.id === cur);
      nav.className = 'learn-cnav';
      nav.replaceChildren(
        h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', { class: 'faint', style: { fontSize: '12.5px' } }, `${done.size} of ${LESSONS.length} lessons done`),
          h('button', { class: 'linkbtn', style: { fontSize: '12.5px' }, onclick: () => go('learn', cur) }, 'Open full page')),
        h('select', { class: 'select', 'aria-label': 'Choose a lesson', onchange: e => open(e.target.value) }, LEVELS.map(([lv, name]) => h('optgroup', { label: name }, LESSONS.filter(l => l.lv === lv).map(l => h('option', { value: l.id, selected: l.id === cur }, (done.has(l.id) ? '✓ ' : '') + l.t))))),
        h('div', { class: 'row', style: { gap: '6px' } }, h('button', { class: 'btn sm', disabled: i <= 0, onclick: () => open(LESSONS[i - 1].id) }, '← Previous'), h('button', { class: 'btn sm', disabled: i >= LESSONS.length - 1, onclick: () => open(LESSONS[i + 1].id) }, 'Next →'),
          h('button', { class: 'btn sm ghost', style: { marginLeft: 'auto' }, title: 'Reset the practice copy', onclick: async () => { await TW.learn.ensure(true); toast('Practice copy reset to fresh data.'); } }, 'Reset data')));
      return;
    }
    nav.replaceChildren(h('p', { class: 'faint', style: { fontSize: '12.5px', marginBottom: '8px' } }, `${done.size} of ${LESSONS.length} lessons done`),
      ...LEVELS.map(([lv, name, blurb]) => {
        const ls = LESSONS.filter(l => l.lv === lv);
        const n = ls.filter(l => done.has(l.id)).length;
        return h('div', { class: 'learn-level' }, h('div', { class: 'learn-level-head', title: blurb }, h('span', null, name), h('span', { class: 'faint num' }, `${n}/${ls.length}`)),
          ...ls.map(l => h('button', { class: 'learn-link' + (l.id === cur ? ' on' : ''), 'aria-current': l.id === cur ? 'true' : null, onclick: () => open(l.id) }, h('span', { class: 'tick' }, done.has(l.id) ? '✓' : ''), l.t)));
      }));
    const on = nav.querySelector('.learn-link.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }
  function open(id) { cur = id; store.set('learnCur', id); drawNav(); drawLesson(); const sc = opts.compact ? root.closest('.guide-body') : $('#viewHost'); if (sc) sc.scrollTop = 0; }
  async function runInto(sql, box, adapter) {
    box.replaceChildren(h('p', { class: 'faint' }, 'Running…'));
    try {
      const r = await (adapter || TW.learn.adapter).query(sql, []);
      const sets = (r.sets && r.sets.length ? r.sets : [{ columns: r.columns, rows: r.rows }]).filter(s => s.columns && s.columns.length);
      if (!sets.length) { box.replaceChildren(h('p', { class: 'notice good' }, isWrite(sql) ? `Done. ${plural(r.changes || 0, 'row')} changed in the practice copy.` : 'Done.')); return; }
      box.replaceChildren(...sets.map(s => h('div', null, h('p', { class: 'faint', style: { fontSize: '12px', margin: '6px 0' } }, plural(s.rows.length, 'row') + (s.rows.length > 50 ? ', first 50 shown' : '')), resultGrid(s.columns, s.rows, { height: '260px', max: 50 }))));
    } catch (e) { box.replaceChildren(errorNotice(e)); }
  }
  const sec = (title, ...kids) => h('section', { class: 'learn-sec' }, h('h3', null, title), ...kids);
  function drawLesson() {
    const i = LESSONS.findIndex(l => l.id === cur); const L = LESSONS[i];
    const level = LEVELS.find(x => x[0] === L.lv);
    const done = TW.learn.done().has(L.id);
    const parts = [
      h('p', { class: 'label' }, `${level[1]} · lesson ${i + 1} of ${LESSONS.length}`),
      h('h2', { class: 'learn-title' }, L.t),
      L.goal ? h('p', { class: 'learn-goal' }, h('b', null, 'You will learn: '), L.goal) : null,
      h('p', { class: 'learn-story' }, L.story)].filter(Boolean);
    if (L.words && L.words.length) parts.push(sec('New words in this lesson', h('dl', { class: 'learn-words' }, L.words.flatMap(([w, m]) => [h('dt', null, w), h('dd', null, m)]))));
    parts.push(sec('Explained', learnMd(L.body)));
    if (L.demo) { const box = h('div', { class: 'learn-result' }); parts.push(h('div', { class: 'learn-demo' }, h('p', { class: 'faint', style: { fontSize: '12.5px', marginBottom: '6px' } }, 'Picture: ' + L.demo[1]), box)); runInto(L.demo[0], box); }
    if (L.anatomy) parts.push(sec('Reading it piece by piece', sqlBlock(L.anatomy.sql), h('table', { class: 'coltable learn-anat' }, h('tbody', null, L.anatomy.parts.map(([p, m]) => h('tr', null, h('td', { class: 'mono' }, p), h('td', null, m)))))));
    if (L.when) parts.push(sec('When you would use it', h('p', null, L.when)));
    if (L.how) parts.push(sec('How to go about it', Array.isArray(L.how) ? h('ol', { class: 'learn-steps' }, L.how.map(s => h('li', { html: miniMarkdown(s).replace(/^<p>|<\/p>$/g, '') }))) : learnMd(L.how)));
    if (L.app && L.app.length) parts.push(sec('In Tablewise (this program)', h('ul', { class: 'learn-where' }, L.app.map(([text, view, arg, sel]) => h('li', null, text, ' ', h('button', { class: 'linkbtn', onclick: () => showMe(view, arg, sel) }, 'Show me →'))))));
    if (L.ex && L.ex.length) {
      const exs = h('div');
      for (const [q, note] of L.ex) {
        const box = h('div', { class: 'learn-result' });
        exs.append(h('div', { class: 'learn-ex' }, note ? h('p', { class: 'learn-note' }, note) : null, sqlBlock(q), h('div', { class: 'row', style: { gap: '6px', marginTop: '6px' } },
          h('button', { class: 'btn sm primary', onclick: () => runInto(q, box) }, 'Run'),
          h('button', { class: 'btn sm ghost', onclick: () => { TW.sqlDraft = q; go('sql'); } }, 'Open in the SQL editor'),
          isWrite(q) ? h('span', { class: 'faint', style: { fontSize: '12px' } }, 'Changes the practice copy only.') : null), box));
      }
      parts.push(sec(L.ex.length > 1 ? 'Try these examples (in order)' : 'Try this example', exs));
    }
    if (L.mistakes && L.mistakes.length) parts.push(sec('Common mistakes', h('ul', { class: 'learn-mistakes' }, L.mistakes.map(m => h('li', null, m)))));
    let checks = [];
    if (L.quiz && L.quiz.length) {
      const qwrap = h('div');
      const state = L.quiz.map(() => false);
      L.quiz.forEach(([q, opts, right, why], qi) => {
        const fb = h('p', { class: 'learn-qfb' });
        qwrap.append(h('div', { class: 'learn-q' }, h('p', null, h('b', null, `${qi + 1}. `), q),
          h('div', { class: 'learn-opts' }, opts.map((o, oi) => h('button', {
            class: 'btn sm', onclick: e => {
              const ok = oi === right; state[qi] = ok;
              [...e.target.parentElement.children].forEach(b => b.classList.remove('on-right', 'on-wrong'));
              e.target.classList.add(ok ? 'on-right' : 'on-wrong');
              fb.replaceChildren(h('span', { class: ok ? 'good-t' : 'bad-t' }, ok ? 'Right. ' : 'Not quite. '), why);
              if (state.every(Boolean) && !(L.practice && L.practice.length)) { TW.learn.mark(L.id); drawNav(); }
            }
          }, o))), fb));
      });
      parts.push(sec('Quick check', qwrap));
    }
    if (L.practice && L.practice.length) {
      const pwrap = h('div');
      const solved = L.practice.map(() => false);
      L.practice.forEach((T, pi) => {
        const key = 'learnDraft:' + L.id + ':' + pi;
        const ta = h('textarea', { class: 'sql-editor learn-try', spellcheck: 'false', 'aria-label': 'Your SQL', placeholder: 'Type your SQL here, then press "Check my answer" (or Ctrl+Enter)…' });
        ta.value = store.get(key, '');
        ta.addEventListener('input', () => store.set(key, ta.value));
        const fb = h('div', { class: 'learn-feedback' }); const box = h('div', { class: 'learn-result' });
        async function check() {
          const mine = ta.value.trim().replace(/;\s*$/, '');
          if (!mine) { fb.replaceChildren(h('p', { class: 'notice warn' }, 'Type your SQL first.')); return; }
          try {
            let a, b;
            if (T.check) {
              const c1 = await TW.learn.clone(), c2 = await TW.learn.clone();
              await c1.query(mine, []); await c2.query(T.answer, []);
              a = await c1.query(T.check, []); b = await c2.query(T.check, []);
              c1.close(); c2.close();
            } else { a = await TW.learn.adapter.query(mine, []); b = await TW.learn.adapter.query(T.answer, []); }
            await runInto('', box, { query: async () => a });
            const ok = a.columns.length === b.columns.length && JSON.stringify(normRows(a.rows, !!T.ordered)) === JSON.stringify(normRows(b.rows, !!T.ordered));
            if (ok) {
              solved[pi] = true;
              if (solved.every(Boolean)) { TW.learn.mark(L.id); drawNav(); }
              fb.replaceChildren(h('p', { class: 'notice good' }, h('b', null, 'Correct. '), 'Your answer matches.', solved.every(Boolean) && i < LESSONS.length - 1 ? h('button', { class: 'linkbtn', style: { marginLeft: '8px' }, onclick: () => open(LESSONS[i + 1].id) }, 'Next lesson →') : null));
            } else {
              const why = a.columns.length !== b.columns.length ? `Your answer has ${plural(a.columns.length, 'column')}; the expected answer has ${b.columns.length}.` : a.rows.length !== b.rows.length ? `Your answer has ${plural(a.rows.length, 'row')}; the expected answer has ${b.rows.length}.` : 'The values are not quite the same' + (T.ordered ? ', or not in the same order.' : '.');
              fb.replaceChildren(h('p', { class: 'notice warn' }, h('b', null, 'Not yet. '), why, ' Try the hint.'));
            }
          } catch (e) { fb.replaceChildren(errorNotice(e)); }
        }
        ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); check(); } });
        pwrap.append(h('div', { class: 'learn-task' },
          h('p', null, h('b', null, L.practice.length > 1 ? `Task ${pi + 1}. ` : ''), T.task, T.check ? h('span', { class: 'faint' }, ' (This changes data: it is checked on a fresh copy each time.)') : null),
          h('div', { class: 'ed-wrap' }, ta),
          h('div', { class: 'row', style: { gap: '6px', marginTop: '8px' } },
            h('button', { class: 'btn primary learn-check', onclick: check }, 'Check my answer'),
            h('button', { class: 'btn', onclick: () => fb.replaceChildren(h('p', { class: 'notice' }, h('b', null, 'Hint: '), h('span', { class: 'mono' }, T.hint))) }, 'Hint'),
            h('button', { class: 'btn ghost', onclick: () => { ta.value = T.answer; store.set(key, ta.value); fb.replaceChildren(h('p', { class: 'notice' }, 'Here is one correct answer. Read it, then press "Check my answer".')); } }, 'Show answer')),
          fb, box));
      });
      parts.push(sec(L.practice.length > 1 ? 'Your turn' : 'Your turn', pwrap));
    }
    if (L.recap && L.recap.length) parts.push(sec('Remember', h('ul', { class: 'learn-recap' }, L.recap.map(r => h('li', { html: miniMarkdown(r).replace(/^<p>|<\/p>$/g, '') })))));
    if (!(L.practice && L.practice.length)) parts.push(h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'btn', onclick: () => { TW.learn.mark(L.id); drawNav(); drawLesson(); } }, done ? 'Done ✓' : 'Mark as done')));
    parts.push(h('div', { class: 'learn-pager' },
      i > 0 ? h('button', { class: 'btn', onclick: () => open(LESSONS[i - 1].id) }, '← ' + LESSONS[i - 1].t) : h('span'),
      i < LESSONS.length - 1 ? h('button', { class: 'btn primary', onclick: () => { if (!(L.practice && L.practice.length) && !(L.quiz && L.quiz.length)) TW.learn.mark(L.id); open(LESSONS[i + 1].id); } }, LESSONS[i + 1].t + ' →') : h('span')));
    body.replaceChildren(...parts);
  }
  drawNav(); drawLesson();
};
