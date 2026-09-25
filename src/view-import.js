/* Import: CSV, TSV, Excel, JSON into tables; open SQLite files */
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/, 1)[0];
  const cand = [',', ';', '\t', '|'];
  const delim = cand.map(d => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += ch; continue; }
    if (ch === '"' && field === '') q = true;
    else if (ch === delim) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(field); field = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}
function inferType(values) {
  const v = values.filter(x => x !== null && x !== undefined && String(x).trim() !== '').map(x => typeof x === 'string' ? x.trim() : x);
  if (!v.length) return 'text';
  if (v.every(x => typeof x === 'boolean' || /^(true|false|yes|no)$/i.test(x))) return 'bool';
  if (v.every(x => typeof x === 'number' ? Number.isInteger(x) : /^-?\d{1,15}$/.test(x))) return 'int';
  if (v.every(x => typeof x === 'number' || /^-?\d*\.?\d+(e-?\d+)?$/i.test(String(x).replace(/,/g, '')))) return v.every(x => /^-?\d+(\.\d{2})?$/.test(String(x))) && v.some(x => /\.\d{2}$/.test(String(x))) ? 'money' : 'decimal';
  if (v.every(x => x instanceof Date || /^\d{4}-\d{2}-\d{2}$/.test(x))) return 'date';
  if (v.every(x => x instanceof Date || /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?/.test(x))) return 'datetime';
  return v.some(x => String(x).length > 255) ? 'longtext' : 'text';
}
async function readZipFirst(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== 0x04034b50) return null;
  const method = dv.getUint16(8, true), csize = dv.getUint32(18, true), nlen = dv.getUint16(26, true), xlen = dv.getUint16(28, true);
  const name = new TextDecoder().decode(bytes.subarray(30, 30 + nlen));
  const data = bytes.subarray(30 + nlen + xlen, 30 + nlen + xlen + csize);
  if (method === 0) return { name, data };
  if (method === 8 && window.DecompressionStream) { const s = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return { name, data: new Uint8Array(await new Response(s).arrayBuffer()) }; }
  return null;
}
const isSqliteBytes = b => b.length > 16 && new TextDecoder().decode(b.subarray(0, 15)) === 'SQLite format 3';

