/*
 * Tablewise — guide.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Guide drawer, glossary, guided tour and the AI assistant */
const GUIDES = {
  home: { t: 'Home', html: `
<h3>What is a database?</h3><p>Think of a <b>toy chest</b> full of <b>boxes</b>. Each box is a <b>table</b>. Inside each box are <b>cards</b>. Each card is a <b>row</b>, like one customer. Every card has the same <b>lines</b> to fill in, like name and city. Those lines are the <b>columns</b>.</p>
<h3>Try this first</h3><ol><li>On the left, click <b>customers</b>. You will see all the customer cards laid out like a spreadsheet.</li><li>Click the word <b>city</b> at the top of a column. Now the rows are sorted by city.</li><li>Double-click any cell, type something new, and press <b>Enter</b>. You just changed the database.</li><li>Oops? Press <b>Undo</b> at the top.</li></ol>
<h3>Not sure what something does?</h3><p>Turn on <b>Explain on hover</b> at the top, then point at anything. A little bubble tells you what it is.</p>
<h3>You can't break anything</h3><p>This is practice data. Before anything is deleted, the app always asks you first.</p>` },
  browse: { t: 'Browse data tab', html: `
<h3>What you see</h3><p>The rows of one table, like a spreadsheet. Each line is one thing, like one customer. Each column is one detail, like their city.</p>
<h3>Finding things</h3><ul><li><b>Search</b>: type a word and only rows with that word stay.</li><li><b>Filter</b>: press the <b>Filter</b> button above the table, or the little <b>funnel</b> next to any column name. Make a rule like "city <i>is</i> Accra" and every row that breaks the rule hides. <b>Clear all</b> brings them back.</li><li><b>Click a column name</b> to sort. Click again to flip the order.</li></ul>
<h3>Changing things</h3><ul><li><b>Double-click</b> a cell to change it. <b>Enter</b> saves, <b>Esc</b> cancels.</li><li><b>Add a row</b> gives you a form to fill in.</li><li><b>Right-click</b> a row to open it as a form.</li><li><b>Tick</b> rows, then press <b>Delete</b> to throw them away. It asks first.</li></ul>
<h3>Underlined numbers</h3><p>A number with a dotted underline is a <b>link</b> to a row in another table. For example, <code>customer_id 12</code> means "customer number 12". Hold Ctrl and click it to jump there.</p>
<h3>Taking data out</h3><p><b>CSV</b> or <b>Excel</b> saves the rows you can see (after search and filters) as a file.</p>` },
  builder: { t: 'Question builder', html: `
<h3>What it's for</h3><p>Asking the database a question, like "how much did each customer buy?", without typing code.</p>
<ol><li><b>Drag a table</b> from the left onto the board, or pick it from "+ Add a table".</li><li><b>Tick</b> the columns you want in the answer. Tick nothing to see everything.</li><li>Need two tables? Drag the second one on too. If they belong together, a line joins them by itself. If not, drag the <b>orange dot</b> from one column onto the matching column in the other table.</li><li>Add <b>rules</b> to keep only some rows.</li><li>Press <b>Get the answer</b>.</li></ol>
<h3>Counting and adding up</h3><p>Next to each ticked column you can choose <b>Show each value</b>, or squash many rows into one number with <b>Count</b>, <b>Add up</b> or <b>Average</b>. Columns left on "Show each value" become groups, so you get one line per group.</p>
<h3>More tricks</h3><ul><li><b>+ Calculation</b> makes a new number from two columns, like <i>quantity × unit_price</i>. Set it to <b>Add up</b> for total sales.</li><li>The first drop-down under a column changes the value: a date can become its <b>year</b>, <b>year and month</b> or <b>day of the week</b>; text can become CAPITALS or its first letter; numbers can be rounded.</li><li><b>Only groups where…</b> appears once you count or add up. It keeps only groups whose total passes your rule, like "total is at least 500".</li></ul>
<h3>Example: who bought the most?</h3><p>Drag <b>order_items</b>, <b>orders</b> and <b>customers</b>. Tick <i>company_name</i> and <i>quantity</i>. Set quantity to <b>Add up</b>. Sort by it, biggest first. Press <b>Get the answer</b>.</p>
<h3>"matches" or "keep all"?</h3><p>Click the little label on a join line. <b>matches</b> shows only things that have a partner in both tables. <b>keep all</b> also shows lonely ones, like customers who never ordered.</p>` },
  design: { t: 'Table design tab', html: `
<h3>What you see</h3><p>The <b>columns</b> of a table: the lines on every card. Each column holds one kind of thing.</p>
<h3>Kinds of things</h3><ul><li><b>Text</b>: words, like names. <b>Long text</b>: notes.</li><li><b>Whole number</b>: 1, 2, 3. <b>Decimal</b>: 2.5. <b>Money</b>: 19.99.</li><li><b>Yes/No</b>: true or false.</li><li><b>Date</b>: a day on the calendar.</li><li><b>Link to another table</b>: points at a row somewhere else.</li></ul>
<h3>The little tags</h3><ul><li><b>ID</b>: every row's own number, like a name tag.</li><li><b>required</b>: can't be left empty.</li><li><b>unique</b>: no two rows can be the same.</li><li><b>→ table</b>: a link to another table.</li></ul>
<h3>Making a new table</h3><p>Press <b>Create a new table</b>, give it a name, add columns. You can start from a ready-made template like <i>Contacts</i> or <i>Tasks</i>.</p>` },
  sql: { t: 'SQL editor', html: `
<h3>You don't need this</h3><p>Everything can be done with the other tabs. This one is for typing <b>SQL</b>, the database's own language, if you are curious.</p>
<h3>The simplest sentence</h3><p><code>SELECT * FROM customers</code> means "show me everything from the customers box".</p>
<h3>The function library</h3><p>On the right are more than 130 ready-made pieces of SQL in 16 groups: filtering, totals, joins, text, numbers, dates, CASE, window functions, changing data, table design and more. Each one says in plain words what it does. Press <b>Try it</b> to run the example on your data, or <b>Insert</b> to put it in the editor. The examples are written for the kind of database you are using.</p>
<h3>Help while typing</h3><p>Start typing a table, column or SQL word and suggestions pop up. Use the arrow keys and press <b>Tab</b> or <b>Enter</b> to pick one.</p>
<h3>More</h3><ul><li><b>Save</b> keeps a query under a name. <b>Saved</b> opens it again.</li><li><b>How will it run?</b> shows the database's plan, with tips when it could be faster.</li><li>Results that fit a chart get a <b>Chart</b> button.</li><li>If it goes wrong, press <b>Fix it with AI</b>.</li><li><b>Ctrl+Enter</b> runs it.</li></ul>` },
  learn: { t: 'Learn SQL', html: `
<h3>What this is</h3><p>A full SQL course inside the app: ${LESSONS.length} short lessons in 10 levels, from "what is a table?" to window functions, speed and security.</p>
<h3>How each lesson works</h3><ol><li>A simple picture of the idea.</li><li>What it is and when you would use it.</li><li><b>Where to find it in Tablewise</b>: press <b>Show me</b> and the app takes you there and circles the button.</li><li>Examples: press <b>Run</b>.</li><li><b>Your turn</b>: type SQL and press <b>Check my answer</b>. Stuck? Press <b>Hint</b>.</li></ol>
<h3>You cannot break anything</h3><p>Lessons run on a private practice copy of the Northwind data. <b>Reset practice data</b> gives you a fresh one.</p>` },
  import: { t: 'Import a file tab', html: `
<h3>Bring in a spreadsheet</h3><ol><li>Save your spreadsheet as <b>CSV</b> or <b>Excel</b>. The <b>first row</b> must be the column names.</li><li>Drop the file on the big box.</li><li>Check each column's kind of data, then press <b>Import</b>.</li></ol>
<h3>Open a database file</h3><p>Files ending in <code>.sqlite</code> or <code>.db</code> open as a whole database.</p>
<h3>All or nothing</h3><p>If one row has a problem, nothing is added, so you never end up with half a file.</p>` },
  activity: { t: 'Change history tab', html: `<p>A diary of everything that was changed, newest first. Each entry shows the exact instruction that was sent to the database.</p><p><b>Undo last change</b> steps back one change at a time.</p>` },
  connect: { t: 'Open a database', html: `<h3>Database files</h3><p>A whole database can live in one file, like a document. Open one, make a new one, or save a copy.</p><h3>Company servers</h3><p>Big companies keep their database on a server (PostgreSQL, MySQL, SQL Server). The desktop app can connect to those. Ask your IT team for the address and a login.</p>` },
  settings: { t: 'Settings', html: `<p><b>Read-only mode</b> means look but don't touch: nothing can be changed.</p><p><b>AI assistant</b> lets you choose what the AI may see.</p>` }
};
const WORDS = [
  ['Database', 'A toy chest that holds all your boxes of information.'],
  ['Table', 'One box in the chest, holding one kind of thing, like customers.'],
  ['Row', 'One card in the box: one customer, one order.'],
  ['Column', 'One line that every card has, like "name" or "price".'],
  ['Cell', 'The spot where one row and one column meet. It holds one piece of information.'],
  ['ID (primary key)', 'Every row\'s own number, like a name tag. No two are the same.'],
  ['Link (foreign key)', 'A column that holds another row\'s ID, so you know which one it belongs to. <code>orders.customer_id</code> says which customer placed the order.'],
  ['Query', 'A question you ask the database, like "which orders are over 500?"'],
  ['Filter', 'A rule that hides the rows you don\'t want.'],
  ['Sort', 'Putting rows in order: small to big, or A to Z.'],
  ['Join', 'Putting two tables side by side by matching their links.'],
  ['Group', 'Putting rows into piles by a value (like by city) so you can count each pile.'],
  ['Count / Sum / Average', 'Ways to squash many rows into one number: how many, all added up, or the middle amount.'],
  ['Empty (NULL)', 'Nothing written there at all. Not the same as 0.'],
  ['Saved view', 'A saved question that looks like a table and always shows the latest answer.'],
  ['Index', 'A shortcut list that helps the database find things faster, like the index at the back of a book.'],
  ['SQL', 'The database\'s own language. This app speaks it for you.']
];

