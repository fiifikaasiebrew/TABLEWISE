/* SQL editor for people who want full control */
function sqlTemplates() {
  const t = (TW.state.tables.find(x => x.type === 'table') || { name: 'my_table' }).name;
  const lim = n => D().page === 'offset' ? { pre: `TOP ${n} `, post: '' } : { pre: '', post: ` LIMIT ${n}` };
  const l = lim(20);
  return [
    ['See the first rows of a table', `SELECT ${l.pre}*\nFROM ${qt(t)}${l.post};`, 'SELECT picks columns (* means all). FROM names the table.'],
    ['Count the rows', `SELECT COUNT(*) AS how_many\nFROM ${qt(t)};`, 'COUNT(*) counts rows. AS gives the result a name.'],
    ['Find rows that match', `SELECT *\nFROM ${qt(t)}\nWHERE column_name = 'some value';`, 'WHERE keeps only rows where the rule is true. Text goes in single quotes.'],
    ['Search text', `SELECT *\nFROM ${qt(t)}\nWHERE column_name LIKE '%word%';`, 'LIKE with % finds text that contains the word anywhere.'],
    ['Group and count', `SELECT column_name, COUNT(*) AS how_many\nFROM ${qt(t)}\nGROUP BY column_name\nORDER BY how_many DESC;`, 'GROUP BY makes one line per value. ORDER BY … DESC puts the biggest first.'],
    ['Combine two tables', `SELECT o.*, c.company_name\nFROM orders AS o\nJOIN customers AS c ON c.id = o.customer_id;`, 'JOIN … ON matches rows from two tables using the columns that link them.'],
    ['Add a row', `INSERT INTO ${qt(t)} (column_a, column_b)\nVALUES ('value a', 'value b');`, 'Lists the columns, then the values in the same order.'],
    ['Change rows', `UPDATE ${qt(t)}\nSET column_name = 'new value'\nWHERE id = 1;`, 'Always include WHERE, or every row is changed.'],
    ['Delete rows', `DELETE FROM ${qt(t)}\nWHERE id = 1;`, 'Always include WHERE, or every row is deleted.'],
    ['Create a table', `CREATE TABLE new_table (\n  id ${autoIdSQL()},\n  name ${FTYPES[0].sql[TW.adapter.kind]} NOT NULL,\n  created_on DATE\n);`, 'Each line defines one column and the kind of data it holds.']
  ];
}
TW.views.sql = async function (root) {
  const hist = store.get('sqlHistory', []);
  root.classList.add('sqlview');
  const ed = h('textarea', { class: 'sql-editor', id: 'sqlEditor', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'SQL editor', placeholder: 'Type SQL here, then press Ctrl+Enter to run it. Suggestions appear as you type.' });
  ed.value = TW.sqlDraft || store.get('sqlDraft', '') || sqlTemplates()[0][1];
  TW.sqlDraft = null;
  const out = h('div', { class: 'results' });
  const status = h('span', { class: 'faint', style: { fontSize: '12.5px' } });
  const lib = h('aside', { class: 'sqllib', id: 'sqlLib' });
  const main = h('div', { class: 'sqlmain' },
    h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'SQL editor'), h('p', { class: 'sub' }, `Type ${D().label} SQL and press Ctrl+Enter, or pick something from the function library on the right. You never need this tab, but it can do everything.`)),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: showSaved }, 'Saved'), h('button', { class: 'btn', onclick: showHistory }, 'Recent SQL'))),
    h('div', { class: 'ed-wrap' }, ed),
    h('div', { class: 'row', style: { margin: '10px 0' } },
      h('button', { class: 'btn primary', id: 'sqlRun', onclick: () => runIt() }, 'Run', h('span', { class: 'mono', style: { fontSize: '11px', opacity: .7 } }, 'Ctrl+Enter')),
      h('button', { class: 'btn', onclick: saveIt }, 'Save'),
      h('button', { class: 'btn', onclick: () => { ed.value = formatSQL(ed.value); store.set('sqlDraft', ed.value); } }, 'Format SQL'),
      h('button', { class: 'btn', title: 'Shows how the database plans to find the answer', onclick: explainPlan }, 'How will it run?'),
      h('button', { class: 'btn ghost', onclick: () => TW.ai.ask(`Explain this SQL in plain English, step by step:\n\n${ed.value}`) }, 'Explain with AI'),
      h('span', { style: { flex: 1 } }), status),
    out);
  root.append(h('div', { class: 'sqlgrid' }, main, lib));

  /* ---------- autocomplete ---------- */
  const pop = h('div', { class: 'ac', hidden: true, role: 'listbox' });
  document.body.append(pop);
  const cleanup = () => { pop.remove(); };
  const obs = new MutationObserver(() => { if (!document.body.contains(ed)) { cleanup(); obs.disconnect(); } });
  obs.observe($('#viewHost'), { childList: true });
  let words = [], acItems = [], acIdx = 0;
  (async () => {
    const schemas = await allSchemas();
    const tset = TW.state.tables.map(t => ({ w: t.name, k: 'table' }));
    const cset = []; const seen = new Set();
    for (const [t, sc] of Object.entries(schemas)) for (const c of sc.columns) { cset.push({ w: t + '.' + c.name, k: 'column', t }); if (!seen.has(c.name)) { seen.add(c.name); cset.push({ w: c.name, k: 'column' }); } }
    words = [...tset, ...cset, ...SQL_KEYWORDS.map(w => ({ w, k: /\($/.test(w) ? 'function' : 'keyword' }))];
  })();
  function caretXY() {
    const cs = getComputedStyle(ed);
    const m = h('div', { style: { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', wordWrap: 'break-word', top: 0, left: '-9999px' } });
    for (const p of ['fontFamily', 'fontSize', 'lineHeight', 'paddingTop', 'paddingLeft', 'paddingRight', 'borderTopWidth', 'borderLeftWidth', 'letterSpacing', 'tabSize']) m.style[p] = cs[p];
    m.style.width = ed.clientWidth + 'px';
    m.textContent = ed.value.slice(0, ed.selectionStart);
    const sp = h('span', null, '​'); m.append(sp); document.body.append(m);
    const r = ed.getBoundingClientRect();
    const x = r.left + sp.offsetLeft - ed.scrollLeft, y = r.top + sp.offsetTop - ed.scrollTop + parseFloat(cs.lineHeight || 20);
    m.remove(); return { x, y };
  }
  function currentWord() { const before = ed.value.slice(0, ed.selectionStart); const m = before.match(/[A-Za-z_][\w.]*$/); return m ? m[0] : ''; }
  function acUpdate() {
    const w = currentWord();
    if (w.length < 2) return acHide();
    const lw = w.toLowerCase();
    acItems = words.filter(x => x.w.toLowerCase().startsWith(lw) && x.w.toLowerCase() !== lw).sort((a, b) => ({ table: 0, column: 1, function: 2, keyword: 3 }[a.k] - { table: 0, column: 1, function: 2, keyword: 3 }[b.k]) || a.w.length - b.w.length).slice(0, 8);
    if (!acItems.length) return acHide();
    acIdx = 0; drawAc();
    const p = caretXY(); pop.style.left = Math.min(p.x, innerWidth - 280) + 'px'; pop.style.top = Math.min(p.y + 4, innerHeight - 260) + 'px'; pop.hidden = false;
  }
  function drawAc() { pop.replaceChildren(...acItems.map((x, i) => h('div', { class: 'ac-item' + (i === acIdx ? ' on' : ''), role: 'option', onmousedown: e => { e.preventDefault(); acIdx = i; acAccept(); } }, h('span', { class: 'mono' }, x.w), h('span', { class: 'faint' }, x.k)))); }
  function acHide() { pop.hidden = true; acItems = []; }
  function acAccept() {
    const it = acItems[acIdx]; if (!it) return;
    const w = currentWord(); const s = ed.selectionStart;
    ed.setRangeText(it.w + (it.k === 'keyword' && !/\($/.test(it.w) ? ' ' : ''), s - w.length, s, 'end');
    acHide(); store.set('sqlDraft', ed.value); ed.focus();
  }
  ed.addEventListener('input', () => { store.set('sqlDraft', ed.value); acUpdate(); });
  ed.addEventListener('blur', () => setTimeout(acHide, 120));
  ed.addEventListener('keydown', e => {
    if (!pop.hidden && acItems.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); acIdx = (acIdx + 1) % acItems.length; drawAc(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); acIdx = (acIdx - 1 + acItems.length) % acItems.length; drawAc(); return; }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); acAccept(); return; }
      if (e.key === 'Escape') { e.preventDefault(); acHide(); return; }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runIt(); }
    else if (e.key === 'Tab') { e.preventDefault(); const s = ed.selectionStart; ed.setRangeText('  ', s, ed.selectionEnd, 'end'); }
  });

  /* ---------- function library ---------- */
  let libCat = store.get('libCat', 'Picking data'), libQ = '', openIdx = null;
  const libSearch = h('input', { class: 'input', id: 'libSearch', placeholder: 'Search functions, e.g. "month" or "join"', 'aria-label': 'Search the function library', oninput: e => { libQ = e.target.value.trim().toLowerCase(); drawLib(); } });
  const catSel = h('select', { class: 'select', 'aria-label': 'Category', onchange: e => { libCat = e.target.value; store.set('libCat', libCat); drawLib(); } }, h('option', { value: '*' }, `All (${SQL_LIB.length})`), SQL_CATS.map(c => h('option', { value: c, selected: c === libCat }, `${c} (${SQL_LIB.filter(x => x[0] === c).length})`)));
  const libList = h('div', { class: 'lib-list' });
  lib.append(h('div', { class: 'lib-head' }, h('h2', null, 'Function library'), h('p', { class: 'faint', style: { fontSize: '12.5px' } }, `${SQL_LIB.length} ready-made pieces of SQL for ${D().label}, each explained simply. Insert one into the editor, or try it on your data.`)), libSearch, catSel, libList);
  function drawLib() {
    const all = libEntries();
    const items = all.filter(x => libQ ? (x.name + ' ' + x.what + ' ' + x.syntax + ' ' + x.cat).toLowerCase().includes(libQ) : (libCat === '*' || x.cat === libCat));
    libList.replaceChildren(...(items.length ? items.map(x => {
      const open = openIdx === x.i;
      const write = isWrite(x.ex) || /^\s*(begin|start transaction|--)/i.test(x.ex);
      const el = h('div', { class: 'lib-item' + (open ? ' open' : '') },
        h('button', { class: 'lib-title', 'aria-expanded': open ? 'true' : 'false', onclick: () => { openIdx = open ? null : x.i; drawLib(); } }, h('span', null, x.name), libQ ? h('span', { class: 'faint', style: { fontSize: '11.5px' } }, x.cat) : null),
        h('p', { class: 'lib-what' }, x.what));
      if (open) el.append(
        h('div', { class: 'lib-syntax mono' }, x.syntax),
        h('pre', { class: 'sql', html: highlightSQL(x.ex) }),
        h('div', { class: 'row', style: { gap: '6px' } },
          h('button', { class: 'btn sm', onclick: () => insertText(x.ex) }, 'Insert'),
          h('button', { class: 'btn sm', onclick: () => { ed.value = x.ex; store.set('sqlDraft', ed.value); } }, 'Replace editor'),
          write ? h('span', { class: 'faint', style: { fontSize: '12px' } }, 'Changes data: insert it, check it, then press Run.') : h('button', { class: 'btn sm primary', onclick: () => { ed.value = x.ex; store.set('sqlDraft', ed.value); runIt(x.ex); } }, 'Try it')));
      return el;
    }) : [h('p', { class: 'faint', style: { padding: '8px 0' } }, 'Nothing found. Try another word.')]));
  }
  function insertText(t) {
    ed.focus();
    const s = ed.selectionStart, e = ed.selectionEnd;
    const pre = s > 0 && !/\s$/.test(ed.value.slice(0, s)) ? '\n' : '';
    ed.setRangeText(pre + t, s, e, 'end'); store.set('sqlDraft', ed.value);
  }
  drawLib();

  /* ---------- running ---------- */
  async function runIt(forced) {
    const text = (forced || (ed.selectionEnd > ed.selectionStart ? ed.value.slice(ed.selectionStart, ed.selectionEnd) : ed.value)).trim();
    if (!text) return;
    const risky = /^\s*(delete\s+from|update)\s[^;]*$/im.test(text) && !/\bwhere\b/i.test(text);
    const drop = /\b(drop|truncate)\s+(table|database|schema)\b/i.test(text);
    if (risky || drop) {
      const ok = await confirmBox({ title: drop ? 'This deletes a whole table' : 'This affects every row', message: drop ? 'DROP/TRUNCATE removes data permanently.' : 'There is no WHERE rule, so every row in the table will be changed or deleted.', confirmLabel: 'Run anyway', danger: true, sql: text });
      if (!ok) return;
    }
    out.replaceChildren(h('p', { class: 'faint' }, 'Running…'));
    try {
      const r = await run(text, [], { log: true, label: 'SQL editor' });
      hist.unshift({ sql: text, at: Date.now() }); store.set('sqlHistory', hist.filter((x, i, a) => a.findIndex(y => y.sql === x.sql) === i).slice(0, 40));
      status.textContent = `${r.ms} ms`;
      const sets = (r.sets && r.sets.length ? r.sets : [{ columns: r.columns, rows: r.rows }]).filter(s => s.columns && s.columns.length);
      const parts = [];
      if (!sets.length) parts.push(h('div', { class: 'notice good' }, isWrite(text) ? `Done. ${plural(r.changes || 0, 'row')} changed.` : 'Done. The statement returned no rows.'));
      sets.forEach((s, i) => {
        const chart = barChart(s.columns, s.rows);
        const gridEl = resultGrid(s.columns, s.rows, { height: '460px' });
        let showChart = false;
        const host = h('div', null, gridEl);
        parts.push(h('div', { class: 'toolbar', style: { marginTop: i ? '18px' : 0 } }, h('h2', null, sets.length > 1 ? `Result ${i + 1}` : 'Result'), h('span', { class: 'faint num' }, plural(s.rows.length, 'row')), h('span', { style: { flex: 1 } }),
          chart ? h('button', { class: 'btn sm', onclick: e => { showChart = !showChart; host.replaceChildren(showChart ? chart : gridEl); e.target.textContent = showChart ? 'Table' : 'Chart'; } }, 'Chart') : null,
          h('button', { class: 'btn sm', onclick: () => exportRows('sql-result', s.columns, s.rows, 'csv') }, 'CSV'), h('button', { class: 'btn sm', onclick: () => exportRows('sql-result', s.columns, s.rows, 'xlsx') }, 'Excel')), host);
      });
      out.replaceChildren(...parts);
      if (isWrite(text)) { TW.state.schema = {}; refreshTables(); }
    } catch (e) {
      status.textContent = '';
      out.replaceChildren(errorNotice(e), h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn sm', onclick: () => TW.ai.ask(`This SQL failed on ${D().label}.\n\nSQL:\n${text}\n\nError:\n${e.message}\n\nFix it and explain what was wrong.`) }, 'Fix it with AI')));
    }
  }
  async function explainPlan() {
    const text = (ed.selectionEnd > ed.selectionStart ? ed.value.slice(ed.selectionStart, ed.selectionEnd) : ed.value).trim().replace(/;\s*$/, '');
    if (!/^\s*(select|with)\b/i.test(text)) { toast('Put a single SELECT question in the editor first.'); return; }
    const k = TW.adapter.kind;
    if (k === 'mssql') { toast('For SQL Server, use "Display Estimated Execution Plan" in SQL Server Management Studio.'); return; }
    try {
      const r = await TW.adapter.query((k === 'sqlite' ? 'EXPLAIN QUERY PLAN ' : 'EXPLAIN ') + text, []);
      const lines = r.rows.map(row => k === 'sqlite' ? '  '.repeat(Math.max(0, (r.rows.findIndex(x => x[0] === row[1]) + 1))) + row[row.length - 1] : row.filter(v => v !== null).join('  '));
      const plain = lines.join('\n');
      const tips = [];
      if (/SCAN (TABLE )?\w+(?! USING)/i.test(plain) || /Seq Scan|type.*ALL/i.test(plain)) tips.push('"SCAN" or "Seq Scan" means the database reads every row. On big tables, use Structure → "Make searching faster" on the column you filter by.');
      if (/USING (COVERING )?INDEX|Index Scan|Index Only/i.test(plain)) tips.push('"INDEX" means it jumps straight to the right rows. That is fast.');
      if (/TEMP B-TREE|Sort/i.test(plain)) tips.push('"TEMP B-TREE" or "Sort" means it sorts the rows itself. Fine for small results.');
      out.replaceChildren(h('div', { class: 'toolbar' }, h('h2', null, 'How it will run')), h('pre', { class: 'sql' }, plain), ...tips.map(t => h('p', { class: 'notice', style: { marginTop: '8px' } }, t)));
    } catch (e) { out.replaceChildren(errorNotice(e)); }
  }
  function saveIt() {
    const name = h('input', { class: 'input', id: 'sqlSaveName', placeholder: 'e.g. Monthly revenue' });
    modal({ title: 'Save this SQL', body: [h('label', { class: 'field' }, h('span', null, 'Name'), name)], actions: [{ label: 'Cancel' }, { label: 'Save', kind: 'primary', fn: () => { const list = store.get('sqlSaved', []); list.unshift({ name: name.value.trim() || 'Untitled', sql: ed.value, at: Date.now() }); store.set('sqlSaved', list.slice(0, 200)); toast('Saved.'); } }] });
  }
  function showSaved() {
    const list = store.get('sqlSaved', []);
    const m = modal({ title: 'Saved SQL', wide: true, body: list.length ? list.map((x, i) => h('div', { class: 'stack', style: { borderBottom: '1px solid var(--line)', paddingBottom: '12px', gap: '6px' } }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('b', null, x.name), h('div', { class: 'row', style: { gap: '4px' } }, h('button', { class: 'btn sm primary', onclick: () => { ed.value = x.sql; store.set('sqlDraft', ed.value); m.close(); } }, 'Open'), h('button', { class: 'btn sm ghost', onclick: () => { list.splice(i, 1); store.set('sqlSaved', list); m.close(); showSaved(); } }, 'Remove'))), sqlBlock(x.sql))) : h('p', { class: 'muted' }, 'Nothing saved yet. Write some SQL and press Save.'), actions: [{ label: 'Close' }] });
  }
  function showHistory() {
    const list = store.get('sqlHistory', []);
    const m = modal({ title: 'Recent SQL', wide: true, body: list.length ? list.map(x => h('div', { class: 'stack', style: { borderBottom: '1px solid var(--line)', paddingBottom: '10px', gap: '6px' } }, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', { class: 'faint', style: { fontSize: '12px' } }, new Date(x.at).toLocaleString()), h('button', { class: 'btn sm', onclick: () => { ed.value = x.sql; m.close(); } }, 'Use')), sqlBlock(x.sql))) : h('p', { class: 'muted' }, 'Nothing run yet.'), actions: [{ label: 'Close' }] });
  }
};
function formatSQL(s) {
  return s.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ')
    .replace(/\s+\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|LEFT JOIN|RIGHT JOIN|INNER JOIN|JOIN|UNION|VALUES|SET)\b/gi, m => '\n' + m.trim().toUpperCase())
    .replace(/\s+\b(AND|OR)\b\s+/gi, m => '\n  ' + m.trim().toUpperCase() + ' ').replace(/^\s*select\b/i, 'SELECT').trim();
}
