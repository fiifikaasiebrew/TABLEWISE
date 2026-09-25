/* Browse data: spreadsheet-style table view with sort, filter, edit, add, delete */
const OPS = [
  { id: 'eq', label: 'is', n: 1 }, { id: 'ne', label: 'is not', n: 1 },
  { id: 'contains', label: 'contains', n: 1, text: true }, { id: 'ncontains', label: 'does not contain', n: 1, text: true },
  { id: 'starts', label: 'starts with', n: 1, text: true }, { id: 'ends', label: 'ends with', n: 1, text: true },
  { id: 'gt', label: 'is more than / after', n: 1 }, { id: 'lt', label: 'is less than / before', n: 1 },
  { id: 'gte', label: 'is at least', n: 1 }, { id: 'lte', label: 'is at most', n: 1 },
  { id: 'between', label: 'is between', n: 2 }, { id: 'in', label: 'is one of (comma list)', n: 1 }, { id: 'nin', label: 'is not one of (comma list)', n: 1 },
  { id: 'lastdays', label: 'is in the last … days', n: 1, date: true }, { id: 'today', label: 'is today', n: 0, date: true }, { id: 'thismonth', label: 'is this month', n: 0, date: true }, { id: 'thisyear', label: 'is this year', n: 0, date: true },
  { id: 'empty', label: 'is empty', n: 0 }, { id: 'notempty', label: 'is not empty', n: 0 }
];
function coerce(v, ft) {
  if (v === null || v === undefined) return null;
  if (NUMERIC_T.has(ft)) { const n = Number(String(v).replace(/,/g, '')); return isNaN(n) ? v : n; }
  if (ft === 'bool') { const s = String(v).trim().toLowerCase(); const b = ['1', 'yes', 'true', 'y', 'on'].includes(s); return TW.adapter.kind === 'postgres' ? b : (b ? 1 : 0); }
  return v;
}
function buildCond(expr, op, v1, v2, ft) {
  const like = D().like;
  switch (op) {
    case 'eq': return { sql: `${expr} = ?`, params: [coerce(v1, ft)] };
    case 'ne': return { sql: `(${expr} <> ? OR ${expr} IS NULL)`, params: [coerce(v1, ft)] };
    case 'contains': return { sql: `${expr} ${like} ?`, params: ['%' + v1 + '%'] };
    case 'ncontains': return { sql: `(${expr} NOT ${like} ? OR ${expr} IS NULL)`, params: ['%' + v1 + '%'] };
    case 'starts': return { sql: `${expr} ${like} ?`, params: [v1 + '%'] };
    case 'ends': return { sql: `${expr} ${like} ?`, params: ['%' + v1] };
    case 'gt': return { sql: `${expr} > ?`, params: [coerce(v1, ft)] };
    case 'lt': return { sql: `${expr} < ?`, params: [coerce(v1, ft)] };
    case 'gte': return { sql: `${expr} >= ?`, params: [coerce(v1, ft)] };
    case 'lte': return { sql: `${expr} <= ?`, params: [coerce(v1, ft)] };
    case 'between': return { sql: `${expr} BETWEEN ? AND ?`, params: [coerce(v1, ft), coerce(v2, ft)] };
    case 'in': { const vals = String(v1).split(',').map(s => s.trim()).filter(Boolean); if (!vals.length) return null; return { sql: `${expr} IN (${vals.map(() => '?').join(', ')})`, params: vals.map(v => coerce(v, ft)) }; }
    case 'nin': { const vals = String(v1).split(',').map(s => s.trim()).filter(Boolean); if (!vals.length) return null; return { sql: `(${expr} NOT IN (${vals.map(() => '?').join(', ')}) OR ${expr} IS NULL)`, params: vals.map(v => coerce(v, ft)) }; }
    case 'lastdays': return { sql: `${expr} >= ${DX.daysAgoParam()}`, params: [Math.max(0, parseInt(v1, 10) || 0)] };
    case 'today': return { sql: `${DX.fn('DATE', expr)} = ${DX.today()}`, params: [] };
    case 'thismonth': return { sql: `${DX.fn('YM', expr)} = ${DX.fn('YM', DX.today())}`, params: [] };
    case 'thisyear': return { sql: `${DX.fn('YEAR', expr)} = ${DX.fn('YEAR', DX.today())}`, params: [] };
    case 'empty': return ft === 'text' || ft === 'longtext' ? { sql: `(${expr} IS NULL OR ${expr} = '')`, params: [] } : { sql: `${expr} IS NULL`, params: [] };
    case 'notempty': return ft === 'text' || ft === 'longtext' ? { sql: `(${expr} IS NOT NULL AND ${expr} <> '')`, params: [] } : { sql: `${expr} IS NOT NULL`, params: [] };
  }
  return null;
}
function opLabel(id) { return (OPS.find(o => o.id === id) || {}).label || id; }
function filterRuleEditor(rule, columns, onChange, onRemove, conjText) {
  // columns: [{key, label, ft}]
  const colSel = h('select', { class: 'select', 'aria-label': 'Column' }, columns.map(c => h('option', { value: c.key, selected: c.key === rule.col }, c.label)));
  const opSel = h('select', { class: 'select', 'aria-label': 'Condition' });
  const v1 = h('input', { class: 'input', placeholder: 'value', style: { width: '150px' }, 'aria-label': 'Value' });
  const v2 = h('input', { class: 'input', placeholder: 'and…', style: { width: '120px' }, 'aria-label': 'Second value' });
  const boolSel = h('select', { class: 'select', 'aria-label': 'Yes or no' }, h('option', { value: 'yes' }, 'Yes'), h('option', { value: 'no' }, 'No'));
  const refresh = () => {
    const c = columns.find(c => c.key === colSel.value) || columns[0];
    rule.col = c.key; rule.ft = c.ft;
    const isDate = c.ft === 'date' || c.ft === 'datetime';
    const allowed = OPS.filter(o => !(o.text && (NUMERIC_T.has(c.ft) || isDate)) && !(o.date && !isDate) && !(c.ft === 'bool' && !['eq', 'ne', 'empty', 'notempty'].includes(o.id)));
    opSel.replaceChildren(...allowed.map(o => h('option', { value: o.id, selected: o.id === rule.op }, o.label)));
    if (!allowed.find(o => o.id === rule.op)) rule.op = allowed[0].id;
    opSel.value = rule.op;
    const n = OPS.find(o => o.id === rule.op).n;
    const t = c.ft === 'date' ? 'date' : c.ft === 'datetime' ? 'datetime-local' : NUMERIC_T.has(c.ft) ? 'number' : 'text';
    v1.type = rule.op === 'in' || rule.op === 'nin' ? 'text' : rule.op === 'lastdays' ? 'number' : t; v2.type = t;
    v1.placeholder = rule.op === 'lastdays' ? 'days, e.g. 30' : rule.op === 'in' || rule.op === 'nin' ? 'a, b, c' : 'value';
    v1.hidden = n < 1 || c.ft === 'bool'; v2.hidden = n < 2; boolSel.hidden = !(c.ft === 'bool' && n >= 1);
    if (c.ft === 'bool') rule.v1 = boolSel.value;
  };
  v1.value = rule.v1 || ''; v2.value = rule.v2 || ''; if (rule.v1 === 'no') boolSel.value = 'no';
  colSel.onchange = () => { refresh(); onChange(); };
  opSel.onchange = () => { rule.op = opSel.value; refresh(); onChange(); };
  let tm; const deb = () => { clearTimeout(tm); tm = setTimeout(onChange, 350); };
  v1.oninput = () => { rule.v1 = v1.value.replace('T', ' '); deb(); };
  v2.oninput = () => { rule.v2 = v2.value.replace('T', ' '); deb(); };
  boolSel.onchange = () => { rule.v1 = boolSel.value; onChange(); };
  refresh();
  return h('div', { class: 'frule' }, h('span', { class: 'conj' }, conjText), colSel, opSel, v1, v2, boolSel, h('button', { class: 'icon-btn', title: 'Remove this filter', 'aria-label': 'Remove filter', onclick: onRemove }, icon('x')));
}
function labelColumnOf(schema) {
  const text = schema.columns.filter(c => ['text', 'longtext'].includes(friendlyType(c.type, c.name)) && !c.pk);
  return (text.find(c => /^(name|title|company_name|full_name|label)$/i.test(c.name)) || text.find(c => /name|title/i.test(c.name)) || text[0] || schema.columns[0]).name;
}
async function fkOptions(fk) {
  try {
    const s = await describe(fk.table);
    const lab = labelColumnOf(s);
    const extra = s.columns.find(c => c.name === 'last_name') && lab === 'first_name' ? `, ${qi('last_name')}` : '';
    const r = await TW.adapter.query(`SELECT ${qi(fk.column)}, ${qi(lab)}${extra} FROM ${qt(fk.table)} ORDER BY ${qi(lab)}` + pageClause(2000, 0, true), []);
    return r.rows.map(x => ({ value: x[0], label: `${x.slice(1).filter(v => v !== null).join(' ')} (#${x[0]})` }));
  } catch (e) { return null; }
}

