/* Activity log, Databases (connections), Settings */
TW.views.activity = async function (root) {
  const log = TW.state.log;
  let kind = 'all';
  root.append(h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Change history'), h('p', { class: 'sub' }, 'Everything that was changed in this session, newest first.')),
    h('div', { class: 'row' },
      h('select', { class: 'select', 'aria-label': 'Show', onchange: e => { kind = e.target.value; draw(); } }, [['all', 'Everything'], ['write', 'Added or changed'], ['delete', 'Deleted'], ['schema', 'Table design'], ['read', 'Questions asked']].map(([v, l]) => h('option', { value: v }, l))),
      TW.state.undo.length ? h('button', { class: 'btn', onclick: async () => { await undoLast(); go('activity'); } }, 'Undo last change') : null,
      h('button', { class: 'btn', onclick: () => exportRows('tablewise-activity', ['time', 'kind', 'what', 'sql', 'rows'], log.map(l => [l.at.toISOString(), l.kind, l.label, l.sql, l.changes ?? '']), 'csv') }, icon('download', 14), 'Export log'))));
  const host = h('div', { class: 'panel log' }); root.append(host);
  const words = { write: 'Added/changed', delete: 'Deleted', schema: 'Design', read: 'Question' };
  function draw() {
    const items = log.filter(l => kind === 'all' || l.kind === kind);
    host.replaceChildren(...(items.length ? items.map(l => h('div', { class: 'log-item' },
      h('span', { class: 'faint num' }, l.at.toLocaleTimeString()), h('span', { class: 'k ' + l.kind }, words[l.kind] || l.kind),
      h('div', null, l.label ? h('div', { style: { marginBottom: '4px' } }, l.label) : null, h('pre', { class: 'sql', style: { maxHeight: '120px' }, html: highlightSQL(l.sql) })))) : [h('div', { class: 'empty' }, 'Nothing yet. Changes you make will be listed here.')]));
  }
  draw();
};

