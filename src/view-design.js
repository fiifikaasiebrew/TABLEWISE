/*
 * Tablewise — view-design.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Design tables: create tables, add/rename/remove columns, rename/delete tables */
const TEMPLATES = {
  Contacts: [['full_name', 'text', true], ['email', 'text', false, true], ['phone', 'text'], ['company', 'text'], ['notes', 'longtext']],
  Tasks: [['title', 'text', true], ['status', 'text', true, false, "'to do'"], ['due_date', 'date'], ['assigned_to', 'text'], ['done', 'bool', true, false, '0']],
  Inventory: [['item_name', 'text', true], ['sku', 'text', true, true], ['quantity', 'int', true, false, '0'], ['unit_cost', 'money'], ['location', 'text']],
  Expenses: [['spent_on', 'date', true], ['description', 'text', true], ['amount', 'money', true], ['category', 'text'], ['receipt_ok', 'bool', false, false, '0']]
};
function colDefSQL(c) {
  const k = TW.adapter.kind;
  let t;
  if (c.type === 'link') { t = c.refType || FTYPES.find(f => f.id === 'int').sql[k]; }
  else t = FTYPES.find(f => f.id === c.type).sql[k];
  let s = `${qi(c.name)} ${t}`;
  if (c.required) s += ' NOT NULL';
  if (c.unique) s += ' UNIQUE';
  if (c.dflt !== undefined && c.dflt !== null && String(c.dflt).trim() !== '') {
    let d = String(c.dflt).trim();
    if (c.type === 'bool' && k === 'postgres') d = /^(1|yes|true)$/i.test(d.replace(/'/g, '')) ? 'TRUE' : 'FALSE';
    else if (c.type === 'bool') d = /^(1|yes|true)$/i.test(d.replace(/'/g, '')) ? '1' : '0';
    else if (!NUMERIC_T.has(c.type) && !/^'.*'$/.test(d) && !/^(CURRENT_DATE|CURRENT_TIMESTAMP|NULL)$/i.test(d)) d = "'" + d.replace(/'/g, "''") + "'";
    s += ` DEFAULT ${d}`;
  }
  return s;
}
function safeIdent(s) { return String(s || '').trim().toLowerCase().replace(/[^\p{L}\p{N}_]+/gu, '_').replace(/^_+|_+$/g, ''); }

TW.views.design = async function (root, tableName) {
  const tables = TW.state.tables;
  if (!tableName) tableName = TW.state.table;
  root.append(h('div', { class: 'view-head' },
    h('div', null, h('span', { class: 'label' }, 'Table design'), h('h1', null, tableName || 'Tables'), h('p', { class: 'sub' }, tableName ? 'The columns of this table: the lines that every row fills in.' : 'Pick a table to see its columns, or make a new one.')),
    h('div', { class: 'row' }, TW.state.readOnly ? null : h('button', { class: 'btn primary', id: 'createTableBtn', onclick: () => createTableWizard() }, icon('plus'), 'Create a new table'))));
  if (TW.state.readOnly) root.append(h('div', { class: 'notice warn', style: { marginBottom: '12px' } }, 'Read-only mode is on, so you can look but not change anything.'));
  const pick = h('select', { class: 'select', id: 'designTable', 'aria-label': 'Table to design', onchange: e => go('design', e.target.value) }, h('option', { value: '' }, 'Choose a table…'), tables.map(t => h('option', { value: t.name, selected: t.name === tableName }, prettyName(t.name) + (t.type === 'view' ? ' (view)' : ''))));
  root.append(h('div', { class: 'toolbar' }, h('span', { class: 'label' }, 'Table'), pick));
  if (!tableName) { root.append(h('div', { class: 'panel empty' }, 'Choose a table above to see and change its columns, or create a new one.')); return; }
  const tinfo = tables.find(t => t.name === tableName) || {};
  let s; try { s = await describe(tableName); } catch (e) { root.append(errorNotice(e)); return; }
  const isView = tinfo.type === 'view';
  const tb = h('tbody');
  for (const c of s.columns) {
    const ft = friendlyType(c.type, c.name);
    tb.append(h('tr', null,
      h('td', null, h('b', null, c.name)),
      h('td', null, ftypeLabel(ft), h('div', { class: 'faint mono', style: { fontSize: '11.5px' } }, c.type || 'any')),
      h('td', null, h('div', { class: 'row', style: { gap: '4px' } }, c.pk ? h('span', { class: 'pill pk', title: 'Unique ID of each row' }, 'ID') : null, c.auto ? h('span', { class: 'pill req' }, 'auto-numbered') : null, c.notnull && !c.pk ? h('span', { class: 'pill req' }, 'required') : null, c.unique && !c.pk ? h('span', { class: 'pill uni' }, 'unique') : null, c.fk ? h('span', { class: 'pill fk' }, '→ ' + c.fk.table + '.' + c.fk.column) : null)),
      h('td', { class: 'mono faint', style: { fontSize: '12.5px' } }, c.dflt === null || c.dflt === undefined ? '' : String(c.dflt)),
      h('td', { style: { textAlign: 'right', whiteSpace: 'nowrap' } }, isView || TW.state.readOnly ? '' : [
        h('button', { class: 'btn sm ghost', onclick: () => renameColumn(c.name) }, 'Rename'),
        h('button', { class: 'btn sm ghost', title: 'Make searching and sorting on this column faster', onclick: () => addIndex(c.name) }, 'Make searching faster'),
        c.pk ? null : h('button', { class: 'btn sm ghost', style: { color: 'var(--bad)' }, onclick: () => dropColumn(c.name) }, 'Remove')])));
  }
  root.append(h('div', { class: 'panel', style: { padding: 0, overflowX: 'auto' } }, h('table', { class: 'coltable' }, h('thead', null, h('tr', null, ['Column', 'Kind of data', 'Rules', 'Default', ''].map(x => h('th', null, x)))), tb)));
  if (!isView && !TW.state.readOnly) root.append(h('div', { class: 'row', style: { marginTop: '14px' } },
    h('button', { class: 'btn primary', onclick: addColumn }, icon('plus'), 'Add a column'),
    h('button', { class: 'btn', onclick: renameTable }, 'Rename table'),
    h('button', { class: 'btn', onclick: () => go('browse', tableName) }, 'Open the data'),
    h('span', { style: { flex: 1 } }),
    h('button', { class: 'btn danger', onclick: emptyTable }, 'Empty table'),
    h('button', { class: 'btn danger', onclick: dropTable }, icon('trash'), 'Delete table')));
  if (isView && !TW.state.readOnly) root.append(h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'btn danger', onclick: dropTable }, icon('trash'), 'Delete view')));
  const incoming = [];
  for (const t of tables) { if (t.name === tableName) continue; try { const o = await describe(t.name); for (const f of o.fks) if (f.table === tableName) incoming.push(`${t.name}.${f.from}`); } catch (e) { } }
  root.append(h('div', { class: 'split', style: { marginTop: '18px' } },
    h('div', { class: 'panel' }, h('h3', { style: { marginBottom: '6px' } }, 'Links from this table'), s.fks.length ? h('ul', { style: { margin: 0, paddingLeft: '18px' } }, s.fks.map(f => h('li', null, h('b', null, f.from), ' points to ', h('b', null, f.table), ` (${f.to || 'id'})`))) : h('p', { class: 'faint' }, 'None. Add a column of kind "Link to another table" to create one.')),
    h('div', { class: 'panel' }, h('h3', { style: { marginBottom: '6px' } }, 'Links into this table'), incoming.length ? h('ul', { style: { margin: 0, paddingLeft: '18px' } }, incoming.map(x => h('li', null, h('b', null, x), ' points here'))) : h('p', { class: 'faint' }, 'No other table points here.'))));

  async function exec(sql, label, extra) {
    try { await run(sql, [], { label }); TW.state.schema = {}; toast(label + '.'); go('design', extra || tableName); return true; }
    catch (e) { toast(explainError(e).friendly, { bad: true }); return false; }
  }
  function addColumn() {
    const c = { name: '', type: 'text', required: false, unique: false, dflt: '' };
    const body = h('div', { class: 'stack' });
    const pre = h('div');
    const nameIn = h('input', { class: 'input', id: 'ncName', placeholder: 'e.g. phone_number' });
    const typeSel = h('select', { class: 'select', id: 'ncType' }, FTYPES.map(f => h('option', { value: f.id }, `${f.label} — ${f.hint}`)), h('option', { value: 'link' }, 'Link to another table'));
    const linkSel = h('select', { class: 'select', id: 'ncLink', hidden: true }, tables.filter(t => t.type === 'table').map(t => h('option', { value: t.name }, prettyName(t.name))));
    const req = h('input', { type: 'checkbox', id: 'ncReq' }), uni = h('input', { type: 'checkbox', id: 'ncUni' });
    const dflt = h('input', { class: 'input', id: 'ncDef', placeholder: 'optional' });
    const upd = async () => {
      c.name = safeIdent(nameIn.value); c.type = typeSel.value; c.required = req.checked; c.unique = uni.checked; c.dflt = dflt.value;
      linkSel.hidden = c.type !== 'link';
      pre.replaceChildren(c.name ? sqlBlock(await addColSQL(c, linkSel.value)) : '');
    };
    [nameIn, typeSel, linkSel, req, uni, dflt].forEach(x => { x.oninput = upd; x.onchange = upd; });
    body.append(h('label', { class: 'field' }, h('span', null, 'Column name'), nameIn, h('span', { class: 'hint' }, 'Use lowercase words joined by underscores, like date_of_birth.')),
      h('label', { class: 'field' }, h('span', null, 'Kind of data'), typeSel, linkSel),
      h('div', { class: 'row' }, h('label', { class: 'check' }, req, 'Required'), h('label', { class: 'check' }, uni, 'No duplicates allowed')),
      h('label', { class: 'field' }, h('span', null, 'Default value'), dflt, h('span', { class: 'hint' }, 'Used when a new row leaves this empty. Existing rows get it too. Required columns need a default if the table already has rows.')), pre);
    modal({ title: `Add a column to ${prettyName(tableName)}`, body, actions: [{ label: 'Cancel' }, { label: 'Add column', kind: 'primary', fn: async () => { await upd(); if (!c.name) { toast('Give the column a name.', { bad: true }); return false; } return await exec(await addColSQL(c, linkSel.value), `Added column ${c.name}`); } }] });
  }
  async function addColSQL(c, linkTable) {
    const k = TW.adapter.kind;
    let ref = '';
    if (c.type === 'link') {
      const ls = await describe(linkTable); const key = (ls.key && ls.key[0] !== 'rowid' ? ls.key[0] : 'id');
      const kc = ls.columns.find(x => x.name === key);
      c.refType = kc && /int/i.test(kc.type) ? FTYPES.find(f => f.id === 'int').sql[k] : (kc ? kc.type : 'INTEGER');
      if (k === 'mysql') return `ALTER TABLE ${qt(tableName)} ADD COLUMN ${colDefSQL(c)}, ADD FOREIGN KEY (${qi(c.name)}) REFERENCES ${qt(linkTable)}(${qi(key)})`;
      ref = ` REFERENCES ${qt(linkTable)}(${qi(key)})`;
    }
    return `ALTER TABLE ${qt(tableName)} ${k === 'mssql' ? 'ADD' : 'ADD COLUMN'} ${colDefSQL(c)}${ref}`;
  }
  function renameColumn(old) {
    const inp = h('input', { class: 'input', id: 'rcName', value: old });
    modal({
      title: `Rename column "${old}"`, body: [h('label', { class: 'field' }, h('span', null, 'New name'), inp), h('p', { class: 'faint', style: { fontSize: '13px' } }, 'Saved questions that use the old name will need updating.')], actions: [{ label: 'Cancel' }, {
        label: 'Rename', kind: 'primary', fn: async () => {
          const n = safeIdent(inp.value); if (!n || n === old) return;
          const sql = TW.adapter.kind === 'mssql' ? `EXEC sp_rename '${tableName}.${old}', '${n}', 'COLUMN'` : `ALTER TABLE ${qt(tableName)} RENAME COLUMN ${qi(old)} TO ${qi(n)}`;
          return await exec(sql, `Renamed ${old} to ${n}`);
        }
      }]
    });
  }
  async function dropColumn(col) {
    const sql = `ALTER TABLE ${qt(tableName)} DROP COLUMN ${qi(col)}`;
    if (await confirmBox({ title: `Remove column "${col}"?`, message: `Every value stored in ${col} will be deleted from all rows of ${prettyName(tableName)}.`, confirmLabel: 'Remove column', danger: true, sql })) await exec(sql, `Removed column ${col}`);
  }
  async function addIndex(col) {
    const n = safeIdent(`idx_${tableName}_${col}`);
    await exec(`CREATE INDEX ${qi(n)} ON ${qt(tableName)} (${qi(col)})`, `Sped up searches on ${col}`);
  }
  function renameTable() {
    const inp = h('input', { class: 'input', id: 'rtName', value: tableName });
    modal({
      title: 'Rename table', body: [h('label', { class: 'field' }, h('span', null, 'New name'), inp)], actions: [{ label: 'Cancel' }, {
        label: 'Rename', kind: 'primary', fn: async () => {
          const n = safeIdent(inp.value); if (!n || n === tableName) return;
          const k = TW.adapter.kind;
          const sql = k === 'mssql' ? `EXEC sp_rename '${tableName}', '${n}'` : k === 'mysql' ? `RENAME TABLE ${qt(tableName)} TO ${qi(n)}` : `ALTER TABLE ${qt(tableName)} RENAME TO ${qi(n)}`;
          return await exec(sql, `Renamed ${tableName} to ${n}`, n);
        }
      }]
    });
  }
  async function emptyTable() {
    const sql = `DELETE FROM ${qt(tableName)}`;
    if (await confirmBox({ title: `Empty ${prettyName(tableName)}?`, message: `This deletes all ${fmtNum(tinfo.count || 0)} rows but keeps the table and its columns.`, confirmLabel: 'Delete all rows', danger: true, typeToConfirm: tableName, sql })) await exec(sql, `Emptied ${tableName}`);
  }
  async function dropTable() {
    const sql = `DROP ${isView ? 'VIEW' : 'TABLE'} ${qt(tableName)}`;
    if (await confirmBox({ title: `Delete ${prettyName(tableName)}?`, message: isView ? 'The saved view is removed. The data it reads from is not touched.' : `The whole table and all ${fmtNum(tinfo.count || 0)} rows in it will be permanently deleted.`, confirmLabel: 'Delete for good', danger: true, typeToConfirm: tableName, sql })) {
      try { await run(sql, [], { label: `Deleted ${tableName}` }); toast(`Deleted ${tableName}.`, TW.adapter.restoreBytes ? { action: { label: 'Undo', fn: undoLast } } : {}); TW.state.table = null; go('design'); } catch (e) { toast(explainError(e).friendly, { bad: true }); }
    }
  }
};

function createTableWizard() {
  const t = { name: '', autoId: true, cols: [{ name: '', type: 'text', required: false, unique: false, dflt: '' }] };
  const body = h('div', { class: 'stack' });
  const nameIn = h('input', { class: 'input', id: 'ctName', placeholder: 'e.g. suppliers' });
  const rowsHost = h('tbody');
  const pre = h('div');
  const tmpl = h('div', { class: 'row' }, h('span', { class: 'faint', style: { fontSize: '13px' } }, 'Start from a template:'), Object.keys(TEMPLATES).map(k => h('button', {
    class: 'btn sm', onclick: () => {
      nameIn.value = k.toLowerCase(); t.cols = TEMPLATES[k].map(([name, type, required, unique, dflt]) => ({ name, type, required: !!required, unique: !!unique, dflt: dflt ? String(dflt).replace(/^'|'$/g, '') : '' })); drawRows();
    }
  }, k)));
  const tableOpts = TW.state.tables.filter(x => x.type === 'table');
  function drawRows() {
    rowsHost.replaceChildren(...t.cols.map((c, i) => {
      const typeSel = h('select', { class: 'select', 'aria-label': 'Kind of data' }, FTYPES.map(f => h('option', { value: f.id, selected: c.type === f.id }, f.label)), tableOpts.length ? h('option', { value: 'link', selected: c.type === 'link' }, 'Link to table…') : null);
      const linkSel = h('select', { class: 'select', 'aria-label': 'Linked table', hidden: c.type !== 'link' }, tableOpts.map(x => h('option', { value: x.name, selected: x.name === c.link }, prettyName(x.name))));
      if (c.type === 'link' && !c.link && tableOpts[0]) c.link = tableOpts[0].name;
      typeSel.onchange = () => { c.type = typeSel.value; if (c.type === 'link' && !c.link) c.link = tableOpts[0].name; drawRows(); };
      linkSel.onchange = () => { c.link = linkSel.value; if (!c.name) c.name = safeIdent(c.link).replace(/s$/, '') + '_id'; drawRows(); };
      const nm = h('input', { class: 'input', value: c.name, placeholder: 'column_name', 'aria-label': 'Column name', oninput: e => { c.name = e.target.value; preview(); } });
      return h('tr', { class: 'designer-row' },
        h('td', null, nm), h('td', null, typeSel, linkSel),
        h('td', { style: { textAlign: 'center' } }, h('input', { type: 'checkbox', checked: c.required, 'aria-label': 'Required', onchange: e => { c.required = e.target.checked; preview(); } })),
        h('td', { style: { textAlign: 'center' } }, h('input', { type: 'checkbox', checked: c.unique, 'aria-label': 'Unique', onchange: e => { c.unique = e.target.checked; preview(); } })),
        h('td', null, h('input', { class: 'input', value: c.dflt, placeholder: '—', 'aria-label': 'Default', style: { width: '90px' }, oninput: e => { c.dflt = e.target.value; preview(); } })),
        h('td', null, h('button', { class: 'icon-btn', 'aria-label': 'Remove column', onclick: () => { t.cols.splice(i, 1); drawRows(); } }, icon('x'))));
    }));
    preview();
  }
  async function buildSQL() {
    const name = safeIdent(nameIn.value);
    const defs = []; const fks = [];
    if (t.autoId) defs.push(`${qi('id')} ${autoIdSQL()}`);
    for (const c of t.cols) {
      const n = safeIdent(c.name); if (!n) continue;
      const cc = { ...c, name: n };
      if (c.type === 'link') {
        const ls = await describe(c.link); const key = ls.key && ls.key[0] !== 'rowid' ? ls.key[0] : 'id';
        const kc = ls.columns.find(x => x.name === key); cc.refType = kc && /int/i.test(kc.type) ? FTYPES.find(f => f.id === 'int').sql[TW.adapter.kind] : (kc ? kc.type : 'INTEGER');
        fks.push(`FOREIGN KEY (${qi(n)}) REFERENCES ${qt(c.link)}(${qi(key)})`);
      }
      defs.push(colDefSQL(cc));
    }
    return { name, sql: `CREATE TABLE ${qi(name || 'new_table')} (\n  ${[...defs, ...fks].join(',\n  ')}\n)` };
  }
  async function preview() { const b = await buildSQL(); pre.replaceChildren(h('details', null, h('summary', { class: 'faint', style: { cursor: 'pointer', fontSize: '13px' } }, 'See the SQL this creates'), sqlBlock(b.sql))); }
  nameIn.oninput = preview;
  const autoId = h('input', { type: 'checkbox', checked: true, onchange: e => { t.autoId = e.target.checked; preview(); } });
  body.append(
    h('label', { class: 'field' }, h('span', null, 'Table name'), nameIn, h('span', { class: 'hint' }, 'Usually a plural noun: customers, invoices, suppliers.')),
    tmpl,
    h('label', { class: 'check' }, autoId, h('span', null, 'Give every row an automatic ID number ', h('span', { class: 'faint' }, '(recommended — lets you edit rows and link tables)'))),
    h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'coltable' }, h('thead', null, h('tr', null, ['Column name', 'Kind of data', 'Required', 'Unique', 'Default', ''].map(x => h('th', null, x)))), rowsHost)),
    h('div', null, h('button', { class: 'btn sm', onclick: () => { t.cols.push({ name: '', type: 'text', required: false, unique: false, dflt: '' }); drawRows(); } }, icon('plus', 13), 'Add another column')),
    pre);
  drawRows();
  modal({
    title: 'Create a new table', wide: true, body, actions: [{ label: 'Cancel' }, {
      label: 'Create table', kind: 'primary', fn: async () => {
        const b = await buildSQL();
        if (!b.name) { toast('Give the table a name.', { bad: true }); nameIn.focus(); return false; }
        if (!t.cols.some(c => safeIdent(c.name))) { toast('Add at least one column with a name.', { bad: true }); return false; }
        try { await run(b.sql, [], { label: `Created table ${b.name}` }); toast(`Created ${b.name}. Add your first row.`); TW.state.schema = {}; await refreshTables(); go('browse', b.name); }
        catch (e) { toast(explainError(e).friendly, { bad: true }); return false; }
      }
    }]
  });
}