/* ---------- docking: resizable sidebar, and a helper panel that docks left/right or floats ---------- */
TW.dock = {
  setVar(k, v) { document.documentElement.style.setProperty(k, v); },
  init() {
    const g = $('#guide');
    this.setVar('--side-w', store.get('sideW', 256) + 'px');
    this.setVar('--guide-w', store.get('guideW', 360) + 'px');
    const fl = store.get('guideFloat', null);
    if (fl) { this.setVar('--gx', fl.x + 'px'); this.setVar('--gy', fl.y + 'px'); if (fl.h) this.setVar('--guide-h', fl.h + 'px'); }
    document.body.classList.toggle('side-collapsed', store.get('sideCollapsed', false));
    this.mode(store.get('guideMode', 'right'), true);
    this.drag($('#sideResizer'), x => { const r = $('#sidebar').getBoundingClientRect(); const w = Math.max(180, Math.min(520, x - r.left)); this.setVar('--side-w', w + 'px'); return w; }, w => store.set('sideW', w));
    this.drag($('#guideResizer'), x => {
      const r = g.getBoundingClientRect();
      const w = Math.max(260, Math.min(Math.round(innerWidth * .6), g.classList.contains('dock-left') ? x - r.left : r.right - x));
      this.setVar('--guide-w', w + 'px'); return w;
    }, w => store.set('guideW', w));
    $('#dockLeft').onclick = () => this.mode('left');
    $('#dockRight').onclick = () => this.mode('right');
    $('#dockFloat').onclick = () => this.mode(g.classList.contains('float') ? store.get('guideDock', 'right') : 'float');
    // move the floating window by its header
    $('#guideHead').addEventListener('pointerdown', e => {
      if (!g.classList.contains('float') || e.target.closest('button')) return;
      e.preventDefault();
      const r = g.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      const mv = ev => { const x = Math.max(0, Math.min(innerWidth - 120, ev.clientX - dx)), y = Math.max(0, Math.min(innerHeight - 60, ev.clientY - dy)); this.setVar('--gx', x + 'px'); this.setVar('--gy', y + 'px'); };
      const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); const r2 = g.getBoundingClientRect(); store.set('guideFloat', { x: Math.round(r2.left), y: Math.round(r2.top), h: Math.round(r2.height) }); store.set('guideW', Math.round(r2.width)); this.setVar('--guide-w', Math.round(r2.width) + 'px'); };
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
    // remember the size after the floating window is resized from its corner
    if (window.ResizeObserver) { let t; new ResizeObserver(() => { if (!g.classList.contains('float') || g.hidden) return; clearTimeout(t); t = setTimeout(() => { const r = g.getBoundingClientRect(); if (!r.width) return; store.set('guideW', Math.round(r.width)); const f = store.get('guideFloat', {}) || {}; store.set('guideFloat', { ...f, x: Math.round(r.left), y: Math.round(r.top), h: Math.round(r.height) }); }, 300); }).observe(g); }
  },
  mode(m, quiet) {
    const g = $('#guide');
    g.classList.toggle('dock-left', m === 'left');
    g.classList.toggle('float', m === 'float');
    if (m === 'float') {
      g.style.width = ''; g.style.height = '';
      if (!store.get('guideFloat', null)) { const w = store.get('guideW', 380); this.setVar('--gx', Math.max(16, innerWidth - w - 40) + 'px'); this.setVar('--gy', '80px'); }
    } else store.set('guideDock', m);
    store.set('guideMode', m);
    $('#dockLeft').classList.toggle('on', m === 'left'); $('#dockRight').classList.toggle('on', m === 'right'); $('#dockFloat').classList.toggle('on', m === 'float');
    $('#dockFloat').title = m === 'float' ? 'Dock it again' : 'Pop out as a floating window';
    if (!quiet) { if (g.hidden) TW.guide.open(); toast(m === 'float' ? 'The helper now floats. Drag its top bar to move it, and its bottom-right corner to resize.' : `The helper is docked on the ${m}. Drag its edge to make it wider or narrower.`); }
  },
  drag(handle, onMove, onEnd) {
    if (!handle) return;
    handle.addEventListener('pointerdown', e => {
      e.preventDefault(); handle.setPointerCapture(e.pointerId); handle.classList.add('drag'); document.body.classList.add('resizing');
      let last = null;
      const mv = ev => { last = onMove(ev.clientX); };
      const up = () => { handle.removeEventListener('pointermove', mv); handle.removeEventListener('pointerup', up); handle.classList.remove('drag'); document.body.classList.remove('resizing'); if (last !== null) onEnd(Math.round(last)); };
      handle.addEventListener('pointermove', mv); handle.addEventListener('pointerup', up);
    });
    handle.addEventListener('dblclick', () => { onEnd(handle.id === 'sideResizer' ? 256 : 360); this.setVar(handle.id === 'sideResizer' ? '--side-w' : '--guide-w', (handle.id === 'sideResizer' ? 256 : 360) + 'px'); });
  },
  toggleSidebar() {
    if (innerWidth <= 820) { $('#sidebar').classList.toggle('open'); return; }
    const c = !document.body.classList.contains('side-collapsed');
    document.body.classList.toggle('side-collapsed', c); store.set('sideCollapsed', c);
  }
};
TW.guide = {
  tab: 'guide',
  open(tab) { if (tab) this.tab = tab; $('#guide').hidden = false; store.set('guideOpen', true); this.render(); },
  close() { $('#guide').hidden = true; store.set('guideOpen', false); },
  toggle(tab) { const g = $('#guide'); if (!g.hidden && (!tab || tab === this.tab)) this.close(); else this.open(tab); },
  render() {
    $$('#guideTabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.gt === this.tab));
    const body = $('#guideBody');
    body.style.padding = this.tab === 'ai' ? '0' : '';
    if (this.tab === 'learn') {
      body.style.padding = '16px 18px 28px';
      const root = h('div'); body.replaceChildren(root);
      TW.views.learn(root, null, { compact: true });
      return;
    }
    if (this.tab === 'guide') {
      const g = GUIDES[TW.state.view] || GUIDES.home;
      body.innerHTML = `<p class="label" style="margin:0 0 8px">${esc(g.t)}</p>` + g.html;
      body.append(h('div', { style: { marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap' } }, h('button', { class: 'btn sm', onclick: () => TW.tour.start() }, 'Take the tour'), h('button', { class: 'btn sm', onclick: () => this.open('ai') }, icon('sparkle', 13), 'Ask the AI instead')));
    } else if (this.tab === 'words') {
      const course = [];
      if (typeof LESSONS !== 'undefined') for (const L of LESSONS) for (const [w, m] of (L.words || [])) course.push([w, m, L]);
      course.sort((a, b) => a[0].localeCompare(b[0]));
      body.innerHTML = '<p class="label" style="margin:0 0 4px">Database words, in plain English</p><dl class="gloss">' + WORDS.map(([w, d]) => `<dt>${esc(w)}</dt><dd>${d}</dd>`).join('') + '</dl>';
      if (course.length) body.append(h('p', { class: 'label', style: { margin: '22px 0 4px' } }, `Every word from the Learn SQL course (${course.length})`), h('dl', { class: 'gloss' }, course.flatMap(([w, m, L]) => [h('dt', null, w), h('dd', null, m, ' ', h('button', { class: 'linkbtn', style: { fontSize: '12px' }, onclick: () => go('learn', L.id) }, 'Lesson →'))])));
    } else TW.ai.renderChat(body);
  }
};

/* ---------- tour ---------- */
TW.tour = {
  steps: [
    { sel: '#tree', title: 'Your tables', text: 'This is like a folder tree. Every table is here with how many rows it has. Click the little arrow to peek at its columns. Click the name to open it.', view: 'home' },
    { sel: '#nav', title: 'The tabs', text: 'Each tab does one job: Browse data shows rows, Table design shows columns, Question builder finds answers, and so on.' },
    { sel: '#explainSw', title: 'Explain switch', text: 'Turn this on, then point at anything. A little bubble tells you what it is in simple words.' },
    { sel: '#dataGrid', title: 'Data like a spreadsheet', text: 'Click a heading to sort. Double-click a cell to edit. Right-click a row to open it as a form.', view: 'browse' },
    { sel: '#addFilterBtn', title: 'Filter', text: 'Press this to show only the rows you want, with a rule like "country is Ghana". Every column name also has a small funnel that does the same for that column.' },
    { sel: '#addRowBtn', title: 'Add data', text: 'Opens a form with the right kind of box for every column.' },
    { sel: '#qbCanvas', title: 'Question builder', text: 'Drag tables onto this board and tick what you want to see. Your question is written out in plain English before you run it.', view: 'builder' },
    { sel: '#aiBtn', title: 'Ask the AI', text: 'Type a question in everyday words. The AI writes the query and explains it. You run it with one click.' },
    { sel: '#guideBtn', title: 'Help on every screen', text: 'The Guide explains the screen you are on, and the Words tab explains database terms. You are ready to go.' }
  ],
  i: 0,
  async start() { this.i = 0; await this.show(); },
  end() { $$('.tour-ring,.tour-card').forEach(n => n.remove()); },
  async show() {
    this.end();
    const s = this.steps[this.i]; if (!s) return;
    if (s.view && TW.state.view !== s.view) await go(s.view, s.view === 'browse' ? (TW.state.tables.find(t => t.name === 'customers') || TW.state.tables[0] || {}).name : undefined);
    await new Promise(r => setTimeout(r, 120));
    const el = $(s.sel);
    if (window.innerWidth <= 820 && el && el.closest('#sidebar')) $('#sidebar').classList.add('open');
    const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2 - 100, top: innerHeight / 2 - 40, width: 200, height: 80 };
    const ring = h('div', { class: 'tour-ring', style: { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: Math.min(r.height, innerHeight - 40) + 12 + 'px' } });
    const card = h('div', { class: 'tour-card', role: 'dialog', 'aria-label': s.title },
      h('span', { class: 'label' }, `Step ${this.i + 1} of ${this.steps.length}`), h('h3', null, s.title), h('p', { class: 'muted', style: { fontSize: '13.5px' } }, s.text),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost sm', onclick: () => this.end() }, 'Skip tour'),
        h('div', { class: 'row' }, this.i ? h('button', { class: 'btn sm', onclick: () => { this.i--; this.show(); } }, 'Back') : null,
          h('button', { class: 'btn primary sm', onclick: () => { this.i++; if (this.i >= this.steps.length) { this.end(); $('#sidebar').classList.remove('open'); toast('Tour finished. Open the Guide any time for help.'); } else this.show(); } }, this.i === this.steps.length - 1 ? 'Finish' : 'Next'))));
    document.body.append(ring, card);
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let left = r.left + r.width + 16, top = r.top;
    if (left + cw > innerWidth - 16) { left = Math.max(16, Math.min(innerWidth - cw - 16, r.left)); top = r.top + Math.min(r.height, innerHeight * .5) + 18; }
    if (top + ch > innerHeight - 16) top = Math.max(16, r.top - ch - 18);
    card.style.left = left + 'px'; card.style.top = Math.max(16, top) + 'px';
  }
};

/* ---------- AI assistant ---------- */
TW.ai = {
  turns: [], busy: false, ctl: null,
  async ask(text) { TW.guide.open('ai'); await new Promise(r => setTimeout(r, 30)); this.send(text); },
  async schemaText(withSamples) {
    const lines = [];
    for (const t of TW.state.tables) {
      let s; try { s = await describe(t.name); } catch (e) { continue; }
      lines.push(`${t.type === 'view' ? 'VIEW' : 'TABLE'} ${t.name} (${t.count ?? '?'} rows)`);
      for (const c of s.columns) lines.push(`  - ${c.name} ${c.type || ''}${c.pk ? ' PRIMARY KEY' : ''}${c.notnull ? ' NOT NULL' : ''}${c.fk ? ` -> ${c.fk.table}.${c.fk.column}` : ''}`);
      if (withSamples) {
        try { const r = await TW.adapter.query(`SELECT * FROM ${qt(t.name)}` + pageClause(3, 0, false), []); lines.push('  sample rows: ' + JSON.stringify(r.rows.map(row => row.map(v => v instanceof Uint8Array ? '[binary]' : v)))); } catch (e) { }
      }
    }
    return lines.join('\n');
  },
  async rules() {
    const allowData = TW.state.sendSamples;
    return `You are the assistant inside Tablewise, a database manager built for people who do not know SQL.
The user's database engine is ${D().label}. Database name: ${TW.adapter.name}. Read-only mode: ${TW.state.readOnly ? 'ON (do not propose changes)' : 'off'}.
Schema:
${await this.schemaText(allowData)}

How to answer:
- Use plain, friendly English. Short sentences. Explain any database word you use.
- When a query helps, put it in ONE fenced block marked \`\`\`sql, valid for ${D().label}, using the exact table and column names above. Quote names only when needed.
- Say in one line what the query will show before the block. The user presses a Run button to execute it, so do not ask them to copy it.
- For changes (INSERT, UPDATE, DELETE, CREATE, ALTER, DROP) warn clearly what will change and always use a WHERE clause for UPDATE/DELETE.
- ${allowData && this.canTools ? 'You may call run_read_query to look at real data (read-only, max 50 rows) before answering. Give the actual answer in words when you can.' : 'You cannot see the data itself, only its structure.'}
- If the question cannot be answered from these tables, say so and suggest what data would be needed.
- If the user asks how to do something in the app, say which tab to use: Home, Browse data, Table design, Question builder, SQL editor, Learn SQL, Import a file, Change history, Settings (or the tree on the left). Explain simply, as if to a curious child, without being childish.`;
  },
  renderChat(body) {
    body.replaceChildren();
    const log = h('div', { class: 'chat-log', id: 'chatLog' });
    const ta = h('textarea', { id: 'chatInput', placeholder: 'Ask anything about your data…', 'aria-label': 'Message to the AI', rows: 2 });
    const send = h('button', { class: 'btn primary sm', id: 'chatSend', onclick: () => { const v = ta.value.trim(); if (v) { ta.value = ''; this.send(v); } } }, 'Send');
    const stop = h('button', { class: 'btn sm', id: 'chatStop', hidden: !this.busy, onclick: () => this.ctl && this.ctl.abort() }, 'Stop');
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send.click(); } });
    const tname = (TW.state.tables.find(t => t.name === 'customers') || TW.state.tables[0] || { name: 'my table' }).name;
    const sugg = h('div', { class: 'suggest' }, [`How many rows are in ${tname}?`, TW.state.tables.some(t => t.name === 'orders') ? 'Who are our top 5 customers by total spend?' : 'What tables do I have and what are they for?', 'How do I add a new column?', 'Explain how my tables connect'].map(s => h('button', { onclick: () => this.send(s) }, s)));
    const prov = h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '12px' } }, h('span', { class: 'faint', id: 'aiProv' }, this.providerLabel()), h('div', { class: 'row', style: { gap: '4px' } }, h('button', { class: 'btn ghost sm', onclick: () => { this.turns = []; this.renderChat(body); } }, 'New chat'), h('button', { class: 'btn ghost sm', onclick: () => go('settings') }, 'AI settings')));
    body.append(h('div', { class: 'chat' }, log, h('div', { class: 'chat-input' }, this.turns.length ? null : sugg, ta, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('label', { class: 'check', style: { fontSize: '12px' }, title: 'When on, the AI may read up to a few rows of real data to give better answers' }, h('input', { type: 'checkbox', checked: TW.state.sendSamples, onchange: e => { TW.state.sendSamples = e.target.checked; store.set('aiSamples', e.target.checked); } }), 'Let the AI look at data'), h('div', { class: 'row', style: { gap: '6px' } }, stop, send)), prov)));
    if (!this.turns.length) log.append(h('div', { class: 'msg ai' }, h('p', null, 'Ask me about your data in everyday words, like "which products are running low?" I will write the query, explain it, and you can run it with one click.'), h('p', { class: 'faint', style: { fontSize: '12px' } }, TW.state.sendSamples ? 'I can look at a few rows of your data to answer.' : 'I only see the names of your tables and columns, not the data, unless you tick "Let the AI look at data".')));
    for (const t of this.turns) log.append(this.bubble(t));
    log.scrollTop = log.scrollHeight;
  },
  providerLabel() { return DESK ? `AI: ${(this.settings && this.settings.provider) ? AI_PROVIDERS[this.settings.provider].label : 'not set up'}` : 'AI: Claude (uses your Claude account)'; },
  bubble(t) {
    if (t.role === 'user') return h('div', { class: 'msg user' }, t.content);
    const b = h('div', { class: 'msg ai' });
    this.fillAnswer(b, t.content, t.error);
    return b;
  },
  fillAnswer(b, text, error) {
    b.replaceChildren();
    if (error) { b.append(h('p', { style: { color: 'var(--bad)' } }, error)); if (!text) return; }
    const parts = String(text).split(/```(\w*)\n?([\s\S]*?)```/g);
    for (let i = 0; i < parts.length; i += 3) {
      if (parts[i] && parts[i].trim()) b.append(h('div', { html: miniMarkdown(parts[i]) }));
      if (i + 2 < parts.length) {
        const lang = parts[i + 1], code = parts[i + 2].trim();
        b.append(sqlBlock(code));
        if (!lang || /sql/i.test(lang)) b.append(this.sqlActions(code));
      }
    }
  },
  sqlActions(code) {
    const out = h('div');
    const write = isWrite(code);
    return h('div', null, h('div', { class: 'actions-row' },
      h('button', {
        class: 'btn sm ' + (write ? 'danger' : 'primary'), onclick: async () => {
          if (write && !(await confirmBox({ title: 'Run this change?', message: 'The AI suggested a change to your data. Check the SQL before you run it.', confirmLabel: 'Run it', danger: true, sql: code }))) return;
          out.replaceChildren(h('p', { class: 'faint' }, 'Running…'));
          try { const r = await run(code, [], { log: true, label: 'Suggested by the AI' }); out.replaceChildren(r.columns && r.columns.length ? h('div', { style: { marginTop: '8px' } }, h('div', { class: 'faint', style: { fontSize: '12px', marginBottom: '4px' } }, plural(r.rows.length, 'row')), resultGrid(r.columns, r.rows, { height: '260px', max: 200 })) : h('div', { class: 'notice good', style: { marginTop: '8px' } }, `Done. ${plural(r.changes || 0, 'row')} changed.`)); }
          catch (e) { out.replaceChildren(errorNotice(e), h('button', { class: 'btn sm', style: { marginTop: '6px' }, onclick: () => this.send(`That failed with: ${e.message}. Please fix the SQL.`) }, 'Ask the AI to fix it')); }
        }
      }, icon('play', 12), write ? 'Run change' : 'Run'),
      h('button', { class: 'btn sm', onclick: () => { TW.sqlDraft = code; go('sql'); } }, 'Open in SQL editor'),
      h('button', { class: 'btn sm ghost', onclick: () => { try { navigator.clipboard.writeText(code).then(() => toast('Copied.'), () => toast('Copy was blocked. Select the text instead.')); } catch (e) { } } }, 'Copy')), out);
  },
  async send(text) {
    if (this.busy) return;
    const log = $('#chatLog'); if (!log) { TW.guide.open('ai'); return this.send(text); }
    const sug = $('.chat-input .suggest'); if (sug) sug.remove();
    this.turns.push({ role: 'user', content: text });
    log.append(this.bubble({ role: 'user', content: text }));
    const b = h('div', { class: 'msg ai' }, h('p', { class: 'typing' }, 'Thinking…'));
    log.append(b); log.scrollTop = log.scrollHeight;
    this.busy = true; $('#chatStop') && ($('#chatStop').hidden = false); $('#chatSend') && ($('#chatSend').disabled = true);
    this.ctl = new AbortController();
    let answer = '', err = null;
    try {
      answer = DESK ? await this.askDesktop() : await this.askClaude(t => { this.fillAnswer(b, t); log.scrollTop = log.scrollHeight; });
    } catch (e) {
      err = aiErrorText(e); answer = e && e.text || '';
    }
    this.busy = false; $('#chatStop') && ($('#chatStop').hidden = true); $('#chatSend') && ($('#chatSend').disabled = false);
    if (answer || err) this.turns.push({ role: 'assistant', content: answer, error: err });
    this.fillAnswer(b, answer, err);
    if (!answer && !err) b.replaceChildren(h('p', { class: 'faint' }, 'Stopped.'));
    log.scrollTop = log.scrollHeight;
  },
  async askClaude(onText) {
    const sample = window.claude && window.claude.use ? await window.claude.use('sample') : null;
    if (!sample) throw { code: 'unavailable' };
    try { const lim = sample.limits ? await sample.limits() : {}; this.canTools = !!(lim && lim.tools); } catch (e) { this.canTools = false; }
    const rules = await this.rules();
    const history = this.turns.filter(t => t.content).slice(-12).map(t => ({ role: t.role, content: t.content }));
    if (history[0] && history[0].role === 'assistant') history.shift();
    const input = [{ role: 'user', content: rules + '\n\nReply "Ready." to confirm.' }, { role: 'assistant', content: 'Ready.' }, ...history];
    const opts = { signal: this.ctl.signal, onText: ({ text }) => onText(text) };
    if (TW.state.sendSamples && this.canTools) {
      opts.tools = [{
        name: 'run_read_query', description: `Runs one read-only SELECT on the user's ${D().label} database and returns up to 50 rows as {columns, rows}. Use it to look at real data before answering.`,
        inputSchema: { type: 'object', properties: { sql: { type: 'string', description: 'A single SELECT statement' } }, required: ['sql'] },
        async execute(inp) {
          const sql = String(inp.sql || '').trim().replace(/;\s*$/, '');
          if (!/^(select|with)\b/i.test(sql) || isWrite(sql) || /;/.test(sql)) throw new Error('Only a single SELECT is allowed.');
          const r = await TW.adapter.query(sql, []);
          TW.state.log.unshift({ at: new Date(), kind: 'read', sql, label: 'AI looked at data' });
          return { columns: r.columns, rows: r.rows.slice(0, 50).map(row => row.map(v => v instanceof Uint8Array ? '[binary]' : v)), totalRows: r.rows.length };
        }
      }];
    } else opts.cache = false;
    const r = await sample(input, opts);
    return r.text;
  },
  async askDesktop() {
    this.settings = await DESK.getAISettings();
    if (!this.settings || !this.settings.provider) throw { code: 'not_setup' };
    this.canTools = false;
    const system = await this.rules();
    const messages = this.turns.filter(t => t.content).slice(-12).map(t => ({ role: t.role, content: t.content }));
    return await DESK.aiChat({ system, messages });
  },
  async renderSettings(box) {
    box.replaceChildren(h('h2', null, 'AI assistant'));
    const dataToggle = h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: TW.state.sendSamples, onchange: e => { TW.state.sendSamples = e.target.checked; store.set('aiSamples', e.target.checked); } }), h('span', null, h('b', null, 'Let the AI look at data. '), 'Off: the AI only sees table and column names. On: it also sees a few example rows', DESK ? '' : ' and may run read-only questions to find answers', '. Leave this off for sensitive data.'));
    if (!DESK) {
      box.append(h('p', null, 'In this browser version the assistant is ', h('b', null, 'Claude'), ', running on the Claude account of whoever is using the page. There is nothing to set up. The first question asks for permission.'), dataToggle,
        h('p', { class: 'muted', style: { fontSize: '13px' } }, 'The Windows desktop app lets you choose Claude, ChatGPT, Google Gemini, GitHub Models (the model family behind Copilot) or a local AI such as Ollama.'));
      return;
    }
    const s = this.settings = await DESK.getAISettings() || {};
    const provSel = h('select', { class: 'select', id: 'aiProvider' }, h('option', { value: '' }, 'Choose…'), Object.entries(AI_PROVIDERS).map(([k, p]) => h('option', { value: k, selected: s.provider === k }, p.label)));
    const keyIn = h('input', { class: 'input', id: 'aiKey', type: 'password', autocomplete: 'off', placeholder: s.hasKey ? 'Saved (leave blank to keep)' : '' });
    const modelIn = h('input', { class: 'input', id: 'aiModel', value: s.model || '', list: 'aiModelList' });
    const modelList = h('datalist', { id: 'aiModelList' });
    const urlIn = h('input', { class: 'input', id: 'aiUrl', value: s.baseUrl || '', placeholder: 'http://localhost:11434/v1' });
    const help = h('p', { class: 'faint', style: { fontSize: '12.5px' } });
    const urlField = h('label', { class: 'field' }, h('span', null, 'Server address'), urlIn, h('span', { class: 'hint' }, 'Any OpenAI-compatible server: Ollama, LM Studio, Azure OpenAI, OpenRouter.'));
    const status = h('div');
    const upd = () => { const p = AI_PROVIDERS[provSel.value]; urlField.hidden = provSel.value !== 'custom'; help.innerHTML = p ? p.help : ''; if (p && !modelIn.value) modelIn.value = p.model; };
    provSel.onchange = () => { modelIn.value = ''; upd(); };
    upd();
    const collect = () => ({ provider: provSel.value, apiKey: keyIn.value, model: modelIn.value.trim(), baseUrl: urlIn.value.trim() });
    box.append(h('label', { class: 'field' }, h('span', null, 'Which AI'), provSel), help,
      h('label', { class: 'field' }, h('span', null, 'API key or token'), keyIn, h('span', { class: 'hint' }, 'Stored encrypted on this computer with Windows data protection.')),
      urlField,
      h('label', { class: 'field' }, h('span', null, 'Model'), h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, h('div', { style: { flex: 1, display: 'flex' } }, modelIn), h('button', { class: 'btn sm', onclick: async () => { status.replaceChildren(h('p', { class: 'faint' }, 'Loading models…')); try { await DESK.saveAISettings(collect()); keyIn.value = ''; const ms = await DESK.aiModels(); modelList.replaceChildren(...ms.map(m => h('option', { value: m }))); status.replaceChildren(h('div', { class: 'notice good' }, `${ms.length} models found. Click the Model box to pick one.`)); } catch (e) { status.replaceChildren(h('div', { class: 'notice bad' }, aiErrorText(e))); } } }, 'Load list')), modelList),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => { await DESK.saveAISettings(collect()); keyIn.value = ''; this.settings = await DESK.getAISettings(); keyIn.placeholder = this.settings.hasKey ? 'Saved (leave blank to keep)' : ''; status.replaceChildren(h('div', { class: 'notice good' }, 'Saved.')); } }, 'Save'),
        h('button', { class: 'btn', onclick: async () => { await DESK.saveAISettings(collect()); keyIn.value = ''; status.replaceChildren(h('p', { class: 'faint' }, 'Asking the AI to say hello…')); try { const t = await DESK.aiChat({ system: 'Reply with one short friendly sentence.', messages: [{ role: 'user', content: 'Say hello to a new Tablewise user.' }] }); status.replaceChildren(h('div', { class: 'notice good' }, 'It works: ' + t)); } catch (e) { status.replaceChildren(h('div', { class: 'notice bad' }, aiErrorText(e))); } } }, 'Test')),
      status, dataToggle);
  }
};
const AI_PROVIDERS = {
  anthropic: { label: 'Claude (Anthropic)', model: 'claude-sonnet-4-5', help: 'Get a key at <b>console.anthropic.com</b> → API Keys.' },
  openai: { label: 'ChatGPT (OpenAI)', model: 'gpt-4.1-mini', help: 'Get a key at <b>platform.openai.com</b> → API keys.' },
  gemini: { label: 'Google Gemini', model: 'gemini-2.5-flash', help: 'Get a key at <b>aistudio.google.com</b> → Get API key.' },
  github: { label: 'GitHub Models (Copilot family)', model: 'openai/gpt-4.1', help: 'Uses your GitHub account. Create a fine-grained personal access token at <b>github.com/settings/tokens</b> with the <b>Models: read</b> permission. Many models are free to try with rate limits.' },
  custom: { label: 'Local or custom (Ollama, LM Studio, Azure…)', model: 'llama3.1', help: 'For a private AI on your own machine, install <b>Ollama</b>, run <code>ollama pull llama3.1</code>, and use the address http://localhost:11434/v1. No key needed.' }
};
function aiErrorText(e) {
  const c = e && e.code;
  if (c === 'unavailable' || c === 'not_granted') return 'The AI is not available here. When this page is opened on claude.ai, allow it to use Claude when asked. Otherwise use the desktop app.';
  if (c === 'not_setup') return 'Choose an AI in Settings → AI assistant first.';
  if (c === 'rate_limited') return 'Too many questions at once. Wait a moment and try again.';
  if (c === 'cancelled') return '';
  return (e && e.message) || 'The AI could not answer.';
}
function miniMarkdown(s) {
  let x = esc(s.trim());
  x = x.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|\s)\*([^*\n]+)\*/g, '$1<i>$2</i>');
  const lines = x.split('\n'); let html = '', list = null;
  for (const l of lines) {
    const m = l.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)/);
    if (m) { const t = m[1] ? 'ol' : 'ul'; if (list !== t) { if (list) html += `</${list}>`; html += `<${t} style="margin:4px 0;padding-left:18px">`; list = t; } html += `<li>${m[2]}</li>`; continue; }
    if (list) { html += `</${list}>`; list = null; }
    if (/^#{1,4}\s/.test(l)) html += `<p><b>${l.replace(/^#+\s/, '')}</b></p>`;
    else if (l.trim()) html += `<p>${l}</p>`;
  }
  if (list) html += `</${list}>`;
  return html;
}