const browseState = {};
TW.views.browse = async function (root, tableName) {
  const tables = TW.state.tables;
  if (!tableName) tableName = TW.state.table || (tables[0] && tables[0].name);
  if (!tableName) { root.append(h('div', { class: 'panel empty' }, 'There are no tables yet. ', h('button', { class: 'btn primary sm', onclick: () => go('design') }, 'Create a table'))); return; }
  TW.state.table = tableName; renderTablesList();
  const tinfo = tables.find(t => t.name === tableName) || { type: 'table' };
  let schema;
  try { schema = await describe(tableName); } catch (e) { root.append(errorNotice(e)); return; }
  const st = browseState[tableName] = browseState[tableName] || { sort: null, filters: [], search: '', page: 0, size: store.get('pageSize', 50), selected: new Set(), showSQL: false };
  const cols = schema.columns.map(c => ({ ...c, ft: friendlyType(c.type, c.name) }));
  const editable = tinfo.type !== 'view' && schema.key && !TW.state.readOnly;
  const keyCols = schema.key || [];
  const useRid = schema.implicitRowid;

  const head = h('div', { class: 'view-head' },
    h('div', null, h('span', { class: 'label' }, tinfo.type === 'view' ? 'Saved view' : 'Table'), h('h1', null, tableName),
      h('p', { class: 'sub' }, `${plural(cols.length, 'column')}. Double-click a cell to change it. Click a column name to sort.`)),
    h('div', { class: 'row' },
      editable ? h('button', { class: 'btn primary', id: 'addRowBtn', onclick: () => rowForm(null) }, icon('plus'), 'Add a row') : null,
      h('button', { class: 'btn', onclick: () => go('design', tableName) }, icon('design'), 'Edit table design')));
  root.append(head);
  if (!schema.key && tinfo.type !== 'view') root.append(h('div', { class: 'notice warn', style: { marginBottom: '10px' } }, 'This table has no ID column (primary key), so rows cannot be edited safely here. Add one in the Table design tab.'));

  const searchIn = h('input', { class: 'input', id: 'browseSearch', placeholder: 'Search this table…', value: st.search, style: { width: '220px' }, 'aria-label': 'Search this table' });
  const filtersBox = h('div', { class: 'filters' });
  const toolbar = h('div', { class: 'toolbar' }, searchIn,
    h('button', { class: 'btn with-icon', id: 'addFilterBtn', onclick: () => addFilterFor(cols[0].name) }, icon('filter', 15), 'Filter', h('span', { class: 'fcount', id: 'fcount' })),
    h('span', { style: { flex: 1 } }),
    h('button', { class: 'btn danger', id: 'delSelBtn', hidden: true, onclick: deleteSelected }, icon('trash'), 'Delete selected'),
    h('button', { class: 'btn', onclick: () => exportAll('csv') }, icon('download'), 'CSV'),
    h('button', { class: 'btn', onclick: () => exportAll('xlsx') }, icon('download'), 'Excel'),
    h('button', { class: 'btn ghost', onclick: () => { st.showSQL = !st.showSQL; load(); } }, st.showSQL ? 'Hide SQL' : 'Show SQL'));
  const gridHost = h('div'); const foot = h('div', { class: 'grid-foot' }); const sqlHost = h('div', { style: { marginBottom: '10px' } });
  root.append(toolbar, filtersBox, sqlHost, gridHost, foot);
  let tm; searchIn.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { st.search = searchIn.value; st.page = 0; load(); }, 300); };

  function defaultOp(ft) { return ft === 'bool' ? 'eq' : NUMERIC_T.has(ft) ? 'eq' : (ft === 'date' || ft === 'datetime') ? 'gte' : 'contains'; }
  function addFilterFor(colName) {
    const c = cols.find(x => x.name === colName) || cols[0];
    st.filters.push({ col: c.name, op: defaultOp(c.ft) }); drawFilters();
    const ins = filtersBox.querySelectorAll('.frule'); const last = ins[ins.length - 1];
    const v = last && [...last.querySelectorAll('input,select')].find(x => !x.hidden && x.getAttribute('aria-label') !== 'Column' && x.getAttribute('aria-label') !== 'Condition');
    if (v) v.focus();
  }
  function drawFilters() {
    const fc = $('#fcount'); if (fc) fc.textContent = st.filters.length ? String(st.filters.length) : '';
    if (!st.filters.length) { filtersBox.replaceChildren(); filtersBox.className = 'filters'; return; }
    filtersBox.className = 'filters open';
    filtersBox.replaceChildren(
      h('div', { class: 'filters-head' }, h('span', null, 'Show only rows where'), h('span', { style: { flex: 1 } }),
        h('button', { class: 'linkbtn', onclick: () => addFilterFor(cols[0].name) }, '+ Add another rule'),
        h('button', { class: 'linkbtn muted', onclick: () => { st.filters = []; st.page = 0; drawFilters(); load(); } }, 'Clear all')),
      ...st.filters.map((f, i) => filterRuleEditor(f, cols.map(c => ({ key: c.name, label: c.name, ft: c.ft })), () => { st.page = 0; load(); }, () => { st.filters.splice(i, 1); drawFilters(); load(); }, i ? 'and' : 'where')));
  }
  function whereClause() {
    const parts = [], params = [];
    for (const f of st.filters) {
      const n = OPS.find(o => o.id === f.op).n;
      if (n >= 1 && (f.v1 === undefined || f.v1 === '')) continue;
      if (n >= 2 && (f.v2 === undefined || f.v2 === '')) continue;
      const c = buildCond(qi(f.col), f.op, f.v1, f.v2, f.ft); if (c) { parts.push(c.sql); params.push(...c.params); }
    }
    if (st.search.trim()) {
      const tc = cols.filter(c => c.ft === 'text' || c.ft === 'longtext');
      const numC = cols.filter(c => NUMERIC_T.has(c.ft));
      const s = [];
      for (const c of tc) { s.push(`${qi(c.name)} ${D().like} ?`); params.push('%' + st.search.trim() + '%'); }
      if (!isNaN(Number(st.search.trim()))) for (const c of numC) { s.push(`${qi(c.name)} = ?`); params.push(Number(st.search.trim())); }
      if (s.length) parts.push('(' + s.join(' OR ') + ')');
    }
    return { sql: parts.length ? ' WHERE ' + parts.join(' AND ') : '', params };
  }
  function selectSQL() {
    const w = whereClause();
    const order = st.sort ? ` ORDER BY ${qi(st.sort.col)} ${st.sort.dir}` : (keyCols.length && !useRid ? ` ORDER BY ${keyCols.map(qi).join(', ')}` : '');
    const sel = useRid ? `SELECT rowid AS "__rid", * FROM ${qt(tableName)}` : `SELECT * FROM ${qt(tableName)}`;
    return { sql: sel + w.sql + order, params: w.params, where: w, hasOrder: !!order };
  }
  async function load() {
    const q = selectSQL();
    let res, total;
    try {
      res = await TW.adapter.query(q.sql + pageClause(st.size, st.page * st.size, q.hasOrder), q.params);
      total = (await TW.adapter.query(`SELECT COUNT(*) FROM ${qt(tableName)}` + q.where.sql, q.where.params)).rows[0][0];
    } catch (e) { gridHost.replaceChildren(errorNotice(e)); return; }
    sqlHost.replaceChildren(st.showSQL ? sqlBlock(inlineParams(q.sql + pageClause(st.size, st.page * st.size, q.hasOrder), q.params)) : '');
    drawGrid(res, Number(total));
  }
  function keyOf(row, rcols) {
    if (useRid) return [row[rcols.indexOf('__rid')]];
    return keyCols.map(k => row[rcols.indexOf(k)]);
  }
  function keyWhere(keys) {                  // keys: array of key arrays
    const kc = useRid ? ['rowid'] : keyCols;
    const params = [];
    const sql = keys.map(k => '(' + kc.map((c, i) => { params.push(k[i]); return `${c === 'rowid' ? 'rowid' : qi(c)} = ?`; }).join(' AND ') + ')').join(' OR ');
    return { sql, params };
  }
  function drawGrid(res, total) {
    const rcols = res.columns;
    const visible = rcols.map((c, i) => ({ c, i })).filter(x => x.c !== '__rid');
    const selHead = editable ? h('th', { class: 'ck' }, h('input', { type: 'checkbox', 'aria-label': 'Select all on this page', onchange: e => { for (const r of res.rows) { const k = JSON.stringify(keyOf(r, rcols)); e.target.checked ? st.selected.add(k) : st.selected.delete(k); } drawGrid(res, total); } })) : null;
    const thr = h('tr', null, selHead, visible.map(({ c }) => {
      const col = cols.find(x => x.name === c) || { ft: 'text', type: '' };
      const s = st.sort && st.sort.col === c ? (st.sort.dir === 'ASC' ? ' ▲' : ' ▼') : '';
      const badges = [col.pk ? h('span', { class: 'pill pk', title: 'Primary key: the unique ID of each row' }, 'ID') : null, col.fk ? h('span', { class: 'pill fk', title: `Links to ${col.fk.table}` }, '→ ' + col.fk.table) : null];
      return h('th', {
        title: 'Click to sort', onclick: () => {
          if (!st.sort || st.sort.col !== c) st.sort = { col: c, dir: 'ASC' }; else if (st.sort.dir === 'ASC') st.sort.dir = 'DESC'; else st.sort = null;
          load();
        }
      }, h('div', { class: 'th-in' }, h('span', null, c, ' ', badges, h('span', { class: 'sort' }, s)),
          h('button', { class: 'th-filter' + (st.filters.some(f => f.col === c) ? ' on' : ''), title: `Filter by ${c}`, 'aria-label': `Filter by ${c}`, 'data-x': 'colfilter', onclick: e => { e.stopPropagation(); addFilterFor(c); } }, icon('filter', 13))),
        h('span', { class: 't' }, ftypeLabel(col.ft)));
    }));
    const tb = h('tbody');
    for (const r of res.rows) {
      const k = JSON.stringify(keyOf(r, rcols));
      const tr = h('tr', { class: st.selected.has(k) ? 'sel' : '' });
      if (editable) tr.append(h('td', { class: 'ck' }, h('input', { type: 'checkbox', checked: st.selected.has(k), 'aria-label': 'Select row', onchange: e => { e.target.checked ? st.selected.add(k) : st.selected.delete(k); tr.className = e.target.checked ? 'sel' : ''; updSel(); } })));
      for (const { c, i } of visible) {
        const col = cols.find(x => x.name === c) || { ft: 'text' };
        let d = displayVal(r[i]);
        if (col.ft === 'bool' && r[i] !== null) d = { text: (r[i] === true || r[i] === 1 || r[i] === '1') ? 'Yes' : 'No', cls: '' };
        const td = h('td', { class: d.cls + (col.fk && r[i] !== null ? ' fk' : ''), title: col.fk ? `Linked to ${col.fk.table} #${r[i]}. Ctrl-click to open it.` : d.text }, d.text);
        if (col.fk && r[i] !== null) td.addEventListener('click', e => { if (e.ctrlKey || e.metaKey) openLinked(col.fk, r[i]); });
        if (editable && !col.auto) td.addEventListener('dblclick', () => inlineEdit(td, col, r[i], JSON.parse(k)));
        tr.append(td);
      }
      if (editable) tr.addEventListener('contextmenu', e => { e.preventDefault(); rowForm({ row: r, rcols, key: JSON.parse(k) }); });
      tb.append(tr);
    }
    const table = h('table', { class: 'grid' }, h('thead', null, thr), tb);
    const wrap = h('div', { class: 'grid-wrap', id: 'dataGrid' }, table);
    if (!res.rows.length) wrap.append(h('div', { class: 'empty' }, total === 0 && !st.filters.length && !st.search ? 'This table is empty. Use "Add a row" to put something in it.' : h('span', null, 'No rows match your search or filters. ', h('button', { class: 'linkbtn', onclick: () => { st.filters = []; st.search = ''; searchIn.value = ''; st.page = 0; drawFilters(); load(); } }, 'Clear them'))));
    gridHost.replaceChildren(wrap);
    const pages = Math.max(1, Math.ceil(total / st.size));
    foot.replaceChildren(
      h('span', { class: 'num' }, total ? `Showing ${fmtNum(st.page * st.size + 1)}–${fmtNum(Math.min(total, (st.page + 1) * st.size))} of ${fmtNum(total)} rows` : '0 rows', editable ? h('span', { class: 'faint' }, ' · Right-click a row to open it as a form') : ''),
      h('div', { class: 'row' },
        h('select', { class: 'select', 'aria-label': 'Rows per page', onchange: e => { st.size = +e.target.value; store.set('pageSize', st.size); st.page = 0; load(); } }, [25, 50, 100, 250, 500].map(n => h('option', { value: n, selected: n === st.size }, n + ' per page'))),
        h('button', { class: 'btn sm', disabled: st.page === 0, onclick: () => { st.page--; load(); } }, 'Previous'),
        h('span', { class: 'num' }, `Page ${st.page + 1} of ${pages}`),
        h('button', { class: 'btn sm', disabled: st.page >= pages - 1, onclick: () => { st.page++; load(); } }, 'Next')));
    updSel();
  }
  function updSel() { const b = $('#delSelBtn'); if (b) { b.hidden = !st.selected.size; b.lastChild.textContent = `Delete ${plural(st.selected.size, 'row')}`; } }
  function inlineEdit(td, col, value, key) {
    if (td.classList.contains('edit')) return;
    const orig = td.textContent;
    let input;
    if (col.ft === 'bool') input = h('select', null, h('option', { value: '' }, '(empty)'), h('option', { value: 'yes', selected: value === 1 || value === true }, 'Yes'), h('option', { value: 'no', selected: value === 0 || value === false }, 'No'));
    else input = h('input', { type: col.ft === 'date' ? 'date' : NUMERIC_T.has(col.ft) ? 'number' : 'text', step: 'any', value: value === null ? '' : String(value) });
    td.classList.add('edit'); td.replaceChildren(input); input.focus(); if (input.select) input.select();
    let finished = false;
    const finish = async (save) => {
      if (finished) return; finished = true;
      if (!save) { td.classList.remove('edit'); td.textContent = orig; return; }
      let v = input.value;
      if (v === '' && !(col.notnull && (col.ft === 'text' || col.ft === 'longtext'))) v = null; else v = coerce(v, col.ft);
      if (String(v) === String(value)) { td.classList.remove('edit'); td.textContent = orig; return; }
      const kw = keyWhere([key]);
      try { await run(`UPDATE ${qt(tableName)} SET ${qi(col.name)} = ? WHERE ${kw.sql}`, [v, ...kw.params], { label: `Changed ${col.name} in ${tableName}` }); toast('Saved.'); load(); }
      catch (e) { const x = explainError(e); toast(x.friendly, { bad: true }); td.classList.remove('edit'); td.textContent = orig; }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(true); if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  }
  async function rowForm(existing) {
    const fields = [];
    const body = h('div', { class: 'stack' });
    for (const c of cols) {
      if (!existing && c.auto) continue;
      const cur = existing ? existing.row[existing.rcols.indexOf(c.name)] : null;
      let input;
      if (c.fk) {
        const opts = await fkOptions(c.fk);
        if (opts) input = h('select', { class: 'select', id: 'f_' + c.name }, h('option', { value: '' }, '— choose —'), opts.map(o => h('option', { value: o.value, selected: String(o.value) === String(cur) }, o.label)));
      }
      if (!input && c.ft === 'bool') input = h('select', { class: 'select', id: 'f_' + c.name }, h('option', { value: '' }, '(empty)'), h('option', { value: 'yes', selected: cur === 1 || cur === true || (!existing && /^1|true/i.test(String(c.dflt))) }, 'Yes'), h('option', { value: 'no', selected: cur === 0 || cur === false || (!existing && /^0|false/i.test(String(c.dflt))) }, 'No'));
      if (!input && c.ft === 'longtext') input = h('textarea', { class: 'input', id: 'f_' + c.name, rows: 3 }, cur === null ? '' : String(cur));
      if (!input) {
        const today = new Date().toISOString().slice(0, 10);
        input = h('input', { class: 'input', id: 'f_' + c.name, type: c.ft === 'date' ? 'date' : NUMERIC_T.has(c.ft) ? 'number' : 'text', step: 'any', value: cur !== null && cur !== undefined ? String(cur) : (!existing && c.ft === 'date' && /date/i.test(c.name) ? today : '') });
        if (c.auto) input.disabled = true;
      }
      fields.push({ c, input });
      body.append(h('label', { class: 'field' }, h('span', null, prettyName(c.name), ' ', c.notnull && !c.auto && c.dflt === null ? h('span', { class: 'pill req' }, 'required') : null),
        input, h('span', { class: 'hint' }, `${ftypeLabel(c.ft)}${c.fk ? ` · picks a row from ${c.fk.table}` : ''}${c.dflt !== null && c.dflt !== undefined ? ` · default ${c.dflt}` : ''}${c.auto ? ' · filled in automatically' : ''}`)));
    }
    modal({
      title: existing ? 'Edit row' : `New row in ${prettyName(tableName)}`, body,
      actions: [
        existing ? { label: 'Delete this row', kind: 'danger', fn: async () => { await deleteKeys([existing.key]); } } : null,
        { label: 'Cancel' },
        {
          label: existing ? 'Save changes' : 'Add row', kind: 'primary', fn: async () => {
            const names = [], vals = [];
            for (const { c, input } of fields) {
              if (c.auto) continue;
              let v = input.value;
              if (v === '') { if (!existing && c.dflt !== null && c.dflt !== undefined) continue; v = c.notnull && (c.ft === 'text' || c.ft === 'longtext') ? '' : null; }
              else v = coerce(v.replace(/T(\d\d:\d\d)$/, ' $1'), c.ft);
              if (c.notnull && v === null && !(existing)) { toast(`"${prettyName(c.name)}" is required.`, { bad: true }); input.focus(); return false; }
              names.push(c.name); vals.push(v);
            }
            try {
              if (existing) { const kw = keyWhere([existing.key]); await run(`UPDATE ${qt(tableName)} SET ${names.map(n => qi(n) + ' = ?').join(', ')} WHERE ${kw.sql}`, [...vals, ...kw.params], { label: `Edited a row in ${tableName}` }); toast('Changes saved.'); }
              else { await run(`INSERT INTO ${qt(tableName)} (${names.map(qi).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`, vals, { label: `Added a row to ${tableName}` }); toast('Row added.'); }
              load();
            } catch (e) { toast(explainError(e).friendly, { bad: true }); return false; }
          }
        }].filter(Boolean)
    });
  }
  async function deleteKeys(keys) {
    const kw = keyWhere(keys);
    const sql = `DELETE FROM ${qt(tableName)} WHERE ${kw.sql}`;
    const ok = await confirmBox({ title: `Delete ${plural(keys.length, 'row')}?`, message: `This permanently removes ${plural(keys.length, 'row')} from ${prettyName(tableName)}.${TW.adapter.restoreBytes ? ' You can use Undo at the top right straight after.' : ' This cannot be undone on a server database.'}`, confirmLabel: 'Delete', danger: true, sql: inlineParams(sql, kw.params), typeToConfirm: keys.length > 20 ? 'DELETE' : null });
    if (!ok) return false;
    try { const r = await run(sql, kw.params, { label: `Deleted ${plural(keys.length, 'row')} from ${tableName}` }); st.selected.clear(); toast(`Deleted ${plural(r.changes || keys.length, 'row')}.`, TW.adapter.restoreBytes ? { action: { label: 'Undo', fn: undoLast } } : {}); load(); }
    catch (e) { toast(explainError(e).friendly, { bad: true }); return false; }
  }
  async function deleteSelected() { await deleteKeys([...st.selected].map(k => JSON.parse(k))); }
  async function exportAll(fmt) {
    const q = selectSQL();
    try {
      const r = await TW.adapter.query(q.sql + pageClause(200000, 0, q.hasOrder), q.params);
      const keep = r.columns.map((c, i) => i).filter(i => r.columns[i] !== '__rid');
      await exportRows(tableName, keep.map(i => r.columns[i]), r.rows.map(row => keep.map(i => row[i])), fmt);
    } catch (e) { toast(explainError(e).friendly, { bad: true }); }
  }
  function openLinked(fk, val) {
    const bs = browseState[fk.table] = browseState[fk.table] || { sort: null, filters: [], search: '', page: 0, size: store.get('pageSize', 50), selected: new Set(), showSQL: false };
    bs.filters = [{ col: fk.column, op: 'eq', v1: String(val) }]; bs.page = 0;
    go('browse', fk.table);
  }
  drawFilters();
  await load();
};
