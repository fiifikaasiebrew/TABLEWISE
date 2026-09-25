/* Build a question: drag-and-drop query builder */
TW.qb = TW.qb || { tables: [], joins: [], cols: [], filters: { mode: 'AND', rules: [] }, having: [], sorts: [], limit: 200, distinct: false, seq: 1 };
const FN_OUT = { YEAR: 'year', YM: 'month', MONTH: 'month_no', DOW: 'weekday', DATE: 'day', UPPER: 'upper', LOWER: 'lower', TRIM: 'trimmed', FIRST1: 'first_letter', LENGTH: 'length', ROUND0: 'rounded', ROUND2: 'rounded', ABS: 'abs' };
const CALC_OPS = [['*', '×  times'], ['+', '+  plus'], ['-', '−  minus'], ['/', '÷  divided by']];
const AGGS = [['', 'Show each value'], ['COUNT', 'Count'], ['COUNT DISTINCT', 'Count different'], ['SUM', 'Add up (sum)'], ['AVG', 'Average'], ['MIN', 'Smallest'], ['MAX', 'Largest']];
const AGG_WORD = { COUNT: 'number of', 'COUNT DISTINCT': 'number of different', SUM: 'total', AVG: 'average', MIN: 'smallest', MAX: 'largest' };

function qbAlias(t) {
  const base = t.name.includes('.') ? t.name.split('.').pop() : t.name;
  const same = TW.qb.tables.filter(x => x.name === t.name);
  const i = same.indexOf(t);
  return i > 0 ? `${base}_${i + 1}` : base;
}
function qbTable(tid) { return TW.qb.tables.find(t => t.id === tid); }
function qbExpr(tid, col) {
  if (col === '*') return '*';
  if (TW.qb.tables.length === 1) return qi(col);
  return qi(qbAlias(qbTable(tid))) + '.' + qi(col);
}
function qbColOk(c) { return c.col === '*' || (c.calc ? qbTable(c.calc.a.tid) && (c.calc.b.num !== undefined || qbTable(c.calc.b.tid)) : qbTable(c.tid)); }
function qbColExpr(c) {
  if (c.calc) {
    const A = qbExpr(c.calc.a.tid, c.calc.a.col);
    const B = c.calc.b.num !== undefined ? String(Number(c.calc.b.num) || 0) : qbExpr(c.calc.b.tid, c.calc.b.col);
    return c.calc.op === '/' ? `(${A} * 1.0 / NULLIF(${B}, 0))` : `(${A} ${c.calc.op} ${B})`;
  }
  if (c.col === '*') return '*';
  const e = qbExpr(c.tid, c.col);
  return c.fn ? DX.fn(c.fn, e) : e;
}
function qbAggExpr(c) {
  const e = qbColExpr(c);
  if (c.agg === 'COUNT DISTINCT') return `COUNT(DISTINCT ${e})`;
  if (c.agg) return `${c.agg}(${e})`;
  return e;
}
function qbCalcWords(c) { const a = prettyName(c.calc.a.col), b = c.calc.b.num !== undefined ? String(c.calc.b.num) : prettyName(c.calc.b.col); return `${a} ${ { '*': '×', '+': '+', '-': '−', '/': '÷' }[c.calc.op] } ${b}`; }
function qbColLabel(c) {
  if (c.col === '*') return 'Number of rows';
  if (c.calc) { const base = c.label ? prettyName(c.label) : qbCalcWords(c); return c.agg ? `${AGG_WORD[c.agg].replace(/^./, m => m.toUpperCase())} ${base}` : base; }
  if (c.fn) { const base0 = `${fnLabel(c.fn)} of ${prettyName(c.col)}`; return c.agg ? `${AGG_WORD[c.agg].replace(/^./, m => m.toUpperCase())} ${base0.toLowerCase()}` : base0; }
  const base = TW.qb.tables.length > 1 ? `${prettyName(qbAlias(qbTable(c.tid)))} ${prettyName(c.col)}` : prettyName(c.col);
  return c.agg ? `${AGG_WORD[c.agg].replace(/^./, m => m.toUpperCase())} ${base}` : base;
}
function qbOutName(c) {
  const prefix = { COUNT: 'count', 'COUNT DISTINCT': 'distinct', SUM: 'total', AVG: 'avg', MIN: 'min', MAX: 'max' }[c.agg];
  if (c.calc) { const b = c.label || 'result'; return prefix ? `${prefix}_${b}` : b; }
  if (c.label) return c.label;
  if (c.col === '*') return 'row_count';
  if (c.fn) { const b = `${FN_OUT[c.fn] || c.fn.toLowerCase()}_${c.col}`; return prefix ? `${prefix}_${b}` : b; }
  const dup = TW.qb.cols.filter(x => x.col === c.col && !x.agg).length > 1 || TW.qb.cols.filter(x => x.col === c.col).length > 1 && !c.agg;
  const base = dup && TW.qb.tables.length > 1 ? qbAlias(qbTable(c.tid)) + '_' + c.col : c.col;
  return prefix ? `${prefix}_${base}` : base;
}
async function qbFt(tid, col) { const t = qbTable(tid); if (!t || col === '*') return 'int'; const s = await describe(t.name); const c = s.columns.find(x => x.name === col); return c ? friendlyType(c.type, c.name) : 'text'; }

