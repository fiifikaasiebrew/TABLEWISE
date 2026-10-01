/*
 * Tablewise — view-home.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Dashboard */
TW.views = TW.views || {};
TW.views.home = async function (root) {
  const tables = TW.state.tables.filter(t => t.type === 'table');
  const views = TW.state.tables.filter(t => t.type === 'view');
  const total = tables.reduce((a, t) => a + (t.count || 0), 0);
  const schemas = await allSchemas();
  const rels = [];
  for (const [t, s] of Object.entries(schemas)) for (const f of s.fks || []) rels.push([t, f.from, f.table, f.to]);

  root.append(h('div', { class: 'view-head' },
    h('div', null, h('span', { class: 'label' }, D().label + ' database'), h('h1', null, TW.adapter.name),
      h('p', { class: 'sub' }, 'Pick a table on the left to look inside it. Not sure what something is? Turn on ', h('b', null, 'Explain on hover'), ' at the top and point at it.'))));

  const stat = (n, label, x) => h('div', { class: 'stat', 'data-x': x }, h('span', { class: 'big num' }, fmtNum(n)), h('span', { class: 'faint' }, label));
  root.append(h('div', { class: 'stats' }, stat(tables.length, tables.length === 1 ? 'table' : 'tables', 'tree-tables'), stat(total, 'rows in total', 'tab-browse'), stat(rels.length, rels.length === 1 ? 'link between tables' : 'links between tables', 'tree-fk'), views.length ? stat(views.length, 'saved views', 'tree-views') : null));

  if (TW.adapter.isSample) root.append(h('div', { class: 'notice info', style: { margin: '20px 0 0' } }, h('div', null, h('b', null, 'This is practice data. '), 'Northwind Supply Co. is a pretend company with customers, products and orders. Change or delete anything you like. ', h('button', { class: 'linkbtn', onclick: () => TW.tour.start() }, 'Show me around →'))));

  const step = (n, title, text, fn) => h('button', { class: 'start-row', onclick: fn }, h('span', { class: 'n' }, n), h('span', null, h('b', null, title), h('span', { class: 'muted' }, text)));
  const first = (tables.find(t => t.name === 'customers') || tables[0] || {}).name;
  root.append(h('h2', { class: 'sec' }, 'Where to start'),
    h('div', { class: 'start-list' },
      step('1', 'Look at some data', 'Open a table and scroll through it like a spreadsheet.', () => first ? go('browse', first) : go('design')),
      step('2', 'Ask a question', 'Drag tables together to find answers, like "who bought the most?"', () => go('builder')),
      step('3', 'Ask the AI', 'Type your question in everyday words.', () => TW.guide.open('ai')),
      step('4', 'Make your own table', 'Create a table from scratch or bring in a spreadsheet.', () => go('design')),
      step('5', 'Learn SQL from zero', `${LESSONS.length} short lessons with tasks that are checked for you.`, () => go('learn'))));

  root.append(h('h2', { class: 'sec' }, 'Tables'));
  if (!TW.state.tables.length) root.append(h('div', { class: 'empty' }, 'No tables yet. ', h('button', { class: 'btn primary sm', onclick: () => { go('design'); setTimeout(createTableWizard, 150); } }, 'Create your first table')));
  else root.append(h('div', { class: 'grid-wrap', style: { maxHeight: 'none' } }, h('table', { class: 'grid plain' },
    h('thead', null, h('tr', null, ['Name', 'Rows', 'Columns', 'Links to', ''].map(x => h('th', { style: { cursor: 'default' } }, x)))),
    h('tbody', null, TW.state.tables.map(t => { const s = schemas[t.name] || { columns: [], fks: [] }; return h('tr', null,
      h('td', null, h('a', { href: '#', class: 'tlink', onclick: e => { e.preventDefault(); go('browse', t.name); } }, t.name), t.type === 'view' ? h('span', { class: 'faint' }, '  (saved view)') : null),
      h('td', { class: 'n' }, t.count === null || t.count === undefined ? '—' : fmtNum(t.count)),
      h('td', { class: 'n' }, s.columns.length),
      h('td', { class: 'muted' }, [...new Set(s.fks.map(f => f.table))].join(', ') || '—'),
      h('td', { style: { textAlign: 'right' } }, h('button', { class: 'btn sm ghost', onclick: () => go('browse', t.name) }, 'Data'), h('button', { class: 'btn sm ghost', onclick: () => go('design', t.name) }, 'Structure'))); })))));

  if (rels.length) root.append(h('h2', { class: 'sec' }, 'How the tables connect'),
    h('p', { class: 'muted', style: { marginBottom: '8px', fontSize: '13.5px' } }, 'Each line means "every row on the left belongs to one row on the right".'),
    h('ul', { class: 'rels' }, rels.map(([t, f, t2, c2]) => h('li', null, h('b', null, t), h('span', { class: 'faint mono' }, '.' + f), ' → ', h('b', null, t2), h('span', { class: 'faint mono' }, '.' + (c2 || 'id'))))));
};
