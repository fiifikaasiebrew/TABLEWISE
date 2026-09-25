const fs = require('fs'), vm = require('vm'), path = require('path');
const D = path.join(__dirname, '../desktop/node_modules/');
const libSrc = fs.readFileSync(path.join(__dirname, '../src/sql-library.js'), 'utf8');
const sampleSrc = fs.readFileSync(path.join(__dirname, '../src/sample-data.js'), 'utf8');
const ctx = { TW: { adapter: { kind: 'sqlite' } }, window: {}, isWrite: s => /^\s*(insert|update|delete|create|alter|drop|truncate|merge|exec|rename)/i.test(s) };
vm.createContext(ctx); vm.runInContext(libSrc + ';this.libEntries=libEntries;', ctx); vm.runInContext(sampleSrc, ctx);
const sampleSQL = ctx.window.TWSample.buildSampleSQL();
(async () => {
  const SQL = await require(D + 'sql.js')();
  const sdb = new SQL.Database(); sdb.run(sampleSQL);
  const { Client } = require(D + 'pg'); const pg = new Client({ host: '127.0.0.1', user: 'tw', password: 'tw', database: 'twdb' }); await pg.connect();
  const mysql = require(D + 'mysql2/promise'); const my = await mysql.createConnection({ host: '127.0.0.1', user: 'tw', password: 'tw', database: 'twdb', multipleStatements: true });
  const drop = 'DROP TABLE IF EXISTS order_items, orders, products, categories, customers, employees, departments' ;
  await pg.query(drop + ' CASCADE'); await my.query('SET FOREIGN_KEY_CHECKS=0; ' + drop + '; SET FOREIGN_KEY_CHECKS=1;');
  await pg.query(sampleSQL.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY'));
  await my.query(sampleSQL.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'INT AUTO_INCREMENT PRIMARY KEY').replace(/ TEXT/g, ' VARCHAR(255)'));
  const runners = {
    sqlite: async s => { sdb.exec(s); },
    postgres: async s => { await pg.query(s); },
    mysql: async s => { await my.query(s); }
  };
  const fails = [];
  let n = 0, writes = 0;
  for (const kind of ['sqlite', 'postgres', 'mysql']) {
    ctx.TW.adapter.kind = kind;
    for (const e of ctx.libEntries()) {
      if (ctx.isWrite(e.ex) || /^\s*(begin|start transaction|--)/i.test(e.ex)) { if (kind === 'sqlite') writes++; continue; }
      n++;
      try { await runners[kind](e.ex); } catch (err) { fails.push(`${kind} | ${e.name} | ${err.message.slice(0, 120)}`); }
    }
  }
  // also run write examples on copies inside a rollback
  for (const kind of ['sqlite', 'postgres', 'mysql']) {
    ctx.TW.adapter.kind = kind;
    for (const e of ctx.libEntries()) {
      if (!(ctx.isWrite(e.ex) || /^\s*(begin|start transaction)/i.test(e.ex)) || /table_name/.test(e.ex)) continue;
      const sql = e.ex;
      try {
        if (kind === 'sqlite') { const b = sdb.export(); const d2 = new SQL.Database(b); d2.exec(sql); d2.close(); }
        else if (kind === 'postgres') { if (/^\s*begin/i.test(sql)) { await pg.query(sql); } else { await pg.query('BEGIN'); try { await pg.query(sql); } finally { await pg.query('ROLLBACK'); } } }
        else { if (/^\s*start/i.test(sql)) await my.query(sql); else { await my.query('START TRANSACTION'); try { await my.query(sql); } finally { await my.query('ROLLBACK'); } } }
      } catch (err) { fails.push(`WRITE ${kind} | ${e.name} | ${err.message.slice(0, 120)}`); }
    }
  }
  console.log('entries', ctx.libEntries().length, 'read runs', n, 'failures', fails.length); console.log(fails.join('\n'));
  await pg.end(); await my.end();
})();