function qbBuild() {
  const qb = TW.qb; const warnings = [];
  if (!qb.tables.length) return { sql: '', params: [], english: 'Drag a table from the left onto the board to start.', warnings };
  // FROM + JOINs in connected order
  const first = qb.tables[0];
  const fromT = t => qt(t.name) + (qbAlias(t) !== t.name ? ' AS ' + qi(qbAlias(t)) : '');
  let from = 'FROM ' + fromT(first);
  const seen = new Set([first.id]); const used = new Set();
  const joinWords = [];
  let progress = true;
  while (progress) {
    progress = false;
    for (const t of qb.tables) {
      if (seen.has(t.id)) continue;
      const links = qb.joins.filter(j => (j.a.tid === t.id && seen.has(j.b.tid)) || (j.b.tid === t.id && seen.has(j.a.tid)));
      if (!links.length) continue;
      const type = links.some(j => j.type === 'LEFT') ? 'LEFT JOIN' : 'JOIN';
      from += `\n${type} ${fromT(t)} ON ` + links.map(j => { used.add(j.id); return `${qbExpr(j.a.tid, j.a.col)} = ${qbExpr(j.b.tid, j.b.col)}`; }).join(' AND ');
      const other = links[0].a.tid === t.id ? links[0].b : links[0].a;
      joinWords.push(`${type === 'LEFT JOIN' ? 'keeping every ' + prettyName(qbAlias(qbTable(other.tid))) + ' row even without a matching' : 'matched with'} <b>${esc(prettyName(qbAlias(t)))}</b>`);
      seen.add(t.id); progress = true;
    }
  }
  for (const t of qb.tables) if (!seen.has(t.id)) { from += `\nCROSS JOIN ${fromT(t)}`; warnings.push(`${prettyName(t.name)} is not linked to the other tables, so every row gets paired with every other row. Drag a dot from one column to another to link them.`); seen.add(t.id); }
  for (const j of qb.joins) if (!used.has(j.id) && qbTable(j.a.tid) && qbTable(j.b.tid)) { /* extra link between already-joined tables */ from += ''; }
  // SELECT
  const cols = qb.cols.filter(qbColOk);
  const hasAgg = cols.some(c => c.agg);
  const selParts = cols.map(c => {
    const out = qbOutName(c);
    if (c.agg) return `${qbAggExpr(c)} AS ${qi(out)}`;
    const e = qbColExpr(c);
    return (c.fn || c.calc || c.col !== out) ? `${e} AS ${qi(out)}` : e;
  });
  const top = D().page === 'offset' && qb.limit ? `TOP ${qb.limit | 0} ` : '';
  let sql = 'SELECT ' + (qb.distinct ? 'DISTINCT ' : '') + top + (selParts.length ? selParts.join(',\n       ') : '*') + '\n' + from;
  // WHERE
  const params = []; const wparts = []; const fwords = [];
  for (const r of qb.filters.rules) {
    const [tid, col] = r.key.split('|');
    const n = OPS.find(o => o.id === r.op).n;
    if (!qbTable(tid)) continue;
    if (n >= 1 && (r.v1 === undefined || r.v1 === '')) continue;
    if (n >= 2 && (r.v2 === undefined || r.v2 === '')) continue;
    const c = buildCond(qbExpr(tid, col), r.op, r.v1, r.v2, r.ft);
    if (c) { wparts.push(c.sql); params.push(...c.params); fwords.push(`<b>${esc(prettyName(col))}</b> ${esc(opLabel(r.op))}${n ? ' <b>' + esc(r.v1) + '</b>' : ''}${n > 1 ? ' and <b>' + esc(r.v2) + '</b>' : ''}`); }
  }
  if (wparts.length) sql += '\nWHERE ' + wparts.join(`\n  ${qb.filters.mode} `);
  const groupCols = hasAgg ? cols.filter(c => !c.agg) : [];
  if (groupCols.length) sql += '\nGROUP BY ' + groupCols.map(qbColExpr).join(', ');
  const hwords = [];
  const hparts = (qb.having || []).map(r => { const c = cols[r.ref]; if (!c || !c.agg || r.v === undefined || r.v === '' || isNaN(Number(r.v))) return null; params.push(Number(r.v)); hwords.push(`<b>${esc(qbColLabel(c).toLowerCase())}</b> ${esc(HAVING_OPS.find(o => o[0] === r.op)[1])} <b>${esc(r.v)}</b>`); return `${qbAggExpr(c)} ${r.op} ?`; }).filter(Boolean);
  if (hparts.length) sql += '\nHAVING ' + hparts.join(' AND ');
  const sorts = qb.sorts.filter(s => s.ref);
  if (sorts.length) sql += '\nORDER BY ' + sorts.map(s => {
    if (s.ref.startsWith('out:')) { const c = cols[+s.ref.slice(4)]; return c ? qi(qbOutName(c)) + ' ' + s.dir : null; }
    const [tid, col] = s.ref.split('|'); return qbTable(tid) ? qbExpr(tid, col) + ' ' + s.dir : null;
  }).filter(Boolean).join(', ');
  if (qb.limit && D().page !== 'offset') sql += `\nLIMIT ${qb.limit | 0}`;
  // English
  const what = cols.length ? cols.map(c => c.col === '*' ? 'the number of rows' : c.agg ? `the ${AGG_WORD[c.agg]} ${esc(qbColLabel({ ...c, agg: '' }).toLowerCase())}` : esc(qbColLabel(c))).map(s => `<b>${s}</b>`) : ['<b>every column</b>'];
  let en = `Show ${listJoin(what)} from <b>${esc(prettyName(qbAlias(first)))}</b>`;
  if (joinWords.length) en += ', ' + joinWords.join(', ');
  if (fwords.length) en += `, only where ${fwords.join(qb.filters.mode === 'AND' ? ' and ' : ' or ')}`;
  if (groupCols.length) en += `, one line per ${listJoin(groupCols.map(c => '<b>' + esc(qbColLabel(c).toLowerCase()) + '</b>'))}`;
  if (hwords.length) en += `, keeping only groups where ${hwords.join(' and ')}`;
  if (sorts.length) en += `, sorted by ${sorts.map(s => { const lab = s.ref.startsWith('out:') ? (cols[+s.ref.slice(4)] ? qbColLabel(cols[+s.ref.slice(4)]) : '') : prettyName(s.ref.split('|')[1]); return `<b>${esc(lab)}</b> (${s.dir === 'ASC' ? 'lowest/A first' : 'highest/Z first'})`; }).join(' then ')}`;
  if (qb.limit) en += `, showing up to ${fmtNum(qb.limit)} rows`;
  en += '.';
  if (hasAgg && !groupCols.length && cols.some(c => !c.agg)) warnings.push('Mixing summaries with plain columns needs grouping.');
  return { sql, params, english: en, warnings };
}
const HAVING_OPS = [['>', 'is more than'], ['>=', 'is at least'], ['<', 'is less than'], ['<=', 'is at most'], ['=', 'is exactly'], ['<>', 'is not']];
function listJoin(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

async function qbAddTable(name, x, y) {
  const qb = TW.qb;
  const t = { id: 't' + (qb.seq++), name, x: x ?? 30 + qb.tables.length * 250, y: y ?? 30 + (qb.tables.length % 2) * 60 };
  qb.tables.push(t);
  // auto-link using foreign keys
  const s = await describe(name);
  const added = [];
  for (const o of qb.tables) {
    if (o === t) continue;
    const os = await describe(o.name);
    let j = null;
    const f1 = s.fks.find(f => f.table === o.name || f.table === o.name.split('.').pop());
    const f2 = os.fks.find(f => f.table === name || f.table === name.split('.').pop());
    if (f1) j = { a: { tid: t.id, col: f1.from }, b: { tid: o.id, col: f1.to || 'id' } };
    else if (f2) j = { a: { tid: o.id, col: f2.from }, b: { tid: t.id, col: f2.to || 'id' } };
    if (j && !qb.joins.some(x => (x.a.tid === j.a.tid && x.b.tid === j.b.tid) || (x.a.tid === j.b.tid && x.b.tid === j.a.tid))) {
      qb.joins.push({ id: 'j' + (qb.seq++), ...j, type: 'INNER' }); added.push(`${prettyName(o.name)}`);
    }
  }
  if (added.length) toast(`Linked ${prettyName(name)} to ${added.join(' and ')} automatically.`);
  return t;
}

TW.views.builder = async function (root) {
  const qb = TW.qb;
  root.classList.add('full');
  root.append(h('div', { class: 'view-head' },
    h('div', null, h('h1', null, 'Question builder'), h('p', { class: 'sub' }, 'Drag tables onto the board, tick what you want to see, then press Get the answer.')),
    h('div', { class: 'row' },
      h('select', { class: 'select', id: 'qbAddSel', 'aria-label': 'Add a table', onchange: async e => { if (e.target.value) { await qbAddTable(e.target.value); e.target.value = ''; draw(); } } }, h('option', { value: '' }, '+ Add a table…'), TW.state.tables.map(t => h('option', { value: t.name }, prettyName(t.name)))),
      h('button', { class: 'btn', onclick: openSaved }, 'Saved questions'),
      h('button', { class: 'btn ghost', onclick: () => { Object.assign(qb, { tables: [], joins: [], cols: [], filters: { mode: 'AND', rules: [] }, having: [], sorts: [] }); draw(); results.replaceChildren(); } }, 'Start over'))));

  const inner = h('div', { class: 'canvas-inner' });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'links');
  const canvas = h('div', { class: 'canvas', id: 'qbCanvas' }, inner);
  const panels = h('div', { class: 'side-panels' });
  const builder = h('div', { class: 'builder', style: { height: 'min(640px, calc(100vh - 210px))', flex: 'none' } }, canvas, panels);
  const results = h('div', { class: 'results', id: 'qbResults' });
  root.append(builder, results);

  canvas.addEventListener('dragover', e => { if (e.dataTransfer.types.includes('text/tw-table')) { e.preventDefault(); canvas.classList.add('drop'); } });
  canvas.addEventListener('dragleave', () => canvas.classList.remove('drop'));
  canvas.addEventListener('drop', async e => {
    e.preventDefault(); canvas.classList.remove('drop');
    const name = e.dataTransfer.getData('text/tw-table'); if (!name) return;
    const r = inner.getBoundingClientRect();
    await qbAddTable(name, Math.max(8, e.clientX - r.left - 100), Math.max(8, e.clientY - r.top - 16)); draw();
  });

  function draw() { drawCanvas(); drawPanels(); }
  function drawCanvas() {
    inner.replaceChildren(svg);
    if (!qb.tables.length) inner.append(h('div', { class: 'hint-empty' }, h('div', { style: { fontSize: '34px', lineHeight: 1 } }, '⇠'), h('p', null, h('b', null, 'Drag a table here'), ' from the list on the left, or use "+ Add a table". Try ', h('b', null, 'orders'), ' and then ', h('b', null, 'customers'), '.')));
    for (const t of qb.tables) inner.append(tableCard(t));
    requestAnimationFrame(drawLinks);
  }
  function tableCard(t) {
    const card = h('div', { class: 'tcard', 'data-tid': t.id, style: { left: t.x + 'px', top: t.y + 'px' } });
    const header = h('header', null, icon('table', 14), h('span', { class: 'ttl', title: t.name }, prettyName(qbAlias(t))),
      h('button', { class: 'icon-btn', style: { width: '22px', height: '22px' }, title: 'Tick every column', 'aria-label': 'Select all columns', onclick: async () => { const s = await describe(t.name); for (const c of s.columns) if (!qb.cols.some(x => x.tid === t.id && x.col === c.name)) qb.cols.push({ tid: t.id, col: c.name, agg: '' }); draw(); } }, icon('plus', 13)),
      h('button', { class: 'icon-btn', style: { width: '22px', height: '22px' }, title: 'Remove from board', 'aria-label': 'Remove table', onclick: () => { qb.tables = qb.tables.filter(x => x !== t); qb.joins = qb.joins.filter(j => j.a.tid !== t.id && j.b.tid !== t.id); qb.cols = qb.cols.filter(c => c.tid !== t.id); qb.filters.rules = qb.filters.rules.filter(r => !r.key.startsWith(t.id + '|')); draw(); } }, icon('x', 13)));
    const ul = h('ul');
    card.append(header, ul);
    describe(t.name).then(s => {
      for (const c of s.columns) {
        const on = qb.cols.some(x => x.tid === t.id && x.col === c.name);
        const ft = friendlyType(c.type, c.name);
        const li = h('li', { 'data-tid': t.id, 'data-col': c.name },
          h('input', { type: 'checkbox', checked: on, 'aria-label': 'Show ' + c.name, onchange: e => { if (e.target.checked) qb.cols.push({ tid: t.id, col: c.name, agg: '' }); else qb.cols = qb.cols.filter(x => !(x.tid === t.id && x.col === c.name)); drawPanels(); } }),
          h('span', { class: 'cn', title: c.name }, c.name), c.pk ? h('span', { class: 'pill pk' }, 'ID') : null, c.fk ? h('span', { class: 'pill fk', title: 'links to ' + c.fk.table }, '→') : null,
          h('span', { class: 'ty' }, { text: 'abc', longtext: 'abc', int: '123', decimal: '1.5', money: '$', bool: 'y/n', date: 'date', datetime: 'time' }[ft]),
          h('span', { class: 'port', title: 'Drag onto a column in another table to link them' }));
        li.querySelector('.port').addEventListener('pointerdown', e => startLink(e, t.id, c.name));
        ul.append(li);
      }
      ul.addEventListener('scroll', drawLinks);
      drawLinks();
    });
    // move card
    header.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      e.preventDefault(); header.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ox = t.x, oy = t.y;
      const mv = ev => { t.x = Math.max(0, ox + ev.clientX - sx); t.y = Math.max(0, oy + ev.clientY - sy); card.style.left = t.x + 'px'; card.style.top = t.y + 'px'; drawLinks(); };
      const up = () => { header.removeEventListener('pointermove', mv); header.removeEventListener('pointerup', up); };
      header.addEventListener('pointermove', mv); header.addEventListener('pointerup', up);
    });
    return card;
  }
  function portPos(tid, col, side) {
    const card = inner.querySelector(`.tcard[data-tid="${tid}"]`); if (!card) return null;
    const li = card.querySelector(`li[data-col="${CSS.escape(col)}"]`);
    const ir = inner.getBoundingClientRect(), cr = card.getBoundingClientRect();
    let y;
    if (li) { const lr = li.getBoundingClientRect(), ur = li.parentElement.getBoundingClientRect(); y = Math.min(Math.max(lr.top + lr.height / 2, ur.top + 6), ur.bottom - 6); }
    else y = cr.top + 16;
    return { x: (side === 'r' ? cr.right : cr.left) - ir.left, y: y - ir.top };
  }
  function linkPath(a, b) {
    const ca = inner.querySelector(`.tcard[data-tid="${a.tid}"]`), cb = inner.querySelector(`.tcard[data-tid="${b.tid}"]`);
    if (!ca || !cb) return null;
    const aRight = ca.offsetLeft + 110 < cb.offsetLeft + 110;
    const p1 = portPos(a.tid, a.col, aRight ? 'r' : 'l'), p2 = portPos(b.tid, b.col, aRight ? 'l' : 'r');
    if (!p1 || !p2) return null;
    const dx = Math.max(40, Math.abs(p2.x - p1.x) / 2) * (aRight ? 1 : -1);
    return { d: `M${p1.x},${p1.y} C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`, mid: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
  }
  function drawLinks() {
    svg.replaceChildren(); inner.querySelectorAll('.jbadge').forEach(n => n.remove());
    for (const j of qb.joins) {
      const p = linkPath(j.a, j.b); if (!p) continue;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', p.d); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'var(--link)'); path.setAttribute('stroke-width', '2.2');
      if (j.type === 'LEFT') path.setAttribute('stroke-dasharray', '6 4');
      svg.append(path);
      const b = h('div', { class: 'jbadge', style: { position: 'absolute', left: p.mid.x + 'px', top: p.mid.y + 'px', transform: 'translate(-50%,-50%)', display: 'flex', gap: '2px', background: 'var(--surface)', border: '1px solid var(--link)', borderRadius: '999px', padding: '1px 4px 1px 8px', fontSize: '11.5px', alignItems: 'center', zIndex: 2, whiteSpace: 'nowrap' } },
        h('button', { style: { border: 0, background: 'none', cursor: 'pointer', color: 'var(--link)', fontWeight: 600, padding: '0 2px' }, title: 'Switch between "only matches" and "keep all rows"', onclick: () => { j.type = j.type === 'LEFT' ? 'INNER' : 'LEFT'; draw(); } }, j.type === 'LEFT' ? 'keep all' : 'matches'),
        h('button', { class: 'icon-btn', style: { width: '18px', height: '18px' }, 'aria-label': 'Remove link', title: 'Remove this link', onclick: () => { qb.joins = qb.joins.filter(x => x !== j); draw(); } }, icon('x', 11)));
      inner.append(b);
    }
  }
  function startLink(e, tid, col) {
    e.preventDefault(); e.stopPropagation();
    const start = portPos(tid, col, 'r');
    const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    temp.setAttribute('fill', 'none'); temp.setAttribute('stroke', 'var(--link)'); temp.setAttribute('stroke-width', '2'); temp.setAttribute('stroke-dasharray', '4 3');
    svg.append(temp);
    let target = null;
    const mv = ev => {
      const ir = inner.getBoundingClientRect();
      temp.setAttribute('d', `M${start.x},${start.y} L${ev.clientX - ir.left},${ev.clientY - ir.top}`);
      const el = document.elementFromPoint(ev.clientX, ev.clientY); const li = el && el.closest('li[data-tid]');
      if (target && target !== li) target.classList.remove('target');
      target = li && li.dataset.tid !== tid ? li : null; if (target) target.classList.add('target');
    };
    const up = () => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); temp.remove();
      if (target) {
        target.classList.remove('target');
        qb.joins.push({ id: 'j' + (qb.seq++), a: { tid, col }, b: { tid: target.dataset.tid, col: target.dataset.col }, type: 'INNER' });
        toast(`Linked ${col} to ${target.dataset.col}.`); draw();
      }
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  }

  async function drawPanels() {
    const allCols = [];
    for (const t of qb.tables) { const s = await describe(t.name); for (const c of s.columns) allCols.push({ key: t.id + '|' + c.name, label: (qb.tables.length > 1 ? prettyName(qbAlias(t)) + ' › ' : '') + c.name, ft: friendlyType(c.type, c.name) }); }
    // columns panel
    const ftOf = c => { const x = allCols.find(a => a.key === c.tid + '|' + c.col); return x ? x.ft : 'text'; };
    const colsPanel = h('div', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h3', null, '1. Columns to show'),
      h('div', { class: 'row', style: { gap: '4px' } },
        h('button', { class: 'btn sm', title: 'Adds a count of rows, for questions like "how many orders per customer"', 'data-x': 'qb-count', onclick: () => { qb.cols.push({ tid: null, col: '*', agg: 'COUNT' }); drawPanels(); } }, '+ Count'),
        h('button', { class: 'btn sm', title: 'Work out a new number from two columns, like quantity × price', 'data-x': 'qb-calc', disabled: !allCols.length, onclick: () => calcDialog(allCols) }, '+ Calculation'))));
    if (!qb.cols.length) colsPanel.append(h('p', { class: 'faint', style: { fontSize: '13px' } }, 'Tick columns on the board. If you tick nothing, every column is shown.'));
    qb.cols.forEach((c, i) => {
      if (!qbColOk(c)) return;
      const aggSel = h('select', { class: 'select', 'aria-label': 'Show or summarise', 'data-x': 'qb-agg' }, (c.col === '*' ? [['COUNT', 'Count']] : AGGS).map(([v, l]) => h('option', { value: v, selected: v === c.agg }, l)));
      aggSel.onchange = () => { c.agg = aggSel.value; drawPanels(); };
      const grp = c.col === '*' || c.calc ? null : fnGroup(ftOf(c));
      const fnSel = grp ? h('select', { class: 'select', 'aria-label': 'Change the value', 'data-x': 'qb-fn', onchange: e => { c.fn = e.target.value; drawPanels(); } }, COL_FNS[grp].map(([v, l]) => h('option', { value: v, selected: v === (c.fn || '') }, l))) : null;
      colsPanel.append(h('div', { class: 'colrow' },
        h('div', { class: 'colrow-top' }, h('span', { class: 'nm', title: qbColLabel(c) }, qbColLabel(c)),
          h('div', { class: 'row', style: { gap: '0', flexWrap: 'nowrap' } },
            c.calc ? h('button', { class: 'icon-btn', style: { width: '24px' }, 'aria-label': 'Edit calculation', title: 'Edit calculation', onclick: () => calcDialog(allCols, c) }, '✎') : null,
            h('button', { class: 'icon-btn', style: { width: '24px' }, disabled: i === 0, 'aria-label': 'Move up', onclick: () => { qb.cols.splice(i - 1, 0, qb.cols.splice(i, 1)[0]); drawPanels(); } }, '↑'),
            h('button', { class: 'icon-btn', style: { width: '24px' }, 'aria-label': 'Remove column', onclick: () => { qb.cols.splice(i, 1); qb.having = (qb.having || []).filter(x => x.ref !== i).map(x => ({ ...x, ref: x.ref > i ? x.ref - 1 : x.ref })); drawCanvas(); drawPanels(); } }, icon('x', 13)))),
        h('div', { class: 'colrow-sel' }, fnSel, aggSel)));
    });
    if (qb.cols.some(c => c.agg)) colsPanel.append(h('p', { class: 'faint', style: { fontSize: '12px', marginTop: '6px' } }, 'Columns left on "Show each value" become groups: you get one line per group. Tip: set a date to "Year and month" to get totals per month.'));
    // filters
    const fp = h('div', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h3', null, '2. Only rows where…'),
      h('select', { class: 'select', style: { padding: '3px 6px', fontSize: '12.5px' }, 'aria-label': 'Match all or any', onchange: e => { qb.filters.mode = e.target.value; update(); } }, h('option', { value: 'AND', selected: qb.filters.mode === 'AND' }, 'all rules match'), h('option', { value: 'OR', selected: qb.filters.mode === 'OR' }, 'any rule matches'))));
    qb.filters.rules.forEach((r, i) => {
      if (!allCols.find(c => c.key === r.key)) return;
      const proxy = { col: r.key, op: r.op, v1: r.v1, v2: r.v2 };
      const ed = filterRuleEditor(proxy, allCols, () => { r.key = proxy.col; r.op = proxy.op; r.v1 = proxy.v1; r.v2 = proxy.v2; r.ft = proxy.ft; update(); }, () => { qb.filters.rules.splice(i, 1); drawPanels(); }, i ? (qb.filters.mode === 'AND' ? 'and' : 'or') : 'where');
      r.ft = proxy.ft; r.op = proxy.op;
      ed.querySelectorAll('.select').forEach(s => { s.style.maxWidth = '100%'; });
      ed.querySelectorAll('input').forEach(s => { s.style.width = '110px'; });
      fp.append(ed);
    });
    fp.append(h('button', { class: 'btn sm', disabled: !allCols.length, style: { marginTop: qb.filters.rules.length ? '8px' : '0' }, onclick: () => { qb.filters.rules.push({ key: allCols[0].key, op: 'eq' }); drawPanels(); } }, icon('filter', 13), 'Add a rule'));
    // groups filter (HAVING)
    qb.having = qb.having || [];
    const aggCols = qb.cols.map((c, i) => ({ c, i })).filter(x => x.c.agg && qbColOk(x.c));
    const hp = aggCols.length ? h('div', { class: 'panel', 'data-x': 'qb-having' }, h('div', { class: 'panel-title' }, h('h3', null, 'Only groups where…'))) : null;
    if (hp) {
      qb.having.forEach((r, j) => {
        hp.append(h('div', { class: 'hrule' },
          h('select', { class: 'select', 'aria-label': 'Summary', onchange: e => { r.ref = +e.target.value; update(); } }, aggCols.map(x => h('option', { value: x.i, selected: x.i === r.ref }, qbColLabel(x.c)))),
          h('select', { class: 'select', 'aria-label': 'Compare', onchange: e => { r.op = e.target.value; update(); } }, HAVING_OPS.map(([v, l]) => h('option', { value: v, selected: v === r.op }, l))),
          h('input', { class: 'input', type: 'number', step: 'any', style: { width: '90px' }, value: r.v ?? '', 'aria-label': 'Number', oninput: e => { r.v = e.target.value; update(); } }),
          h('button', { class: 'icon-btn', 'aria-label': 'Remove rule', onclick: () => { qb.having.splice(j, 1); drawPanels(); } }, icon('x'))));
      });
      hp.append(h('button', { class: 'btn sm', onclick: () => { qb.having.push({ ref: aggCols[0].i, op: '>=', v: '' }); drawPanels(); } }, '+ Add a rule for totals'),
        h('p', { class: 'faint', style: { fontSize: '12px', marginTop: '6px' } }, 'Example: only customers whose total is at least 500.'));
    }
    // sort + options
    const sortOpts = [...qb.cols.map((c, i) => ['out:' + i, qbColLabel(c)]), ...allCols.map(c => [c.key, c.label])];
    const sp = h('div', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h3', null, '3. Sort and limit')));
    qb.sorts.forEach((s, i) => {
      sp.append(h('div', { class: 'frule', style: { marginBottom: '6px' } },
        h('select', { class: 'select', style: { flex: 1, maxWidth: '100%' }, 'aria-label': 'Sort by', onchange: e => { s.ref = e.target.value; update(); } }, sortOpts.map(([v, l]) => h('option', { value: v, selected: v === s.ref }, l))),
        h('select', { class: 'select', 'aria-label': 'Direction', onchange: e => { s.dir = e.target.value; update(); } }, h('option', { value: 'ASC', selected: s.dir === 'ASC' }, 'Low → high, A → Z'), h('option', { value: 'DESC', selected: s.dir === 'DESC' }, 'High → low, Z → A')),
        h('button', { class: 'icon-btn', 'aria-label': 'Remove sort', onclick: () => { qb.sorts.splice(i, 1); drawPanels(); } }, icon('x'))));
    });
    sp.append(h('div', { class: 'row' },
      h('button', { class: 'btn sm', disabled: !sortOpts.length, onclick: () => { qb.sorts.push({ ref: sortOpts[0][0], dir: qb.cols.some(c => c.agg) ? 'DESC' : 'ASC' }); drawPanels(); } }, '+ Sort by'),
      h('label', { class: 'check', style: { fontSize: '13px', marginLeft: 'auto' } }, 'Max rows', h('input', { class: 'input', type: 'number', min: 0, style: { width: '84px', padding: '3px 6px' }, value: qb.limit, onchange: e => { qb.limit = Math.max(0, +e.target.value | 0); update(); } }))),
      h('label', { class: 'check', style: { fontSize: '13px', marginTop: '8px' } }, h('input', { type: 'checkbox', checked: qb.distinct, onchange: e => { qb.distinct = e.target.checked; update(); } }), 'Remove duplicate rows'));
    const out = h('div', { class: 'panel', id: 'qbOut' });
    panels.replaceChildren(...[colsPanel, fp, hp, sp, out].filter(Boolean));
    update();
  }
  function update() {
    const out = $('#qbOut'); if (!out) return;
    const b = qbBuild();
    out.replaceChildren(
      h('div', { class: 'panel-title' }, h('h3', null, '4. Your question'), h('span', { class: 'help-dot', title: 'This is your question in plain English, and the SQL code the computer runs. You do not need to read the SQL.' }, '?')),
      h('div', { class: 'english', html: b.english }),
      ...b.warnings.map(w => h('div', { class: 'notice warn', style: { marginTop: '8px' } }, w)),
      h('details', { style: { marginTop: '8px' } }, h('summary', { class: 'faint', style: { cursor: 'pointer', fontSize: '13px' } }, 'See the SQL'), b.sql ? sqlBlock(inlineParams(b.sql, b.params)) : ''),
      h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn primary', id: 'qbRun', disabled: !b.sql, onclick: runIt }, icon('play', 14), 'Get the answer'),
        h('button', { class: 'btn', disabled: !b.sql, onclick: saveIt }, icon('save', 14), 'Save'),
        h('button', { class: 'btn ghost', disabled: !b.sql, onclick: () => { TW.sqlDraft = inlineParams(b.sql, b.params); go('sql'); } }, 'Edit as SQL')));
  }
  async function runIt() {
    const b = qbBuild();
    results.replaceChildren(h('p', { class: 'faint' }, 'Running…'));
    try {
      const r = await run(b.sql, b.params, { log: true, label: 'Question from the builder' });
      const chart = barChart(r.columns, r.rows);
      results.replaceChildren(
        h('div', { class: 'toolbar' }, h('h2', null, 'Answer'), h('span', { class: 'faint num' }, `${plural(r.rows.length, 'row')} · ${r.ms} ms`), h('span', { style: { flex: 1 } }),
          h('button', { class: 'btn sm', onclick: () => exportRows('question-result', r.columns, r.rows, 'csv') }, icon('download', 14), 'CSV'),
          h('button', { class: 'btn sm', onclick: () => exportRows('question-result', r.columns, r.rows, 'xlsx') }, icon('download', 14), 'Excel'),
          TW.state.readOnly ? null : h('button', { class: 'btn sm', title: 'Save this question as a reusable view that appears in your table list', onclick: () => saveAsView(b) }, 'Save as a view')),
        ...[chart ? h('div', { style: { marginBottom: '12px' } }, chart) : null, resultGrid(r.columns, r.rows, { height: '480px' })].filter(Boolean));
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) { results.replaceChildren(errorNotice(e)); }
  }
  async function saveAsView(b) {
    const name = h('input', { class: 'input', id: 'viewName', placeholder: 'e.g. sales_by_customer' });
    modal({
      title: 'Save as a view', body: [h('p', { class: 'muted' }, 'A view is a saved question that looks like a table. It always shows fresh data.'), h('label', { class: 'field' }, h('span', null, 'Name'), name)],
      actions: [{ label: 'Cancel' }, {
        label: 'Save view', kind: 'primary', fn: async () => {
          const n = name.value.trim().replace(/\s+/g, '_'); if (!n) return false;
          const body = inlineParams(b.sql, b.params).replace(/\nORDER BY[\s\S]*?(?=\nLIMIT|$)/, '').replace(/\nLIMIT \d+$/, '').replace(/^SELECT (DISTINCT )?TOP \d+ /, 'SELECT $1');
          try { await run(`CREATE VIEW ${qi(n)} AS\n${body}`, [], { label: 'Created view ' + n }); toast('View saved. It is now in your table list.'); } catch (e) { toast(explainError(e).friendly, { bad: true }); return false; }
        }
      }]
    });
  }
  function saveIt() {
    const name = h('input', { class: 'input', id: 'qName', placeholder: 'e.g. Top customers this year' });
    modal({
      title: 'Save this question', body: [h('label', { class: 'field' }, h('span', null, 'Name'), name)],
      actions: [{ label: 'Cancel' }, { label: 'Save', kind: 'primary', fn: () => { const list = store.get('questions', []); list.unshift({ name: name.value.trim() || 'Untitled question', at: Date.now(), qb: JSON.parse(JSON.stringify(qb)), db: TW.adapter.name }); store.set('questions', list.slice(0, 100)); toast('Saved. Find it under "Saved questions".'); } }]
    });
  }
  function openSaved() {
    const list = store.get('questions', []);
    const body = list.length ? h('div', { class: 'stack' }, list.map((q, i) => h('div', { class: 'row', style: { justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '8px' } },
      h('div', null, h('b', null, q.name), h('div', { class: 'faint', style: { fontSize: '12px' } }, `${q.db} · ${new Date(q.at).toLocaleString()}`)),
      h('div', { class: 'row' }, h('button', { class: 'btn sm primary', onclick: () => { Object.assign(qb, JSON.parse(JSON.stringify(q.qb))); m.close(); draw(); } }, 'Open'),
        h('button', { class: 'btn sm ghost', onclick: () => { list.splice(i, 1); store.set('questions', list); m.close(); openSaved(); } }, 'Remove'))))) : h('p', { class: 'muted' }, 'No saved questions yet. Build one and click Save.');
    const m = modal({ title: 'Saved questions', body, actions: [{ label: 'Close' }] });
  }
  function calcDialog(allCols, existing) {
    const nums = allCols.filter(c => NUMERIC_T.has(c.ft));
    const pool = nums.length ? nums : allCols;
    const c = existing || { calc: { a: null, op: '*', b: null }, agg: '', label: '' };
    const key = x => x ? x.tid + '|' + x.col : '';
    const aSel = h('select', { class: 'select', id: 'calcA' }, pool.map(x => h('option', { value: x.key, selected: x.key === key(c.calc.a) }, x.label)));
    const opSel = h('select', { class: 'select', id: 'calcOp' }, CALC_OPS.map(([v, l]) => h('option', { value: v, selected: v === c.calc.op }, l)));
    const bSel = h('select', { class: 'select', id: 'calcB' }, h('option', { value: '#', selected: c.calc.b && c.calc.b.num !== undefined }, 'a number I type…'), pool.map(x => h('option', { value: x.key, selected: x.key === key(c.calc.b) }, x.label)));
    if (!existing && pool[1]) bSel.value = (pool.find(x => /price|cost|amount/i.test(x.key) && x.key !== aSel.value) || pool[1]).key;
    const num = h('input', { class: 'input', id: 'calcNum', type: 'number', step: 'any', value: c.calc.b && c.calc.b.num !== undefined ? c.calc.b.num : '1.15', hidden: bSel.value !== '#' });
    bSel.onchange = () => { num.hidden = bSel.value !== '#'; };
    const name = h('input', { class: 'input', id: 'calcName', value: c.label || '', placeholder: 'e.g. line_total' });
    modal({
      title: existing ? 'Change the calculation' : 'Add a calculation', body: [
        h('p', { class: 'muted', style: { fontSize: '13.5px' } }, 'Make a new number from other columns, like quantity × unit price = money for that line. Then you can Add up the result to get total sales.'),
        h('label', { class: 'field' }, h('span', null, 'Take'), aSel), h('label', { class: 'field' }, h('span', null, 'and'), opSel),
        h('label', { class: 'field' }, h('span', null, 'with'), bSel, num),
        h('label', { class: 'field' }, h('span', null, 'Call the result'), name, h('span', { class: 'hint' }, 'Lowercase words joined by underscores.'))],
      actions: [{ label: 'Cancel' }, {
        label: existing ? 'Save' : 'Add', kind: 'primary', fn: () => {
          const [atid, acol] = aSel.value.split('|');
          c.calc = { a: { tid: atid, col: acol }, op: opSel.value, b: bSel.value === '#' ? { num: Number(num.value) || 0 } : { tid: bSel.value.split('|')[0], col: bSel.value.split('|').slice(1).join('|') } };
          c.label = safeIdent(name.value) || (acol + '_' + { '*': 'times', '+': 'plus', '-': 'minus', '/': 'per' }[opSel.value] + '_' + (bSel.value === '#' ? String(num.value).replace(/\W/g, '_') : bSel.value.split('|')[1]));
          if (!existing) qb.cols.push(c);
          drawPanels();
        }
      }]
    });
  }
  draw();
};
