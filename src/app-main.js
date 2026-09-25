/* Navigation, adapters and start-up */
const NAV = [
  ['home', 'Home', 'home'], ['browse', 'Browse data', 'table'], ['design', 'Table design', 'design'], ['builder', 'Question builder', 'build'],
  ['sql', 'SQL editor', 'sql'], ['learn', 'Learn SQL', 'build'], ['import', 'Import a file', 'import'], ['activity', 'Change history', 'log'], ['settings', 'Settings', 'settings']
];
function renderNav() {
  const t = TW.state.table;
  $('#nav').replaceChildren(...NAV.map(([id, label, ic]) => h('button', { 'data-view': id, 'data-x': 'tab-' + id, 'aria-current': TW.state.view === id ? 'page' : null, onclick: () => go(id) }, icon(ic, 15), label, (id === 'browse' || id === 'design') && t ? h('span', { class: 'sub' }, t) : null)));
}
const treeOpen = new Set(['db', 'tables', 'views']);
function renderTablesList() {
  const host = $('#tree'); if (!host || !TW.adapter) return;
  const q = ($('#tableSearch').value || '').toLowerCase();
  const node = (key, attrs, ...kids) => h('div', { class: 'tnode', ...attrs }, ...kids);
  const tw = key => h('span', { class: 'tw' }, key === null ? '' : treeOpen.has(key) ? '▾' : '▸');
  const toggle = key => e => { e.stopPropagation(); treeOpen.has(key) ? treeOpen.delete(key) : treeOpen.add(key); renderTablesList(); };
  const out = [];
  out.push(node('db', { 'data-x': 'tree-db', onclick: () => go('home') }, tw('db'), h('span', { class: 'ti' }, icon('conn', 15)), h('span', { class: 'nm', style: { fontWeight: 600 } }, TW.adapter.name)));
  if (treeOpen.has('db')) {
    const kids = h('div', { class: 'tkids' });
    for (const [grp, label, type] of [['tables', 'Tables', 'table'], ['views', 'Saved views', 'view']]) {
      const items = TW.state.tables.filter(t => t.type === type && t.name.toLowerCase().includes(q));
      if (type === 'view' && !items.length) continue;
      kids.append(node(grp, { 'data-x': 'tree-' + grp, onclick: toggle(grp) }, tw(grp), h('span', { class: 'ti' }, icon(type === 'view' ? 'eye' : 'table', 14)), h('span', { class: 'nm' }, label), h('span', { class: 'n' }, items.length)));
      if (!treeOpen.has(grp)) continue;
      const box = h('div', { class: 'tkids' });
      for (const t of items) {
        const key = 't:' + t.name;
        const el = node(key, { class: 'tnode' + (t.type === 'view' ? ' view' : '') + (TW.state.table === t.name && ['browse', 'design'].includes(TW.state.view) ? ' active' : ''), draggable: 'true', tabindex: '0', 'data-x': 'tree-table', onclick: () => go(TW.state.view === 'design' ? 'design' : 'browse', t.name), onkeydown: e => { if (e.key === 'Enter') go('browse', t.name); } },
          h('span', { class: 'tw', onclick: toggle(key) }, treeOpen.has(key) ? '▾' : '▸'), h('span', { class: 'ti' }, icon('table', 14)), h('span', { class: 'nm' }, t.name), h('span', { class: 'n' }, t.count === null || t.count === undefined ? '' : fmtNum(t.count)));
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('text/tw-table', t.name); e.dataTransfer.effectAllowed = 'copy'; if (TW.state.view !== 'builder') setTimeout(() => go('builder'), 0); });
        box.append(el);
        if (treeOpen.has(key)) {
          const cbox = h('div', { class: 'tkids' });
          describe(t.name).then(s => cbox.replaceChildren(...s.columns.map(c => node(null, { class: 'tnode col', 'data-x': c.pk ? 'tree-pk' : c.fk ? 'tree-fk' : 'tree-col', onclick: () => go('design', t.name) },
            h('span', { class: 'tw' }), h('span', { class: 'ti ' + (c.pk ? 'key' : c.fk ? 'lnk' : '') }, icon(c.pk ? 'key' : c.fk ? 'link' : 'dot', 12)), h('span', { class: 'nm' }, c.name),
            h('span', { class: 'ty' }, { text: 'abc', longtext: 'abc', int: '123', decimal: '1.5', money: '$', bool: 'y/n', date: 'date', datetime: 'time' }[friendlyType(c.type, c.name)]))))).catch(() => { });
          box.append(cbox);
        }
      }
      if (!items.length) box.append(h('p', { class: 'faint', style: { padding: '4px 8px', fontSize: '12.5px' } }, q ? 'No match.' : 'No tables yet.'));
      kids.append(box);
    }
    out.push(kids);
  }
  host.replaceChildren(...out);
}
let navToken = 0;
async function go(view, arg) {
  const tok = ++navToken;
  if ((view === 'browse' || view === 'design') && arg) TW.state.table = arg;
  if ((view === 'browse' || view === 'design') && !arg) arg = TW.state.table || undefined;
  TW.state.view = view;
  renderNav(); renderTablesList();
  $('#sidebar').classList.remove('open');
  const main = $('#viewHost');
  const root = h('div', { class: 'view' });
  main.replaceChildren(root); main.scrollTop = 0;
  try { await TW.views[view](root, arg); } catch (e) { console.error(e); if (tok === navToken) root.append(errorNotice(e)); }
  const cur = $('#nav button[aria-current="page"]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (!$('#guide').hidden && TW.guide.tab === 'guide') TW.guide.render();
}

/* ---------- adapters ---------- */
let SQL = null;
async function sqlEngine() {
  if (SQL) return SQL;
  const bin = Uint8Array.from(atob(window.TW_WASM_B64), c => c.charCodeAt(0));
  SQL = await initSqlJs({ wasmBinary: bin });
  return SQL;
}
async function localAdapter(db, name, opts) {
  opts = opts || {};
  const a = TWSqlite.makeSqliteAdapter(db, { name });
  let cur = db;
  a.isSample = !!opts.sample;
  a.snapshot = async () => a.exportBytes();
  a.restoreBytes = async bytes => { const S = await sqlEngine(); const nd = new S.Database(bytes); const fresh = TWSqlite.makeSqliteAdapter(nd, { name: a.name }); a.query = fresh.query; a.listTables = fresh.listTables; a.describe = fresh.describe; a.exportBytes = fresh.exportBytes; try { cur.close(); } catch (e) { } cur = nd; a._db = nd; };
  if (!DESK) a.persist = async () => { const ok = await idb.put('current', { name: a.name, bytes: a.exportBytes(), sample: a.isSample, at: Date.now() }); if (!ok && !a._warned) { a._warned = true; toast('This browser is not keeping a copy. Use Databases → Save a copy to keep your work.'); } };
  return a;
}
async function useAdapter(a, opts) {
  opts = opts || {};
  if (TW.adapter && TW.adapter !== a && TW.adapter.close && !opts.keepOld) { try { TW.adapter.close(); } catch (e) { } }
  TW.adapter = a; TW.state.schema = {}; TW.state.undo = []; $('#undoBtn').hidden = true;
  TW.qb.tables = []; TW.qb.joins = []; TW.qb.cols = []; TW.qb.filters.rules = []; TW.qb.sorts = [];
  for (const k in browseState) delete browseState[k];
  if (typeof opts.readOnly === 'boolean') { TW.state.readOnly = opts.readOnly; $('#roBadge').hidden = !opts.readOnly; }
  $('#connName').textContent = a.name; $('#connKind').textContent = D().label;
  await refreshTables();
  TW.state.log.unshift({ at: new Date(), kind: 'read', sql: `-- opened ${a.name} (${D().label})`, label: 'Opened database' });
  TW.state.table = (TW.state.tables.find(t => t.type === 'table') || {}).name || null;
  if (a.persist) a.persist();
}
TW.openSample = async function (force) {
  const S = await sqlEngine();
  const db = new S.Database();
  db.run(TWSample.buildSQL ? TWSample.buildSQL() : TWSample.buildSampleSQL());
  await useAdapter(await localAdapter(db, TWSample.name, { sample: true }));
  if (force) { toast('Fresh practice data loaded.'); go('home'); }
};
TW.newEmpty = async function () {
  const name = h('input', { class: 'input', id: 'newDbName', value: 'My database' });
  modal({
    title: 'Start a new database', body: [h('label', { class: 'field' }, h('span', null, 'Name'), name), h('p', { class: 'muted', style: { fontSize: '13px' } }, 'The database open now will be closed. Save a copy of it first if you need it.')],
    actions: [{ label: 'Cancel' }, { label: 'Create', kind: 'primary', fn: async () => { const S = await sqlEngine(); await useAdapter(await localAdapter(new S.Database(), name.value.trim() || 'My database')); go('design'); setTimeout(createTableWizard, 200); } }]
  });
};
TW.openSqliteBytes = async function (bytes, name, path) {
  if (DESK && path) return TW.desk.connect({ kind: 'sqlite', file: path });
  const S = await sqlEngine();
  let db; try { db = new S.Database(bytes); db.exec('SELECT count(*) FROM sqlite_master'); } catch (e) { toast('That file is not a readable SQLite database.', { bad: true }); return; }
  await useAdapter(await localAdapter(db, name || 'Database'));
  toast(`Opened ${name}.`); go('home');
};

/* ---------- desktop bridge ---------- */
TW.desk = {
  async openFile() { const p = await DESK.openSqliteDialog(); if (p) await this.connect({ kind: 'sqlite', file: p }); },
  async newFile() { const p = await DESK.newSqliteDialog(); if (p) await this.connect({ kind: 'sqlite', file: p, create: true }); },
  async connect(cfg) {
    const info = await DESK.connect(cfg);
    const id = info.id;
    const a = {
      kind: info.kind, name: info.name, hasSchemas: info.kind !== 'sqlite',
      query: (sql, params) => DESK.query(id, sql, params || []),
      listTables: () => DESK.listTables(id), describe: t => DESK.describe(id, t),
      transaction: stmts => DESK.transaction(id, stmts),
      close: () => DESK.close(id)
    };
    if (info.kind === 'sqlite') { a.snapshot = () => DESK.snapshot(id); a.restoreBytes = b => DESK.restore(id, b); }
    await useAdapter(a, { readOnly: !!cfg.readOnly });
    store.set('lastConnection', cfg.id || (cfg.kind === 'sqlite' ? { kind: 'sqlite', file: cfg.file } : null));
    toast(`Connected to ${info.name}.`); go('home');
  }
};

/* ---------- start ---------- */
async function boot() {
  if (DESK && window.TW_VERSION) document.title = 'Tablewise ' + window.TW_VERSION;
  if (store.get('theme', 'system') !== 'system') applyTheme(store.get('theme', 'system'));
  renderNav();
  $('#tableSearch').addEventListener('input', renderTablesList);
  $('#guideBtn').onclick = () => TW.guide.toggle('guide');
  $('#aiBtn').onclick = () => TW.guide.toggle('ai');
  $('#guideClose').onclick = () => TW.guide.close();
  $$('#guideTabs button').forEach(b => b.onclick = () => { TW.guide.tab = b.dataset.gt; TW.guide.render(); });
  $('#tourBtn').onclick = () => TW.tour.start();
  $('#connPill').onclick = () => go('connect');
  $('#undoBtn').onclick = undoLast;
  $('#refreshTree').onclick = () => { TW.state.schema = {}; refreshTables(); };
  $('#sideImport').onclick = () => go('import');
  $('#sideOpen').onclick = () => go('connect');
  TW.explain.init();
  $('#newTableSide').onclick = () => { if (TW.state.readOnly) { toast('Read-only mode is on.'); return; } go('design'); setTimeout(createTableWizard, 150); };
  $('#menuBtn').onclick = () => TW.dock.toggleSidebar();
  TW.dock.init();
  $('#roBadge').hidden = !TW.state.readOnly;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') TW.tour.end(); });
  window.addEventListener('resize', () => { if ($('.tour-card')) TW.tour.show(); });

  let opened = false;
  try {
    if (DESK) {
      const last = store.get('lastConnection', null);
      if (last && typeof last === 'object' && last.kind === 'sqlite') { try { await TW.desk.connect(last); opened = true; } catch (e) { } }
    } else {
      const saved = await idb.get('current');
      if (saved && saved.bytes && !saved.sample) {
        const S = await sqlEngine();
        await useAdapter(await localAdapter(new S.Database(saved.bytes), saved.name));
        opened = true;
        setTimeout(() => toast(`Reopened "${saved.name}" from this browser.`, { action: { label: 'Use practice data', fn: () => TW.openSample(true) } }), 400);
      } else if (saved && saved.bytes && saved.sample) {
        const S = await sqlEngine();
        await useAdapter(await localAdapter(new S.Database(saved.bytes), saved.name, { sample: true }));
        opened = true;
      }
    }
  } catch (e) { console.warn(e); }
  if (!opened) await TW.openSample();
  $('#loading').remove();
  if (TW.isDesktop && DESK.getAISettings) { try { TW.ai.settings = await DESK.getAISettings(); } catch (e) { } }
  const wide = window.innerWidth > 1180;
  if (store.get('guideOpen', wide) && wide) TW.guide.open('guide');
  const hash = (location.hash || '').slice(1);
  await go(TW.views[hash] ? hash : 'home');
}
boot().catch(e => { const l = $('#loading'); if (l) l.textContent = 'Could not start: ' + e.message; console.error(e); });
