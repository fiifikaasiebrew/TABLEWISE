/* Tablewise — core: helpers, dialects, state, persistence */
'use strict';
const TW = window.TW = {};
const DESK = window.twDesktop || null;          // provided by the desktop app's preload
TW.isDesktop = !!DESK;

/* ---------- tiny DOM helpers ---------- */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.from((r || document).querySelectorAll(s)); }
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtNum(n) { return typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : n; }
function plural(n, w, p) { return n === 1 ? `1 ${w}` : `${fmtNum(n)} ${p || w + 's'}`; }
function prettyName(s) { return String(s).replace(/[_\.]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  table: 'M3 5h18v14H3zM3 10h18M9 10v9',
  build: 'M4 5h6v5H4zM14 14h6v5h-6zM10 7.5h4v9',
  design: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  sql: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  import: 'M12 3v12M7 10l5 5 5-5M4 19h16',
  log: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  conn: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .3-1.5-1.5L17 5l-3-1-1 2h-2l-1-2-3 1 .5 2L6 8.5 4 8.2 3 11l2 1v0l-2 1 1 3 2-.3 1.5 1.5L7 19l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .3 1-3z',
  grip: 'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  play: 'M7 4l13 8-13 8z', download: 'M12 4v11M7 10l5 5 5-5M4 20h16', edit: 'M4 20h4L19 9l-4-4L4 16z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  key: 'M15 7a4 4 0 1 1-3.9 5H3v3h3v2h3v-2h2.1A4 4 0 0 1 15 7z', save: 'M5 3h11l3 3v15H5zM8 3v6h8M8 21v-7h8v7',
  sparkle: 'M12 3l2.2 5.3L20 10l-5.8 1.7L12 17l-2.2-5.3L4 10l5.8-1.7z', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2', dot: 'M12 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z'
};
function icon(n, size) { size = size || 16; return h('span', { html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n] || ''}"/></svg>`, style: { display: 'inline-grid', placeItems: 'center' }, 'aria-hidden': 'true' }); }

/* ---------- storage (per-browser conveniences) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('tw.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tw.' + k, JSON.stringify(v)); } catch (e) { } }
};
const idb = {
  _db: null,
  async open() {
    if (this._db) return this._db;
    return this._db = await new Promise((res, rej) => {
      try { const r = indexedDB.open('tablewise', 1); r.onupgradeneeded = () => r.result.createObjectStore('dbs'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
    });
  },
  async put(key, val) { try { const d = await this.open(); await new Promise((res, rej) => { const t = d.transaction('dbs', 'readwrite'); t.objectStore('dbs').put(val, key); t.oncomplete = res; t.onerror = () => rej(t.error); }); return true; } catch (e) { return false; } },
  async get(key) { try { const d = await this.open(); return await new Promise((res, rej) => { const t = d.transaction('dbs').objectStore('dbs').get(key); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); }); } catch (e) { return null; } }
};

/* ---------- SQL dialects ---------- */
const DIALECTS = {
  sqlite: { label: 'SQLite', q: n => '"' + String(n).replace(/"/g, '""') + '"', like: 'LIKE', page: 'limit', ph: '?' },
  postgres: { label: 'PostgreSQL', q: n => '"' + String(n).replace(/"/g, '""') + '"', like: 'ILIKE', page: 'limit' },
  mysql: { label: 'MySQL', q: n => '`' + String(n).replace(/`/g, '``') + '`', like: 'LIKE', page: 'limit' },
  mssql: { label: 'SQL Server', q: n => '[' + String(n).replace(/]/g, ']]') + ']', like: 'LIKE', page: 'offset' }
};
function D() { return DIALECTS[TW.adapter ? TW.adapter.kind : 'sqlite']; }
function qi(n) { return D().q(n); }
function qt(name) {                         // qualified table name (schema.table on server databases)
  if (TW.adapter && TW.adapter.hasSchemas && name.includes('.')) { const i = name.indexOf('.'); return qi(name.slice(0, i)) + '.' + qi(name.slice(i + 1)); }
  return qi(name);
}
function pageClause(limit, offset, hasOrder) {
  if (D().page === 'offset') return (hasOrder ? '' : ' ORDER BY (SELECT NULL)') + ` OFFSET ${offset | 0} ROWS FETCH NEXT ${limit | 0} ROWS ONLY`;
  return ` LIMIT ${limit | 0}` + (offset ? ` OFFSET ${offset | 0}` : '');
}
/* friendly column types */
const FTYPES = [
  { id: 'text', label: 'Text (short)', hint: 'Names, emails, codes', sql: { sqlite: 'TEXT', postgres: 'VARCHAR(255)', mysql: 'VARCHAR(255)', mssql: 'NVARCHAR(255)' } },
  { id: 'longtext', label: 'Text (long)', hint: 'Notes, descriptions', sql: { sqlite: 'TEXT', postgres: 'TEXT', mysql: 'TEXT', mssql: 'NVARCHAR(MAX)' } },
  { id: 'int', label: 'Whole number', hint: '1, 42, -7', sql: { sqlite: 'INTEGER', postgres: 'INTEGER', mysql: 'INT', mssql: 'INT' } },
  { id: 'decimal', label: 'Decimal number', hint: '3.14, 0.5', sql: { sqlite: 'REAL', postgres: 'NUMERIC(18,4)', mysql: 'DECIMAL(18,4)', mssql: 'DECIMAL(18,4)' } },
  { id: 'money', label: 'Money', hint: '19.99 — two decimals', sql: { sqlite: 'NUMERIC(12,2)', postgres: 'NUMERIC(12,2)', mysql: 'DECIMAL(12,2)', mssql: 'DECIMAL(12,2)' } },
  { id: 'bool', label: 'Yes / No', hint: 'True or false', sql: { sqlite: 'INTEGER', postgres: 'BOOLEAN', mysql: 'TINYINT(1)', mssql: 'BIT' } },
  { id: 'date', label: 'Date', hint: '2026-09-24', sql: { sqlite: 'DATE', postgres: 'DATE', mysql: 'DATE', mssql: 'DATE' } },
  { id: 'datetime', label: 'Date and time', hint: '2026-09-24 14:30', sql: { sqlite: 'DATETIME', postgres: 'TIMESTAMP', mysql: 'DATETIME', mssql: 'DATETIME2' } }
];
function autoIdSQL() {
  return { sqlite: 'INTEGER PRIMARY KEY AUTOINCREMENT', postgres: 'INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY', mysql: 'INT AUTO_INCREMENT PRIMARY KEY', mssql: 'INT IDENTITY(1,1) PRIMARY KEY' }[TW.adapter.kind];
}
function friendlyType(t, colName) {
  t = String(t || '').toLowerCase();
  if (/bool|bit\b|tinyint\(1\)/.test(t)) return 'bool';
  if (/^(is_|has_)|discontinued|active/.test(colName || '') && /int/.test(t)) return 'bool';
  if (/date.*time|timestamp|datetime/.test(t)) return 'datetime';
  if (/date/.test(t)) return 'date';
  if (/numeric\(\d+,\s*2\)|decimal\(\d+,\s*2\)|money/.test(t)) return 'money';
  if (/int/.test(t)) return 'int';
  if (/real|float|double|numeric|decimal/.test(t)) return 'decimal';
  if (/clob|max|longtext|mediumtext/.test(t)) return 'longtext';
  return 'text';
}
function ftypeLabel(id) { return (FTYPES.find(f => f.id === id) || FTYPES[0]).label; }
const NUMERIC_T = new Set(['int', 'decimal', 'money']);

/* ---------- state ---------- */
TW.state = {
  view: 'home', table: null, tables: [], schema: {},
  readOnly: store.get('readOnly', false),
  sendSamples: store.get('aiSamples', false),
  log: [], undo: []
};

/* ---------- toast + modal ---------- */
function toast(msg, opts) {
  opts = opts || {};
  const t = h('div', { class: 'toast' + (opts.bad ? ' bad' : '') }, h('span', null, msg));
  if (opts.action) t.append(h('button', { onclick: () => { opts.action.fn(); t.remove(); } }, opts.action.label));
  $('#toasts').append(t);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  setTimeout(() => t.remove(), opts.ms || (opts.bad ? 7000 : 3800));
}
function modal({ title, body, actions, wide, onClose }) {
  const close = () => { scrim.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const foot = h('footer');
  for (const a of (actions || [])) foot.append(h('button', { class: 'btn ' + (a.kind || ''), onclick: async () => { const r = a.fn ? await a.fn() : null; if (r !== false) close(); } }, a.label));
  const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', null, h('h2', null, title), h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, icon('x'))),
    h('div', { class: 'mbody' }, body), actions && actions.length ? foot : null);
  const scrim = h('div', { class: 'scrim', onclick: e => { if (e.target === scrim) close(); } }, box);
  document.body.append(scrim); document.addEventListener('keydown', onKey);
  setTimeout(() => { const f = box.querySelector('input,select,textarea'); if (f) f.focus(); }, 30);
  return { close, box };
}
function confirmBox({ title, message, confirmLabel, danger, typeToConfirm, sql }) {
  return new Promise(resolve => {
    let input = null;
    const body = [h('p', null, message)];
    if (sql) body.push(h('details', null, h('summary', { class: 'faint', style: { cursor: 'pointer', fontSize: '13px' } }, 'Show the SQL this runs'), sqlBlock(sql)));
    if (typeToConfirm) { input = h('input', { class: 'input', id: 'confirmType', placeholder: typeToConfirm }); body.push(h('label', { class: 'field' }, h('span', null, `Type ${typeToConfirm} to confirm`), input)); }
    let done = false;
    modal({
      title, body, onClose: () => { if (!done) resolve(false); },
      actions: [{ label: 'Cancel', fn: () => { done = true; resolve(false); } },
      { label: confirmLabel || 'Confirm', kind: danger ? 'danger solid' : 'primary', fn: () => { if (input && input.value.trim() !== typeToConfirm) { input.focus(); toast(`Type "${typeToConfirm}" exactly to confirm.`); return false; } done = true; resolve(true); } }]
    });
  });
}

/* ---------- SQL display ---------- */
const KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|ADD COLUMN|RENAME TO|DROP TABLE|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|IN|IS NULL|IS NOT NULL|LIKE|ILIKE|BETWEEN|ASC|DESC|PRIMARY KEY|REFERENCES|NOT NULL|UNIQUE|DEFAULT|TOP|FETCH NEXT|ROWS ONLY|CASE|WHEN|THEN|ELSE|END|WITH|UNION)\b/g;
function highlightSQL(sql) {
  const parts = String(sql).split(/('(?:[^']|'')*')/g);
  return parts.map((p, i) => i % 2 ? `<span class="str">${esc(p)}</span>` : esc(p).replace(KW, '<span class="kw">$1</span>')).join('');
}
function sqlBlock(sql) { return h('pre', { class: 'sql', html: highlightSQL(sql) }); }
function inlineParams(sql, params) {        // for display only
  let i = 0;
  return sql.replace(/\?/g, () => { const v = params[i++]; return v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : "'" + String(v).replace(/'/g, "''") + "'"; });
}

/* ---------- plain-English errors ---------- */
function explainError(err) {
  const m = String(err && err.message || err);
  const rules = [
    [/no such table: (\S+)|relation "([^"]+)" does not exist|Table '([^']+)' doesn't exist|Invalid object name '([^']+)'/i, x => `There is no table called "${x.slice(1).find(Boolean)}". Check the spelling or pick a table from the list on the left.`],
    [/no such column: (\S+)|column "([^"]+)" does not exist|Unknown column '([^']+)'|Invalid column name '([^']+)'/i, x => `There is no column called "${x.slice(1).find(Boolean)}" here. Open the table in the Browse data tab to see its column names.`],
    [/UNIQUE constraint failed: (\S+)|duplicate key|Duplicate entry|Violation of UNIQUE KEY|Cannot insert duplicate key/i, x => `That value is already used${x[1] ? ` in ${x[1]}` : ''}, and this column must be unique. Use a different value.`],
    [/NOT NULL constraint failed: (\S+)|null value in column "([^"]+)"|Column '([^']+)' cannot be null|Cannot insert the value NULL into column '([^']+)'/i, x => `"${x.slice(1).find(Boolean)}" is required. Fill it in before saving.`],
    [/FOREIGN KEY constraint failed|violates foreign key|foreign key constraint fails|conflicted with the (FOREIGN KEY|REFERENCE) constraint/i, () => 'This change breaks a link between tables. Either the linked record does not exist, or other rows still point at the one you are removing. Remove or change those rows first.'],
    [/syntax error|near "([^"]+)"|You have an error in your SQL syntax|Incorrect syntax near/i, x => `The SQL has a typo${x[1] ? ` near "${x[1]}"` : ''}. Check for missing commas, quotes or brackets. Try the Question builder if you want it written for you.`],
    [/datatype mismatch|invalid input syntax|Incorrect .* value|Conversion failed/i, () => 'A value is the wrong kind for its column. For example, text was typed where a number or date is expected.'],
    [/read.?only/i, () => 'Read-only mode is on, so changes are blocked. Turn it off in Settings if you need to edit.'],
    [/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo|Failed to connect/i, () => 'The database server could not be reached. Check the host name, port, VPN and firewall.'],
    [/password authentication failed|Access denied for user|Login failed/i, () => 'The user name or password was not accepted by the server.']
  ];
  for (const [re, fn] of rules) { const x = m.match(re); if (x) return { friendly: fn(x), raw: m }; }
  return { friendly: 'The database reported a problem.', raw: m };
}
function errorNotice(err) {
  const e = explainError(err);
  return h('div', { class: 'notice bad' }, h('div', null, h('b', null, e.friendly), h('div', { class: 'mono faint', style: { fontSize: '12px', marginTop: '4px' } }, e.raw)));
}

/* ---------- running SQL (with logging, read-only guard and undo) ---------- */
const WRITE_RE = /^\s*(insert|update|delete|replace|create|alter|drop|truncate|merge|grant|revoke|rename|attach|detach|vacuum|pragma\s+\w+\s*=)/i;
function isWrite(sql) { return String(sql).split(';').some(s => WRITE_RE.test(s.replace(/^\s*(--[^\n]*\n\s*)*/, ''))); }
function logKind(sql) { const s = sql.trim().toLowerCase(); if (/^delete|^drop|^truncate/.test(s)) return 'delete'; if (/^create|^alter/.test(s)) return 'schema'; if (/^insert|^update|^replace/.test(s)) return 'write'; return 'read'; }
async function run(sql, params, opts) {
  opts = opts || {};
  const write = isWrite(sql);
  if (write && TW.state.readOnly) throw new Error('Read-only mode is on. Changes are blocked.');
  if (write) await snapshotForUndo(opts.label || sql);
  const t0 = performance.now();
  const res = await TW.adapter.query(sql, params || []);
  res.ms = Math.round(performance.now() - t0);
  if (write || opts.log) {
    TW.state.log.unshift({ at: new Date(), kind: logKind(sql), sql: params && params.length ? inlineParams(sql, params) : sql, label: opts.label || '', changes: res.changes });
    if (TW.state.log.length > 500) TW.state.log.pop();
  }
  if (write) { afterWrite(); }
  return res;
}
async function runTx(statements, label) {           // [{sql, params}]
  if (TW.state.readOnly) throw new Error('Read-only mode is on. Changes are blocked.');
  await snapshotForUndo(label);
  const begin = TW.adapter.kind === 'mssql' ? 'BEGIN TRANSACTION' : TW.adapter.kind === 'mysql' ? 'START TRANSACTION' : 'BEGIN';
  if (TW.adapter.transaction) { await TW.adapter.transaction(statements); }
  else {
    await TW.adapter.query(begin, []);
    try { for (const s of statements) await TW.adapter.query(s.sql, s.params || []); await TW.adapter.query('COMMIT', []); }
    catch (e) { try { await TW.adapter.query('ROLLBACK', []); } catch (x) { } throw e; }
  }
  TW.state.log.unshift({ at: new Date(), kind: 'write', sql: statements.slice(0, 3).map(s => inlineParams(s.sql, s.params || [])).join(';\n') + (statements.length > 3 ? `;\n… and ${statements.length - 3} more` : ''), label, changes: statements.length });
  afterWrite();
}
async function snapshotForUndo(label) {
  if (!TW.adapter || !TW.adapter.snapshot || !TW.adapter.restoreBytes) return;
  try {
    const bytes = await TW.adapter.snapshot();
    if (!bytes) return;
    if (bytes.length > 40e6) return;
    TW.state.undo.push({ bytes, label: String(label).slice(0, 80) });
    if (TW.state.undo.length > 15) TW.state.undo.shift();
    $('#undoBtn').hidden = false;
  } catch (e) { }
}
async function undoLast() {
  const u = TW.state.undo.pop();
  if (!u) return;
  await TW.adapter.restoreBytes(u.bytes);
  TW.state.log.unshift({ at: new Date(), kind: 'write', sql: '-- undo', label: 'Undid: ' + u.label });
  $('#undoBtn').hidden = !TW.state.undo.length;
  afterWrite(true);
  toast('Undone.');
}
let saveTimer = null;
function afterWrite() {
  TW.state.schema = {};
  refreshTables();
  if (TW.adapter.persist) { clearTimeout(saveTimer); saveTimer = setTimeout(() => TW.adapter.persist(), 400); }
}

/* ---------- schema cache ---------- */
async function refreshTables() {
  try { TW.state.tables = await TW.adapter.listTables(); } catch (e) { TW.state.tables = []; toast('Could not list tables: ' + e.message, { bad: true }); }
  renderTablesList();
  return TW.state.tables;
}
async function describe(t) {
  if (!TW.state.schema[t]) TW.state.schema[t] = await TW.adapter.describe(t);
  return TW.state.schema[t];
}
async function allSchemas() {
  const out = {};
  for (const t of TW.state.tables) { try { out[t.name] = await describe(t.name); } catch (e) { } }
  return out;
}

/* ---------- files: save / zip ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {                    // [{name, data:Uint8Array}] — stored, no compression
  const enc = new TextEncoder(); const chunks = []; const central = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(8, 0, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
    chunks.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  }
  const csz = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, csz, true); end.setUint32(16, off, true);
  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}
async function saveFile(filename, data) {
  if (DESK) { const r = await DESK.saveFile(filename, data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : data); if (r && r.path) toast('Saved to ' + r.path); return; }
  const ext = filename.split('.').pop().toLowerCase();
  const allowed = ['csv', 'xlsx', 'json', 'txt', 'md', 'zip', 'html'];
  if (!allowed.includes(ext)) {       // database files travel inside a .zip in the browser
    const bytes = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : typeof data === 'string' ? new TextEncoder().encode(data) : data;
    data = makeZip([{ name: filename, data: bytes }]); filename = filename.replace(/\.[^.]+$/, '') + '.zip';
  }
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename, data }); toast('Saved ' + filename); return; }
  } catch (e) { if (e && e.code === 'declined') return; if (e && e.code && !['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].includes(e.code)) { toast('Could not save: ' + (e.message || e.code), { bad: true }); return; } }
  const blob = data instanceof Blob ? data : new Blob([data]);
  const a = h('a', { href: URL.createObjectURL(blob), download: filename }); document.body.append(a); a.click(); a.remove();
}
function toCSV(columns, rows) {
  const cell = v => { if (v === null || v === undefined) return ''; if (v instanceof Uint8Array) return ''; const s = String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + [columns.map(cell).join(','), ...rows.map(r => r.map(cell).join(','))].join('\r\n');
}
async function exportRows(name, columns, rows, fmt) {
  if (fmt === 'xlsx') {
    if (!window.XLSX) { toast('Excel export needs the spreadsheet library, which did not load. Use CSV instead.', { bad: true }); return; }
    const ws = XLSX.utils.aoa_to_sheet([columns, ...rows.map(r => r.map(v => v instanceof Uint8Array ? '' : v))]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, String(name).slice(0, 31) || 'Sheet1');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    await saveFile(name + '.xlsx', new Blob([out]));
  } else await saveFile(name + '.csv', toCSV(columns, rows));
}

/* ---------- value display ---------- */
function displayVal(v) {
  if (v === null || v === undefined) return { text: 'empty', cls: 'null' };
  if (v instanceof Uint8Array) return { text: `[file, ${v.length} bytes]`, cls: 'null' };
  if (typeof v === 'number' || typeof v === 'bigint') return { text: fmtNum(Number(v)), cls: 'n' };
  if (typeof v === 'boolean') return { text: v ? 'Yes' : 'No', cls: '' };
  if (v instanceof Date) return { text: v.toISOString().replace('T', ' ').replace(/\.000Z$/, ''), cls: '' };
  if (typeof v === 'object') return { text: JSON.stringify(v), cls: '' };
  return { text: String(v), cls: '' };
}
function resultGrid(columns, rows, opts) {
  opts = opts || {};
  if (!columns || !columns.length) return h('div', { class: 'empty' }, opts.emptyText || 'Nothing to show.');
  const thead = h('tr', null, columns.map(c => h('th', { style: { cursor: 'default' } }, c)));
  const shown = rows.slice(0, opts.max || 1000);
  const tb = h('tbody');
  for (const r of shown) tb.append(h('tr', null, r.map(v => { const d = displayVal(v); return h('td', { class: d.cls, title: d.text }, d.text); })));
  const wrap = h('div', { class: 'grid-wrap', style: opts.height ? { maxHeight: opts.height } : null }, h('table', { class: 'grid' }, h('thead', null, thead), tb));
  if (!rows.length) wrap.append(h('div', { class: 'empty' }, 'No rows match.'));
  return wrap;
}
function barChart(columns, rows) {             // label column + first numeric column
  if (!rows.length || columns.length < 2) return null;
  const numIdx = columns.findIndex((c, i) => i > 0 && rows.every(r => r[i] === null || typeof r[i] === 'number'));
  if (numIdx < 0) return null;
  const labIdx = columns.findIndex((c, i) => i !== numIdx && rows.some(r => typeof r[i] === 'string'));
  if (labIdx < 0) return null;
  const data = rows.map(r => [String(r[labIdx] ?? 'empty'), Number(r[numIdx] || 0)]).slice(0, 25);
  const max = Math.max(...data.map(d => d[1]), 0);
  if (max <= 0) return null;
  return h('div', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h3', null, `${columns[numIdx]} by ${columns[labIdx]}`), h('span', { class: 'faint', style: { fontSize: '12px' } }, data.length < rows.length ? `Top ${data.length} of ${rows.length}` : '')),
    h('div', { class: 'bar-chart' }, data.map(([l, v]) => h('div', { class: 'bar-row' }, h('span', { class: 'lb', title: l }, l), h('div', null, h('div', { class: 'bar', style: { width: (v / max * 100).toFixed(2) + '%' } })), h('span', { class: 'v' }, fmtNum(v))))));
}

/* ---------- dialect-aware SQL expressions used by filters and the builder ---------- */
const DX = {
  today() { return { sqlite: "DATE('now')", postgres: 'CURRENT_DATE', mysql: 'CURDATE()', mssql: 'CAST(GETDATE() AS DATE)' }[TW.adapter.kind]; },
  daysAgoParam() { return { sqlite: "DATE('now', '-' || ? || ' days')", postgres: 'CURRENT_DATE - CAST(? AS INTEGER)', mysql: 'DATE_SUB(CURDATE(), INTERVAL ? DAY)', mssql: 'DATEADD(day, -CAST(? AS INT), CAST(GETDATE() AS DATE))' }[TW.adapter.kind]; },
  fn(f, e) {
    const k = TW.adapter.kind;
    switch (f) {
      case 'UPPER': case 'LOWER': case 'TRIM': case 'ABS': return `${f}(${e})`;
      case 'LENGTH': return k === 'mssql' ? `LEN(${e})` : k === 'mysql' ? `CHAR_LENGTH(${e})` : `LENGTH(${e})`;
      case 'FIRST1': return k === 'sqlite' ? `SUBSTR(${e}, 1, 1)` : `SUBSTRING(${e}, 1, 1)`;
      case 'ROUND0': return `ROUND(${e}, 0)`;
      case 'ROUND2': return `ROUND(${e}, 2)`;
      case 'YEAR': return { sqlite: `CAST(STRFTIME('%Y', ${e}) AS INTEGER)`, postgres: `CAST(EXTRACT(YEAR FROM ${e}) AS INTEGER)`, mysql: `YEAR(${e})`, mssql: `YEAR(${e})` }[k];
      case 'MONTH': return { sqlite: `CAST(STRFTIME('%m', ${e}) AS INTEGER)`, postgres: `CAST(EXTRACT(MONTH FROM ${e}) AS INTEGER)`, mysql: `MONTH(${e})`, mssql: `MONTH(${e})` }[k];
      case 'YM': return { sqlite: `STRFTIME('%Y-%m', ${e})`, postgres: `TO_CHAR(${e}, 'YYYY-MM')`, mysql: `DATE_FORMAT(${e}, '%Y-%m')`, mssql: `FORMAT(${e}, 'yyyy-MM')` }[k];
      case 'DATE': return { sqlite: `DATE(${e})`, postgres: `CAST(${e} AS DATE)`, mysql: `DATE(${e})`, mssql: `CAST(${e} AS DATE)` }[k];
      case 'DOW': return { sqlite: `CASE CAST(STRFTIME('%w', ${e}) AS INTEGER) WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday' WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday' ELSE 'Saturday' END`, postgres: `TRIM(TO_CHAR(${e}, 'Day'))`, mysql: `DAYNAME(${e})`, mssql: `DATENAME(weekday, ${e})` }[k];
    }
    return e;
  }
};
const COL_FNS = {
  text: [['', 'As it is'], ['UPPER', 'In CAPITALS'], ['LOWER', 'In small letters'], ['TRIM', 'Without extra spaces'], ['FIRST1', 'First letter'], ['LENGTH', 'Number of letters']],
  number: [['', 'As it is'], ['ROUND0', 'Rounded'], ['ROUND2', 'Rounded to 2 decimals'], ['ABS', 'Without minus sign']],
  date: [['', 'As it is'], ['YEAR', 'Year'], ['YM', 'Year and month'], ['MONTH', 'Month number'], ['DOW', 'Day of the week'], ['DATE', 'Date only']]
};
function fnGroup(ft) { return NUMERIC_T.has(ft) ? 'number' : (ft === 'date' || ft === 'datetime') ? 'date' : (ft === 'bool' ? null : 'text'); }
function fnLabel(f) { for (const g of Object.values(COL_FNS)) { const x = g.find(y => y[0] === f); if (x) return x[1]; } return f; }