TW.views.connect = async function (root) {
  root.append(h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Open a database'), h('p', { class: 'sub' }, `You are using ${TW.adapter.name} (${D().label}). Open another database, start a new one, or save a copy.`))));
  const act = (ic, title, text, fn, id) => h('button', { class: 'action', onclick: fn, id }, h('span', { class: 'ic' }, icon(ic, 18)), h('span', null, h('b', null, title), h('span', null, text)));
  const fileIn = h('input', { type: 'file', accept: '.sqlite,.sqlite3,.db,.zip', hidden: true, onchange: async e => { const f = e.target.files[0]; if (!f) return; let b = new Uint8Array(await f.arrayBuffer()); if (/\.zip$/i.test(f.name)) { const z = await readZipFirst(b); b = z && z.data; } if (!b || !isSqliteBytes(b)) { toast('That is not a SQLite database file.', { bad: true }); return; } TW.openSqliteBytes(b, f.name.replace(/\.(zip|sqlite3?|db)$/i, '')); } });
  root.append(fileIn, h('h2', { style: { margin: '4px 0 10px' } }, 'Database files (SQLite)'),
    h('div', { class: 'actions' },
      act('conn', 'Open a database file', DESK ? 'Open a .sqlite or .db file. Changes save straight to it.' : 'Open a .sqlite, .db or a .zip saved from here.', () => DESK ? TW.desk.openFile() : fileIn.click(), 'openDbBtn'),
      act('plus', 'Start a new, empty database', DESK ? 'Creates a new .sqlite file wherever you choose.' : 'A blank database kept in this browser.', () => DESK ? TW.desk.newFile() : TW.newEmpty()),
      act('sparkle', 'Practice database', 'Reload Northwind Supply Co., with customers, products and orders.', async () => { if (await confirmBox({ title: 'Load the practice database?', message: TW.adapter.isSample || DESK ? 'This replaces the practice data with a fresh copy.' : 'The database open now will be closed. Save a copy first if you need it.', confirmLabel: 'Load practice data' })) TW.openSample(true); }),
      TW.adapter.snapshot ? act('save', 'Save a copy', DESK ? 'Save this database as a .sqlite file.' : 'Download it as a .sqlite file (inside a .zip).', async () => saveFile(safeIdent(TW.adapter.name) + '.sqlite', await TW.adapter.snapshot())) : null));
  if (!DESK) {
    root.append(h('div', { class: 'notice info', style: { marginTop: '16px' } }, icon('conn'), h('div', null, h('b', null, 'Connecting to company servers. '), 'PostgreSQL, MySQL/MariaDB and Microsoft SQL Server need the Tablewise desktop app for Windows, which uses the same screens. In this browser page, your database is saved automatically in this browser only. Use "Save a copy" to keep a file.')));
    return;
  }
  // desktop: server connections
  root.append(h('h2', { style: { margin: '26px 0 10px' } }, 'Company database servers'));
  const saved = await DESK.listConnections();
  const list = h('div', { class: 'stack' });
  if (saved.length) for (const c of saved) list.append(h('div', { class: 'panel row', style: { justifyContent: 'space-between' } },
    h('div', null, h('b', null, c.label || c.database), h('div', { class: 'faint mono', style: { fontSize: '12px' } }, `${DIALECTS[c.kind].label} · ${c.kind === 'sqlite' ? c.file : `${c.user || ''}@${c.host}:${c.port}/${c.database}`}`)),
    h('div', { class: 'row' }, h('button', { class: 'btn primary sm', onclick: () => TW.desk.connect(c) }, 'Connect'), h('button', { class: 'btn sm', onclick: () => connForm(c) }, 'Edit'), h('button', { class: 'btn sm ghost', onclick: async () => { await DESK.deleteConnection(c.id); go('connect'); } }, 'Remove'))));
  else list.append(h('p', { class: 'muted' }, 'No saved server connections yet.'));
  root.append(list, h('div', { class: 'row', style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onclick: () => connForm(null) }, icon('plus'), 'Add a server connection')));

  function connForm(c) {
    c = c || { kind: 'postgres', host: 'localhost', port: 5432, database: '', user: '', password: '', ssl: false, remember: true, label: '', readOnly: false };
    const ports = { postgres: 5432, mysql: 3306, mssql: 1433 };
    const f = {};
    const field = (k, label, attrs, hint) => { f[k] = h('input', { class: 'input', id: 'cf_' + k, value: c[k] ?? '', ...attrs }); return h('label', { class: 'field' }, h('span', null, label), f[k], hint ? h('span', { class: 'hint' }, hint) : null); };
    f.kind = h('select', { class: 'select', id: 'cf_kind', onchange: () => { f.port.value = ports[f.kind.value]; } }, ['postgres', 'mysql', 'mssql'].map(k => h('option', { value: k, selected: c.kind === k }, DIALECTS[k].label + (k === 'mysql' ? ' / MariaDB' : ''))));
    const ssl = h('input', { type: 'checkbox', checked: !!c.ssl }), rem = h('input', { type: 'checkbox', checked: c.remember !== false }), ro = h('input', { type: 'checkbox', checked: !!c.readOnly });
    const status = h('div');
    const body = h('div', { class: 'stack' },
      h('label', { class: 'field' }, h('span', null, 'Database type'), f.kind),
      h('div', { class: 'split' }, field('host', 'Server address (host)', { placeholder: 'db.company.com' }), field('port', 'Port', { type: 'number' })),
      field('database', 'Database name', { placeholder: 'sales' }),
      h('div', { class: 'split' }, field('user', 'User name', { autocomplete: 'off' }), field('password', 'Password', { type: 'password', autocomplete: 'off', placeholder: c.id && c.hasPassword ? '(saved)' : '' })),
      field('label', 'Nickname (optional)', { placeholder: 'Sales – production' }),
      h('div', { class: 'row' }, h('label', { class: 'check' }, ssl, 'Use an encrypted connection (SSL)'), h('label', { class: 'check' }, rem, 'Remember password (encrypted on this PC)'), h('label', { class: 'check' }, ro, 'Open in read-only mode')),
      h('p', { class: 'faint', style: { fontSize: '12.5px' } }, 'Ask your IT team for these details. For production data, use an account with only the permissions you need.'),
      status);
    const collect = () => ({ ...c, kind: f.kind.value, host: f.host.value.trim(), port: +f.port.value, database: f.database.value.trim(), user: f.user.value.trim(), password: f.password.value, label: f.label.value.trim(), ssl: ssl.checked, remember: rem.checked, readOnly: ro.checked });
    modal({
      title: c.id ? 'Edit connection' : 'Add a server connection', body, actions: [
        { label: 'Test', fn: async () => { status.replaceChildren(h('p', { class: 'faint' }, 'Testing…')); try { await DESK.testConnection(collect()); status.replaceChildren(h('div', { class: 'notice good' }, 'Connected successfully.')); } catch (e) { status.replaceChildren(errorNotice(e)); } return false; } },
        { label: 'Save', fn: async () => { await DESK.saveConnection(collect()); go('connect'); } },
        { label: 'Save and connect', kind: 'primary', fn: async () => { const saved = await DESK.saveConnection(collect()); try { await TW.desk.connect(saved); } catch (e) { status.replaceChildren(errorNotice(e)); return false; } } }]
    });
  }
};

TW.views.settings = async function (root) {
  root.append(h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Settings'))));
  const ro = h('input', { type: 'checkbox', id: 'setRO', checked: TW.state.readOnly, onchange: e => { TW.state.readOnly = e.target.checked; store.set('readOnly', e.target.checked); $('#roBadge').hidden = !e.target.checked; toast(e.target.checked ? 'Read-only mode on. Changes are blocked.' : 'Read-only mode off.'); } });
  const theme = h('select', { class: 'select', id: 'setTheme', onchange: e => { applyTheme(e.target.value); } }, [['system', 'Match my computer'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => h('option', { value: v, selected: store.get('theme', 'system') === v }, l)));
  root.append(h('div', { class: 'panel stack', style: { maxWidth: '720px' } },
    h('h2', null, 'Safety'),
    h('label', { class: 'check' }, ro, h('span', null, h('b', null, 'Read-only mode. '), 'Blocks every change: good for looking at production data or for people who should only read.')),
    h('p', { class: 'muted', style: { fontSize: '13px' } }, 'Deleting always asks first. Deleting a whole table asks you to type its name.'),
    h('h2', { style: { marginTop: '10px' } }, 'Look'),
    h('label', { class: 'field', style: { maxWidth: '260px' } }, h('span', null, 'Theme'), theme)));
  const aiBox = h('div', { class: 'panel stack', style: { maxWidth: '720px', marginTop: '16px' } });
  root.append(aiBox);
  TW.ai.renderSettings(aiBox);
  root.append(h('p', { class: 'faint', style: { marginTop: '24px', fontSize: '12.5px' } }, `Tablewise version ${window.TW_VERSION || ''}${TW.isDesktop ? ' (desktop app)' : ' (browser)'}`));
};
function applyTheme(v) {
  store.set('theme', v);
  if (v === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v);
}
