/*
 * Tablewise — main.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
// Tablewise desktop — main process
const { app, BrowserWindow, ipcMain, dialog, safeStorage, shell, Menu, net } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const USER = () => app.getPath('userData');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(USER(), f), 'utf8')); } catch (e) { return d; } };
const writeJSON = (f, v) => { fs.mkdirSync(USER(), { recursive: true }); fs.writeFileSync(path.join(USER(), f), JSON.stringify(v, null, 2)); };
const enc = s => { if (!s) return null; if (safeStorage.isEncryptionAvailable()) return 'e:' + safeStorage.encryptString(s).toString('base64'); return 'p:' + Buffer.from(s).toString('base64'); };
const dec = s => { if (!s) return ''; try { if (s.startsWith('e:')) return safeStorage.decryptString(Buffer.from(s.slice(2), 'base64')); return Buffer.from(s.slice(2), 'base64').toString(); } catch (e) { return ''; } };

/* ---------------- SQL helpers ---------------- */
function convertParams(sql, style) {           // '?' -> $1 (postgres) or @p1 (mssql), skipping quoted text
  let out = '', n = 0, q = null;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (q) { out += c; if (c === q) { if (sql[i + 1] === q) { out += sql[++i]; } else q = null; } continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; out += c; continue; }
    if (c === '[' && style === 'mssql') { const j = sql.indexOf(']', i); if (j > 0) { out += sql.slice(i, j + 1); i = j; continue; } }
    if (c === '-' && sql[i + 1] === '-') { const j = sql.indexOf('\n', i); const e = j < 0 ? sql.length : j; out += sql.slice(i, e); i = e - 1; continue; }
    if (c === '?') { n++; out += style === 'postgres' ? '$' + n : '@p' + n; continue; }
    out += c;
  }
  return out;
}
const isReadSQL = sql => /^\s*(select|with|pragma\s+\w+\s*(\(|;|$)|explain|show|describe)\b/i.test(sql) && !/;\s*\S/.test(sql.trim().replace(/;\s*$/, ''));
const splitName = (name, def) => { const i = name.indexOf('.'); return i > 0 ? [name.slice(0, i), name.slice(i + 1)] : [def, name]; };

/* ---------------- SQLite (sql.js, file backed) ---------------- */
let SQL = null;
async function sqljs() {
  if (SQL) return SQL;
  const init = require('sql.js');
  SQL = await init({ wasmBinary: fs.readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')) });
  return SQL;
}
const { makeSqliteAdapter } = require('./app/sqlite-core.js');
async function openSqlite(cfg) {
  const S = await sqljs();
  let db;
  if (cfg.create || !fs.existsSync(cfg.file)) db = new S.Database();
  else db = new S.Database(fs.readFileSync(cfg.file));
  db.exec('SELECT count(*) FROM sqlite_master');
  const a = makeSqliteAdapter(db, { name: path.basename(cfg.file).replace(/\.(sqlite3?|db)$/i, '') });
  let timer = null;
  const save = () => { const tmp = cfg.file + '.tw-tmp'; fs.writeFileSync(tmp, Buffer.from(a.exportBytes())); fs.renameSync(tmp, cfg.file); };
  const saveSoon = () => { clearTimeout(timer); timer = setTimeout(() => { timer = null; try { save(); } catch (e) { console.error(e); } }, 150); };
  if (cfg.create) save();
  return {
    kind: 'sqlite', name: a.name, file: cfg.file,
    async query(sql, params) { const r = await a.query(sql, params); if (!isReadSQL(sql)) saveSoon(); return r; },
    listTables: () => a.listTables(), describe: t => a.describe(t),
    async transaction(stmts) {
      a._db.run('BEGIN');
      try { for (const s of stmts) await a.query(s.sql, s.params || []); a._db.run('COMMIT'); } catch (e) { try { a._db.run('ROLLBACK'); } catch (x) { } throw e; }
      saveSoon();
    },
    snapshot: () => a.exportBytes(),
    async restore(bytes) { const nd = new S.Database(Buffer.from(bytes)); const fresh = makeSqliteAdapter(nd, { name: a.name }); try { a._db.close(); } catch (e) { } Object.assign(a, { query: fresh.query, listTables: fresh.listTables, describe: fresh.describe, exportBytes: fresh.exportBytes, _db: nd }); save(); },
    flush() { if (timer) { clearTimeout(timer); timer = null; save(); } },
    close() { this.flush(); a.close(); },
    _a: a
  };
}
/* ---------------- PostgreSQL ---------------- */
async function openPostgres(cfg) {
  const pg = require('pg');
  pg.types.setTypeParser(1700, v => v === null ? null : parseFloat(v));
  pg.types.setTypeParser(20, v => { const n = Number(v); return Number.isSafeInteger(n) ? n : v; });
  pg.types.setTypeParser(1082, v => v);
  const mk = async () => { const c = new pg.Client({ host: cfg.host, port: cfg.port || 5432, database: cfg.database, user: cfg.user, password: cfg.password, ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 12000, application_name: 'Tablewise' }); await c.connect(); c.on('error', () => { }); return c; };
  let client = await mk();
  const q = async (sql, params) => {
    const text = params && params.length ? convertParams(sql, 'postgres') : sql;
    let res;
    try { res = await client.query({ text, values: params && params.length ? params : undefined, rowMode: 'array' }); }
    catch (e) { if (/terminated|ECONNRESET|not queryable/i.test(e.message)) { client = await mk(); res = await client.query({ text, values: params && params.length ? params : undefined, rowMode: 'array' }); } else throw e; }
    const list = Array.isArray(res) ? res : [res];
    const sets = list.filter(r => r.fields && r.fields.length).map(r => ({ columns: r.fields.map(f => f.name), rows: r.rows }));
    const last = sets[sets.length - 1] || { columns: [], rows: [] };
    return { columns: last.columns, rows: last.rows, sets, changes: list.reduce((a, r) => a + (r.command !== 'SELECT' && r.rowCount ? r.rowCount : 0), 0) };
  };
  const name = t => t.schema === 'public' ? t.name : `${t.schema}.${t.name}`;
  return {
    kind: 'postgres', name: cfg.label || cfg.database,
    query: q,
    async listTables() {
      const r = await q(`SELECT n.nspname, c.relname, c.relkind, c.reltuples::bigint FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind IN ('r','v','p','m') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND NOT c.relispartition ORDER BY (c.relkind IN ('v','m')), n.nspname <> 'public', n.nspname, c.relname`);
      const out = [];
      for (const [schema, tname, kind, est] of r.rows) {
        const t = { name: name({ schema, name: tname }), type: kind === 'v' || kind === 'm' ? 'view' : 'table', count: est >= 0 ? Number(est) : null };
        if (t.type === 'table' && (est < 50000) && out.length < 200) { try { t.count = Number((await q(`SELECT COUNT(*) FROM "${schema.replace(/"/g, '""')}"."${tname.replace(/"/g, '""')}"`)).rows[0][0]); } catch (e) { } }
        out.push(t);
      }
      return out;
    },
    async describe(table) {
      const [schema, tname] = splitName(table, 'public');
      const cols = await q(`SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default, is_identity FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position`, [schema, tname]);
      const cons = await q(`SELECT tc.constraint_type, kcu.column_name, tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.constraint_schema = tc.constraint_schema AND kcu.table_name = tc.table_name
        WHERE tc.table_schema = ? AND tc.table_name = ? AND tc.constraint_type IN ('PRIMARY KEY','UNIQUE') ORDER BY kcu.ordinal_position`, [schema, tname]);
      const fks = await q(`SELECT a.attname, fn.nspname, fc.relname, fa.attname FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid JOIN pg_namespace n ON n.oid = cl.relnamespace
        JOIN pg_class fc ON fc.oid = c.confrelid JOIN pg_namespace fn ON fn.oid = fc.relnamespace
        JOIN LATERAL unnest(c.conkey, c.confkey) WITH ORDINALITY AS k(attnum, fattnum, ord) ON true
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = k.fattnum
        WHERE c.contype = 'f' AND n.nspname = ? AND cl.relname = ?`, [schema, tname]);
      return buildDescribe(table, cols.rows.map(r => ({ name: r[0], type: pgType(r), notnull: r[5] === 'NO', dflt: r[6], auto: r[7] === 'YES' || /^nextval\(/.test(r[6] || '') })), cons.rows, fks.rows.map(r => ({ from: r[0], table: name({ schema: r[1], name: r[2] }), to: r[3] })));
    },
    async transaction(stmts) { await q('BEGIN'); try { for (const s of stmts) await q(s.sql, s.params); await q('COMMIT'); } catch (e) { try { await q('ROLLBACK'); } catch (x) { } throw e; } },
    close() { client.end().catch(() => { }); }
  };
}
function pgType(r) { const [, t, len, p, s] = r; if (/character varying/.test(t)) return `varchar(${len || ''})`; if (t === 'character') return `char(${len})`; if (t === 'numeric' && p) return `numeric(${p},${s})`; if (/timestamp/.test(t)) return 'timestamp'; return t; }
function buildDescribe(table, cols, cons, fks) {
  const pk = cons.filter(c => c[0] === 'PRIMARY KEY').map(c => c[1]);
  const byCon = {}; for (const c of cons.filter(c => c[0] === 'UNIQUE')) (byCon[c[2]] = byCon[c[2]] || []).push(c[1]);
  const uniq = new Set(Object.values(byCon).filter(a => a.length === 1).map(a => a[0]));
  for (const c of cols) {
    c.pk = pk.includes(c.name); c.unique = uniq.has(c.name) || (c.pk && pk.length === 1); c.auto = !!c.auto && c.pk;
    const f = fks.find(f => f.from === c.name); if (f) c.fk = { table: f.table, column: f.to };
  }
  return { name: table, columns: cols, fks, key: pk.length ? pk : null, implicitRowid: false };
}

/* ---------------- MySQL / MariaDB ---------------- */
async function openMysql(cfg) {
  const mysql = require('mysql2/promise');
  const opts = { host: cfg.host, port: cfg.port || 3306, database: cfg.database, user: cfg.user, password: cfg.password, ssl: cfg.ssl ? { rejectUnauthorized: false } : undefined, multipleStatements: true, dateStrings: true, decimalNumbers: true, supportBigNumbers: true, connectTimeout: 12000 };
  let conn = await mysql.createConnection(opts);
  const q = async (sql, params) => {
    let res;
    const doQ = () => conn.query({ sql, rowsAsArray: true }, params || []);
    try { res = await doQ(); } catch (e) { if (/closed state|ECONNRESET|PROTOCOL_CONNECTION_LOST/i.test(e.message + e.code)) { conn = await mysql.createConnection(opts); res = await doQ(); } else throw e; }
    const [rows, fields] = res;
    let sets = [], changes = 0;
    if (Array.isArray(rows) && Array.isArray(fields) && fields.length === rows.length && fields.some(f => f === undefined || Array.isArray(f))) {
      rows.forEach((r, i) => { if (Array.isArray(fields[i])) sets.push({ columns: fields[i].map(f => f.name), rows: r }); else changes += (r && r.affectedRows) || 0; });
    } else if (Array.isArray(fields) && fields.length) sets.push({ columns: fields.map(f => f.name), rows });
    else changes = (rows && rows.affectedRows) || 0;
    const last = sets[sets.length - 1] || { columns: [], rows: [] };
    return { columns: last.columns, rows: last.rows, sets, changes };
  };
  return {
    kind: 'mysql', name: cfg.label || cfg.database, query: q,
    async listTables() {
      const r = await q(`SELECT TABLE_NAME, TABLE_TYPE, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_TYPE = 'VIEW', TABLE_NAME`);
      const out = [];
      for (const [n, t, est] of r.rows) {
        const x = { name: n, type: /VIEW/.test(t) ? 'view' : 'table', count: est === null ? null : Number(est) };
        if (x.type === 'table' && (est === null || est < 50000)) { try { x.count = Number((await q('SELECT COUNT(*) FROM `' + n.replace(/`/g, '``') + '`')).rows[0][0]); } catch (e) { } }
        out.push(x);
      }
      return out;
    },
    async describe(table) {
      const cols = await q(`SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`, [table]);
      const cons = await q(`SELECT tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME, tc.CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kcu.TABLE_SCHEMA = tc.TABLE_SCHEMA AND kcu.TABLE_NAME = tc.TABLE_NAME
        WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = ? AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY','UNIQUE') ORDER BY kcu.ORDINAL_POSITION`, [table]);
      const fks = await q(`SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`, [table]);
      return buildDescribe(table, cols.rows.map(r => ({ name: r[0], type: r[1], notnull: r[2] === 'NO', dflt: r[3], auto: /auto_increment/i.test(r[4] || '') })), cons.rows, fks.rows.map(r => ({ from: r[0], table: r[1], to: r[2] })));
    },
    async transaction(stmts) { await conn.beginTransaction(); try { for (const s of stmts) await q(s.sql, s.params); await conn.commit(); } catch (e) { try { await conn.rollback(); } catch (x) { } throw e; } },
    close() { conn.end().catch(() => { }); }
  };
}

/* ---------------- SQL Server ---------------- */
async function openMssql(cfg) {
  const mssql = require('mssql');
  const pool = new mssql.ConnectionPool({ server: cfg.host, port: +cfg.port || 1433, database: cfg.database, user: cfg.user, password: cfg.password, pool: { max: 1, min: 0 }, connectionTimeout: 15000, requestTimeout: 120000, options: { encrypt: !!cfg.ssl, trustServerCertificate: true, appName: 'Tablewise' } });
  await pool.connect();
  let tx = null;
  const q = async (sql, params) => {
    const req = new mssql.Request(tx || pool);
    req.arrayRowMode = true;
    (params || []).forEach((v, i) => req.input('p' + (i + 1), v));
    const res = await req.query(params && params.length ? convertParams(sql, 'mssql') : sql);
    const sets = (res.recordsets || []).map((rs, i) => ({ columns: (res.columns && res.columns[i] ? res.columns[i] : []).map(c => c.name), rows: rs }));
    const last = sets[sets.length - 1] || { columns: [], rows: [] };
    return { columns: last.columns, rows: last.rows, sets, changes: (res.rowsAffected || []).reduce((a, b) => a + b, 0) };
  };
  const nm = (s, t) => s === 'dbo' ? t : `${s}.${t}`;
  return {
    kind: 'mssql', name: cfg.label || cfg.database, query: q,
    async listTables() {
      const r = await q(`SELECT s.name, t.name, 'table', SUM(p.rows) FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0,1) GROUP BY s.name, t.name
        UNION ALL SELECT s.name, v.name, 'view', NULL FROM sys.views v JOIN sys.schemas s ON s.schema_id = v.schema_id ORDER BY 3, 1, 2`);
      return r.rows.map(([s, t, k, c]) => ({ name: nm(s, t), type: k, count: c === null ? null : Number(c) }));
    },
    async describe(table) {
      const [schema, tname] = splitName(table, 'dbo');
      const cols = await q(`SELECT c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.NUMERIC_PRECISION, c.NUMERIC_SCALE, c.IS_NULLABLE, c.COLUMN_DEFAULT, COLUMNPROPERTY(OBJECT_ID(QUOTENAME(c.TABLE_SCHEMA) + '.' + QUOTENAME(c.TABLE_NAME)), c.COLUMN_NAME, 'IsIdentity')
        FROM INFORMATION_SCHEMA.COLUMNS c WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ? ORDER BY c.ORDINAL_POSITION`, [schema, tname]);
      const cons = await q(`SELECT tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME, tc.CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
        WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ? AND tc.CONSTRAINT_TYPE IN ('PRIMARY KEY','UNIQUE') ORDER BY kcu.ORDINAL_POSITION`, [schema, tname]);
      const fks = await q(`SELECT pc.name, rs.name, rt.name, rc.name FROM sys.foreign_key_columns fkc
        JOIN sys.tables pt ON pt.object_id = fkc.parent_object_id JOIN sys.schemas ps ON ps.schema_id = pt.schema_id
        JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
        JOIN sys.tables rt ON rt.object_id = fkc.referenced_object_id JOIN sys.schemas rs ON rs.schema_id = rt.schema_id
        JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
        WHERE ps.name = ? AND pt.name = ?`, [schema, tname]);
      const ty = r => { const [, t, len, p, s] = r; if (/char/.test(t)) return `${t}(${len === -1 ? 'MAX' : len})`; if (/decimal|numeric/.test(t)) return `${t}(${p},${s})`; return t; };
      return buildDescribe(table, cols.rows.map(r => ({ name: r[0], type: ty(r), notnull: r[5] === 'NO', dflt: r[6], auto: r[7] === 1 })), cons.rows, fks.rows.map(r => ({ from: r[0], table: nm(r[1], r[2]), to: r[3] })));
    },
    async transaction(stmts) { tx = new mssql.Transaction(pool); await tx.begin(); try { for (const s of stmts) await q(s.sql, s.params); await tx.commit(); } catch (e) { try { await tx.rollback(); } catch (x) { } throw e; } finally { tx = null; } },
    close() { pool.close().catch(() => { }); }
  };
}

/* ---------------- connection registry ---------------- */
const conns = new Map();
function withSecret(cfg) {
  if (cfg.id && !cfg.password) { const saved = readJSON('connections.json', []).find(c => c.id === cfg.id); if (saved) return { ...saved, ...cfg, password: dec(saved.passwordEnc) }; }
  return cfg;
}
async function openAny(cfg) {
  cfg = withSecret(cfg);
  if (cfg.kind === 'sqlite') return openSqlite(cfg);
  if (cfg.kind === 'postgres') return openPostgres(cfg);
  if (cfg.kind === 'mysql') return openMysql(cfg);
  if (cfg.kind === 'mssql') return openMssql(cfg);
  throw new Error('Unknown database type ' + cfg.kind);
}
const plain = v => JSON.parse(JSON.stringify(v, (k, x) => typeof x === 'bigint' ? Number(x) : x));
function wrap(fn) { return async (e, ...a) => { try { return { ok: true, v: await fn(...a) } } catch (err) { return { ok: false, error: String(err && err.message || err) }; } }; }
function conn(id) { const c = conns.get(id); if (!c) throw new Error('This connection was closed. Open the database again.'); return c; }
function toClone(r) {                        // keep Dates and Uint8Arrays; make bigint/Buffer safe
  const fix = v => typeof v === 'bigint' ? Number(v) : Buffer.isBuffer(v) ? new Uint8Array(v) : v;
  return { columns: r.columns, rows: (r.rows || []).map(row => row.map(fix)), sets: r.sets ? r.sets.map(s => ({ columns: s.columns, rows: s.rows.map(row => row.map(fix)) })) : undefined, changes: r.changes };
}

ipcMain.handle('db:connect', wrap(async cfg => {
  const c = await openAny(cfg); const id = crypto.randomUUID(); conns.set(id, c);
  return { id, kind: c.kind, name: c.name };
}));
ipcMain.handle('db:test', wrap(async cfg => { const c = await openAny(cfg); await c.query('SELECT 1', []); c.close(); return true; }));
ipcMain.handle('db:query', wrap(async (id, sql, params) => toClone(await conn(id).query(sql, params || []))));
ipcMain.handle('db:listTables', wrap(async id => plain(await conn(id).listTables())));
ipcMain.handle('db:describe', wrap(async (id, t) => plain(await conn(id).describe(t))));
ipcMain.handle('db:transaction', wrap(async (id, stmts) => { await conn(id).transaction(stmts); return true; }));
ipcMain.handle('db:snapshot', wrap(async id => { const c = conn(id); return c.snapshot ? c.snapshot() : null; }));
ipcMain.handle('db:restore', wrap(async (id, b) => { await conn(id).restore(b); return true; }));
ipcMain.handle('db:close', wrap(async id => { const c = conns.get(id); if (c) { c.close(); conns.delete(id); } return true; }));

ipcMain.handle('conn:list', wrap(async () => readJSON('connections.json', []).map(({ passwordEnc, ...c }) => ({ ...c, hasPassword: !!passwordEnc }))));
ipcMain.handle('conn:save', wrap(async c => {
  const list = readJSON('connections.json', []);
  const old = c.id ? list.find(x => x.id === c.id) : null;
  const rec = { id: c.id || crypto.randomUUID(), kind: c.kind, host: c.host, port: c.port, database: c.database, user: c.user, label: c.label, ssl: !!c.ssl, readOnly: !!c.readOnly, remember: c.remember !== false, file: c.file };
  rec.passwordEnc = rec.remember ? (c.password ? enc(c.password) : old && old.passwordEnc) : null;
  const i = list.findIndex(x => x.id === rec.id); if (i >= 0) list[i] = rec; else list.push(rec);
  writeJSON('connections.json', list);
  const { passwordEnc, ...pub } = rec; return { ...pub, password: c.password || '', hasPassword: !!passwordEnc };
}));
ipcMain.handle('conn:delete', wrap(async id => { writeJSON('connections.json', readJSON('connections.json', []).filter(c => c.id !== id)); return true; }));

/* ---------------- files ---------------- */
const DB_FILTERS = [{ name: 'SQLite database', extensions: ['sqlite', 'db', 'sqlite3'] }, { name: 'All files', extensions: ['*'] }];
ipcMain.handle('file:openSqlite', wrap(async () => { const r = await dialog.showOpenDialog(win, { title: 'Open a database file', filters: DB_FILTERS, properties: ['openFile'] }); return r.canceled ? null : r.filePaths[0]; }));
ipcMain.handle('file:newSqlite', wrap(async () => { const r = await dialog.showSaveDialog(win, { title: 'Create a new database file', defaultPath: path.join(app.getPath('documents'), 'my-database.sqlite'), filters: DB_FILTERS }); return r.canceled ? null : r.filePath; }));
ipcMain.handle('file:save', wrap(async (name, data) => {
  const ext = path.extname(name).slice(1) || '*';
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), name), filters: [{ name: ext.toUpperCase() + ' file', extensions: [ext] }] });
  if (r.canceled) return { path: null };
  fs.writeFileSync(r.filePath, typeof data === 'string' ? data : Buffer.from(data));
  return { path: r.filePath };
}));

/* ---------------- AI ---------------- */
function aiCfg() { const s = readJSON('ai.json', {}); return { ...s, apiKey: dec(s.keyEnc) }; }
ipcMain.handle('ai:get', wrap(async () => { const s = readJSON('ai.json', {}); return { provider: s.provider || '', model: s.model || '', baseUrl: s.baseUrl || '', hasKey: !!s.keyEnc }; }));
ipcMain.handle('ai:save', wrap(async s => { const old = readJSON('ai.json', {}); writeJSON('ai.json', { provider: s.provider, model: s.model, baseUrl: s.baseUrl, keyEnc: s.apiKey ? enc(s.apiKey) : (s.provider === old.provider ? old.keyEnc : null) }); return true; }));
async function http(url, opts) {
  const r = await net.fetch(url, opts);
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch (e) { j = null; }
  if (!r.ok) { const m = j && (j.error && (j.error.message || j.error) || j.message) || txt.slice(0, 300); throw new Error(`The AI service said (${r.status}): ${typeof m === 'string' ? m : JSON.stringify(m)}`); }
  return j;
}
const OPENAI_LIKE = { openai: 'https://api.openai.com/v1', github: 'https://models.github.ai/inference' };
ipcMain.handle('ai:chat', wrap(async ({ system, messages }) => {
  const c = aiCfg();
  if (!c.provider) throw new Error('Choose an AI in Settings first.');
  if (c.provider !== 'custom' && !c.apiKey) throw new Error('Add your API key or token in Settings → AI assistant.');
  if (c.provider === 'anthropic') {
    const j = await http('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: c.model || 'claude-sonnet-4-5', max_tokens: 2000, system, messages }) });
    return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  if (c.provider === 'gemini') {
    const model = c.model || 'gemini-2.5-flash';
    const j = await http(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': c.apiKey }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })) }) });
    return ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('');
  }
  const base = (c.provider === 'custom' ? (c.baseUrl || 'http://localhost:11434/v1') : OPENAI_LIKE[c.provider]).replace(/\/+$/, '');
  const headers = { 'content-type': 'application/json' };
  if (c.apiKey) headers.authorization = 'Bearer ' + c.apiKey;
  if (c.provider === 'github') { headers.accept = 'application/vnd.github+json'; headers['X-GitHub-Api-Version'] = '2022-11-28'; }
  const j = await http(base + '/chat/completions', { method: 'POST', headers, body: JSON.stringify({ model: c.model, messages: [{ role: 'system', content: system }, ...messages] }) });
  return j.choices?.[0]?.message?.content || '';
}));
ipcMain.handle('ai:models', wrap(async () => {
  const c = aiCfg();
  if (c.provider === 'anthropic') { const j = await http('https://api.anthropic.com/v1/models?limit=100', { headers: { 'x-api-key': c.apiKey, 'anthropic-version': '2023-06-01' } }); return j.data.map(m => m.id); }
  if (c.provider === 'gemini') { const j = await http('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': c.apiKey } }); return j.models.filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, '')); }
  if (c.provider === 'github') { const j = await http('https://models.github.ai/catalog/models', { headers: { authorization: 'Bearer ' + c.apiKey, accept: 'application/vnd.github+json' } }); return (Array.isArray(j) ? j : j.data || []).map(m => m.id); }
  const base = (c.provider === 'custom' ? (c.baseUrl || 'http://localhost:11434/v1') : OPENAI_LIKE.openai).replace(/\/+$/, '');
  const j = await http(base + '/models', { headers: c.apiKey ? { authorization: 'Bearer ' + c.apiKey } : {} });
  return (j.data || []).map(m => m.id).sort();
}));

/* ---------------- window ---------------- */
let win = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 900, minHeight: 600, title: 'Tablewise ' + app.getVersion(), backgroundColor: '#F3F5F8',
    icon: path.join(__dirname, 'build', 'icon.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, spellcheck: false }
  });
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  win.webContents.once('did-finish-load', () => setTimeout(() => openFromArgs(process.argv), 1200));
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
}
function openFromArgs(argv) {
  const f = (argv || []).slice(1).find(a => /\.(sqlite3?|db)$/i.test(a) && fs.existsSync(a));
  if (f && win) win.webContents.executeJavaScript(`TW.desk.connect(${JSON.stringify({ kind: 'sqlite', file: f })})`).catch(() => { });
}
const menu = Menu.buildFromTemplate([
  { label: 'File', submenu: [{ label: 'Open database file…', accelerator: 'CmdOrCtrl+O', click: () => win && win.webContents.executeJavaScript('TW.desk.openFile()') }, { label: 'New database file…', accelerator: 'CmdOrCtrl+N', click: () => win && win.webContents.executeJavaScript('TW.desk.newFile()') }, { type: 'separator' }, { role: 'quit', label: 'Exit' }] },
  { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
  { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { type: 'separator' }, { role: 'togglefullscreen' }] },
  { label: 'Help', submenu: [{ label: 'Take the tour', click: () => win && win.webContents.executeJavaScript('TW.tour.start()') }, { label: 'Open the guide', click: () => win && win.webContents.executeJavaScript("TW.guide.open('guide')") }, { label: 'About Tablewise', click: () => dialog.showMessageBox(win, { type: 'info', title: 'Tablewise ' + app.getVersion(), message: `Tablewise ${app.getVersion()}`, detail: 'A database manager for people who do not write SQL.\nSQLite · PostgreSQL · MySQL/MariaDB · SQL Server' }) }] }
]);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (e, argv) => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); openFromArgs(argv); } });
  app.whenReady().then(() => { Menu.setApplicationMenu(menu); createWindow(); });
  app.on('before-quit', () => { for (const c of conns.values()) { try { c.close(); } catch (e) { } } });
  app.on('window-all-closed', () => app.quit());
}
module.exports = { convertParams };
