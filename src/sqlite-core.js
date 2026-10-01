/*
 * Tablewise — sqlite-core.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Tablewise — SQLite engine wrapper (works in the browser and in Node/Electron with sql.js) */
(function (root) {
  function qi(name) { return '"' + String(name).replace(/"/g, '""') + '"'; }

  function makeSqliteAdapter(db, opts) {
    opts = opts || {};
    try { db.run('PRAGMA foreign_keys = ON;'); } catch (e) {}

    function runPrepared(sql, params) {
      const stmt = db.prepare(sql);
      try {
        stmt.bind(params || []);
        const rows = [];
        let columns = stmt.getColumnNames();
        while (stmt.step()) rows.push(stmt.get());
        if (!columns.length) columns = stmt.getColumnNames();
        return { columns, rows };
      } finally { stmt.free(); }
    }

    const api = {
      kind: 'sqlite',
      name: opts.name || 'Database',
      hasSchemas: false,
      async query(sql, params) {
        const before = db.getRowsModified();
        let res;
        if (params && params.length) {
          res = runPrepared(sql, params);
        } else {
          const sets = db.exec(sql);
          const last = sets.length ? sets[sets.length - 1] : { columns: [], values: [] };
          res = { columns: last.columns, rows: last.values, sets: sets.map(s => ({ columns: s.columns, rows: s.values })) };
        }
        res.changes = db.getRowsModified();
        void before;
        return res;
      },
      async listTables() {
        const r = db.exec("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name");
        const out = [];
        if (!r.length) return out;
        for (const [name, type] of r[0].values) {
          let count = null;
          try { count = db.exec('SELECT COUNT(*) FROM ' + qi(name))[0].values[0][0]; } catch (e) {}
          out.push({ name, type: type === 'view' ? 'view' : 'table', count });
        }
        return out;
      },
      async describe(table) {
        const info = db.exec('PRAGMA table_info(' + qi(table) + ')');
        const cols = info.length ? info[0].values.map(v => ({ name: v[1], type: v[2] || '', notnull: !!v[3], dflt: v[4], pk: v[5] })) : [];
        const fkr = db.exec('PRAGMA foreign_key_list(' + qi(table) + ')');
        const fks = fkr.length ? fkr[0].values.map(v => ({ from: v[3], table: v[2], to: v[4] })) : [];
        // unique columns
        const uniq = new Set();
        try {
          const il = db.exec('PRAGMA index_list(' + qi(table) + ')');
          if (il.length) for (const v of il[0].values) {
            const idxName = v[1], unique = v[2];
            if (!unique) continue;
            const ii = db.exec('PRAGMA index_info(' + qi(idxName) + ')');
            if (ii.length && ii[0].values.length === 1) uniq.add(ii[0].values[0][2]);
          }
        } catch (e) {}
        const pkCols = cols.filter(c => c.pk).sort((a, b) => a.pk - b.pk);
        let sqlText = '';
        try { const s = db.exec("SELECT sql FROM sqlite_master WHERE name = '" + String(table).replace(/'/g, "''") + "'"); sqlText = s.length ? (s[0].values[0][0] || '') : ''; } catch (e) {}
        for (const c of cols) {
          c.unique = uniq.has(c.name) || (c.pk && pkCols.length === 1);
          c.pk = !!c.pk;
          c.auto = c.pk && pkCols.length === 1 && /^INTEGER$/i.test(c.type.trim());
        }
        // fk target for column (first match)
        for (const c of cols) { const f = fks.find(f => f.from === c.name); if (f) c.fk = { table: f.table, column: f.to || 'rowid' }; }
        const withoutRowid = /WITHOUT\s+ROWID/i.test(sqlText);
        return {
          name: table, columns: cols, fks,
          key: pkCols.length ? pkCols.map(c => c.name) : (withoutRowid ? null : ['rowid']),
          implicitRowid: !pkCols.length && !withoutRowid
        };
      },
      exportBytes() { const b = db.export(); try { db.run('PRAGMA foreign_keys = ON;'); } catch (e) {} return b; },
      close() { try { db.close(); } catch (e) {} },
      _db: db
    };
    return api;
  }

  const mod = { makeSqliteAdapter, qi };
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  else root.TWSqlite = mod;
})(typeof window !== 'undefined' ? window : globalThis);