TW.views.import = async function (root) {
  root.append(h('div', { class: 'view-head' }, h('div', null, h('h1', null, 'Import a file'), h('p', { class: 'sub' }, 'Drop a spreadsheet (CSV, Excel, JSON) to turn it into a table, or a database file (.sqlite, .db) to open it.'))));
  const inp = h('input', { type: 'file', id: 'importFile', accept: '.csv,.tsv,.txt,.xlsx,.xls,.json,.sqlite,.sqlite3,.db,.zip', hidden: true });
  const dz = h('div', { class: 'dropzone', tabindex: '0', role: 'button', onclick: () => inp.click(), onkeydown: e => { if (e.key === 'Enter') inp.click(); } },
    h('div', { style: { color: 'var(--accent)', marginBottom: '6px' } }, icon('import', 30)), h('h2', null, 'Drop a file here'), h('p', { class: 'muted' }, 'or click to choose one from your computer'));
  const stage = h('div', { style: { marginTop: '18px' } });
  root.append(dz, inp, stage);
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('over'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('over'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('over'); if (e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]); });
  inp.onchange = () => { if (inp.files[0]) handle(inp.files[0]); inp.value = ''; };

  async function handle(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    let bytes = new Uint8Array(await file.arrayBuffer());
    if (ext === 'zip') { const z = await readZipFirst(bytes); if (!z) { toast('That zip file could not be read.', { bad: true }); return; } bytes = z.data; }
    if (isSqliteBytes(bytes)) { await TW.openSqliteBytes(bytes, file.name.replace(/\.(zip|sqlite3?|db)$/i, ''), DESK && DESK.pathOf ? DESK.pathOf(file) : null); return; }
    let header, rows;
    try {
      if (ext === 'xlsx' || ext === 'xls') {
        if (!window.XLSX) throw new Error('The Excel reader did not load. Save the sheet as CSV and try again.');
        const wb = XLSX.read(bytes, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: null });
        header = aoa[0] || []; rows = aoa.slice(1).filter(r => r.some(v => v !== null && v !== ''));
        if (wb.SheetNames.length > 1) toast(`Using the first sheet, "${sheetName}".`);
      } else if (ext === 'json') {
        let data = JSON.parse(new TextDecoder().decode(bytes));
        if (!Array.isArray(data)) data = Object.values(data).find(Array.isArray) || [data];
        header = [...new Set(data.flatMap(o => Object.keys(o || {})))];
        rows = data.map(o => header.map(k => o[k] === undefined ? null : typeof o[k] === 'object' && o[k] !== null ? JSON.stringify(o[k]) : o[k]));
      } else {
        const all = parseCSV(new TextDecoder().decode(bytes)); header = all[0] || []; rows = all.slice(1);
      }
    } catch (e) { stage.replaceChildren(h('div', { class: 'notice bad' }, 'Could not read that file: ' + e.message)); return; }
    rows = rows.map(r => r.map(v => v instanceof Date ? v.toISOString().slice(0, v.getUTCHours() || v.getUTCMinutes() ? 19 : 10).replace('T', ' ') : v));
    header = header.map((c, i) => safeIdent(c) || `column_${i + 1}`);
    header = header.map((c, i) => header.indexOf(c) !== i ? `${c}_${i + 1}` : c);
    preview(file.name, header, rows);
  }
  function preview(fname, header, rows) {
    const cols = header.map((name, i) => ({ src: i, name, type: inferType(rows.slice(0, 2000).map(r => r[i])), keep: true }));
    const base = safeIdent(fname.replace(/\.[^.]+$/, '')) || 'imported';
    const tname = h('input', { class: 'input', id: 'impName', value: base });
    const mode = h('select', { class: 'select', id: 'impMode' }, h('option', { value: 'new' }, 'Create a new table'), TW.state.tables.filter(t => t.type === 'table').map(t => h('option', { value: t.name }, 'Add rows to ' + prettyName(t.name))));
    const addId = h('input', { type: 'checkbox', checked: !header.includes('id') });
    const mapHost = h('tbody');
    const draw = () => mapHost.replaceChildren(...cols.map(c => h('tr', null,
      h('td', null, h('input', { type: 'checkbox', checked: c.keep, 'aria-label': 'Include column', onchange: e => c.keep = e.target.checked })),
      h('td', null, h('input', { class: 'input', value: c.name, 'aria-label': 'Column name', oninput: e => c.name = safeIdent(e.target.value) })),
      h('td', null, h('select', { class: 'select', 'aria-label': 'Kind of data', onchange: e => c.type = e.target.value }, FTYPES.map(f => h('option', { value: f.id, selected: f.id === c.type }, f.label)))),
      h('td', { class: 'faint', style: { fontSize: '12.5px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, rows.slice(0, 3).map(r => r[c.src]).filter(v => v !== null && v !== '').join(' · ')))));
    draw();
    mode.onchange = () => { tname.disabled = mode.value !== 'new'; addId.disabled = mode.value !== 'new'; };
    stage.replaceChildren(h('div', { class: 'panel stack' },
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('h2', null, `${fname}`), h('span', { class: 'faint' }, `${plural(rows.length, 'row')}, ${plural(cols.length, 'column')} found`)),
      h('div', { class: 'row' }, h('label', { class: 'field' }, h('span', null, 'What to do'), mode), h('label', { class: 'field' }, h('span', null, 'New table name'), tname), h('label', { class: 'check', style: { alignSelf: 'flex-end', paddingBottom: '8px' } }, addId, 'Add an automatic ID column')),
      h('p', { class: 'muted', style: { fontSize: '13px' } }, 'Check the kind of data guessed for each column. When adding to an existing table, columns are matched by name.'),
      h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'coltable' }, h('thead', null, h('tr', null, ['Use', 'Column name', 'Kind of data', 'Examples'].map(x => h('th', null, x)))), mapHost)),
      h('h3', null, 'First rows'), resultGrid(header, rows.slice(0, 8), { height: '240px' }),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', id: 'impGo', onclick: go_ }, icon('import', 14), `Import ${plural(rows.length, 'row')}`), h('button', { class: 'btn ghost', onclick: () => stage.replaceChildren() }, 'Cancel'))));

    async function go_() {
      if (TW.state.readOnly) { toast('Read-only mode is on. Turn it off in Settings to import.', { bad: true }); return; }
      const keep = cols.filter(c => c.keep && c.name);
      if (!keep.length) { toast('Pick at least one column.', { bad: true }); return; }
      let target = mode.value;
      const stmts = [];
      if (target === 'new') {
        target = safeIdent(tname.value);
        if (!target) { toast('Give the table a name.', { bad: true }); return; }
        if (TW.state.tables.some(t => t.name === target)) { toast(`A table called ${target} already exists. Pick another name or choose "Add rows to ${target}".`, { bad: true }); return; }
        const defs = (addId.checked ? [`${qi('id')} ${autoIdSQL()}`] : []).concat(keep.map(c => colDefSQL({ name: c.name, type: c.type })));
        stmts.push({ sql: `CREATE TABLE ${qi(target)} (\n  ${defs.join(',\n  ')}\n)` });
      } else {
        const s = await describe(target); const names = new Set(s.columns.map(c => c.name));
        const missing = keep.filter(c => !names.has(c.name));
        if (missing.length) { toast(`These columns are not in ${target}: ${missing.map(c => c.name).join(', ')}. Untick them or rename them to match.`, { bad: true }); return; }
      }
      const per = Math.max(1, Math.min(500, Math.floor(2000 / keep.length)));
      for (let i = 0; i < rows.length; i += per) {
        const chunk = rows.slice(i, i + per); const params = [];
        for (const r of chunk) for (const c of keep) { let v = r[c.src]; if (v === '' || v === undefined) v = null; else if (v !== null) v = coerce(v, c.type); params.push(v); }
        stmts.push({ sql: `INSERT INTO ${qt(target)} (${keep.map(c => qi(c.name)).join(', ')}) VALUES ${chunk.map(() => '(' + keep.map(() => '?').join(', ') + ')').join(', ')}`, params });
      }
      const btn = $('#impGo'); btn.disabled = true; btn.lastChild.textContent = 'Importing…';
      try { await runTx(stmts, `Imported ${plural(rows.length, 'row')} into ${target}`); TW.state.schema = {}; await refreshTables(); toast(`Imported ${plural(rows.length, 'row')} into ${target}.`); go('browse', target); }
      catch (e) { btn.disabled = false; btn.lastChild.textContent = 'Try again'; stage.prepend(errorNotice(e)); }
    }
  }
};
