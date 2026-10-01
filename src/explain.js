/*
 * Tablewise — explain.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Explain mode: point at anything to get a very simple explanation */
const X = {
  'tab-home': ['Home', 'The front page. It shows every table and how many rows each one has, like counting the toys in each box.'],
  'tab-browse': ['Browse data', 'Look inside a table. It looks like a spreadsheet: every line is one thing, like one customer.'],
  'tab-design': ['Table design', 'Shows the columns of a table and what kind of stuff goes in each one, like the labels on a set of boxes.'],
  'tab-builder': ['Question builder', 'Ask the database a question without typing code. Drag tables in, tick what you want to see, press the button.'],
  'tab-sql': ['SQL editor', 'Expert mode, where you type the database\'s own language. You never have to use this.'],
  'tab-learn': ['Learn SQL', 'A full course from zero to expert. Every idea explained simply, with where to find it in the app and little tasks that are checked for you.'],
  'tab-import': ['Import a file', 'Bring in a spreadsheet (CSV or Excel) and turn it into a table.'],
  'tab-activity': ['Change history', 'A diary of every change you made, so you can see what happened and when.'],
  'tab-settings': ['Settings', 'Switches for safety (read-only), colours and the AI helper.'],
  'tree-db': ['Your database', 'The big toy chest that holds all your tables. Click it to go back to the Home screen.'],
  'tree-tables': ['Tables', 'All your tables. A table is like a box of cards, and each card is one row.'],
  'tree-views': ['Saved views', 'Questions you saved. They look like tables and always show the latest answer.'],
  'tree-table': ['A table', 'Click the name to see its rows. Click the little arrow to peek at its columns. Drag it into the Question builder to ask about it. The number is how many rows it has.'],
  'tree-pk': ['ID column (key)', 'Every row gets its own number here, like a name tag. No two rows can have the same one.'],
  'tree-fk': ['Link column', 'This points to a row in another table, like writing down your friend\'s locker number so you can find them.'],
  'tree-col': ['Column', 'One kind of information that every row has, like "name" or "price". The note on the right says what kind: abc = words, 123 = numbers.'],
  'explain': ['Explain switch', 'While this is on, point at anything and a bubble like this one tells you what it does. Turn it off when you know your way around.'],
  'dock-left': ['Dock on the left', 'Moves the helper panel to the left side of the screen.'],
  'dock-right': ['Dock on the right', 'Moves the helper panel to the right side of the screen.'],
  'dock-float': ['Pop out', 'Turns the helper into a floating window you can drag anywhere and resize from its corner. Press again to dock it back.'],
  'resizer': ['Resize', 'Drag this edge to make the panel wider or narrower. Double-click to reset.'],
  'menu': ['Side panel', 'Shows or hides the list of tables on the left, to give the main screen more room.'],
  'guide': ['Guide', 'Opens a helper on the right with simple steps for the screen you are on, plus a list of database words.'],
  'ai': ['Ask AI', 'Type a question in normal words, like "who bought the most?". The AI works out how to ask the database, and you press Run.'],
  'tour': ['Tour', 'A short walk-through that points at the important parts one by one.'],
  'undo': ['Undo', 'The oops button. It puts things back the way they were before your last change.'],
  'conn': ['Which database', 'The name of the database you are using. Click to open a different one or start a new one.'],
  'refresh': ['Refresh', 'Reloads the list, in case something changed.'],
  'findtable': ['Find a table', 'Type part of a name to find a table quickly.'],
  'search': ['Search', 'Type a word and only the rows that contain it stay on screen.'],
  'addfilter': ['Filter', 'Hide the rows you do not want by making a rule, like "city is Accra". You can also click the little funnel next to any column name.'],
  'colfilter': ['Filter this column', 'Click the little funnel to hide rows you do not want, using only this column. Example: on city, keep only Accra.'],
  'rule': ['A rule', 'Pick a column, how to compare, and a value. Rows that break the rule are hidden. The x removes the rule.'],
  'addrow': ['Add a row', 'Adds a new line to the table, like writing a new card and putting it in the box.'],
  'delsel': ['Delete', 'Throws away the rows you ticked. It asks you first, so nothing disappears by accident.'],
  'csv': ['CSV', 'Saves these rows as a simple file that Excel and Google Sheets can open.'],
  'xlsx': ['Excel', 'Saves these rows as an Excel file.'],
  'showsql': ['Show SQL', 'Shows the code the app sends to the database. Only for the curious.'],
  'th': ['Column heading', 'The name of this column. Click once to sort small → big (A → Z), twice for big → small, three times to go back.'],
  'cell': ['A cell', 'One piece of information. Double-click it to change it, then press Enter to save or Esc to cancel. Right-click the row to open it as a form.'],
  'fkcell': ['A link', 'This number points to a row in another table. Hold Ctrl and click to jump there.'],
  'rowcheck': ['Tick box', 'Tick rows to choose them. Then you can delete them together.'],
  'pill-pk': ['ID', 'This column is the name tag of each row. Every row has a different one.'],
  'pill-fk': ['Link', 'This column points to another table. The arrow shows which one.'],
  'pill-req': ['Required', 'This cannot be left empty, like a form that needs your name.'],
  'pill-uni': ['No duplicates', 'No two rows can have the same value here, like two people cannot share one email address.'],
  'pager': ['Pages', 'Big tables are split into pages so they load fast. Use Next and Previous to flip through.'],
  'qb-canvas': ['The board', 'Drop tables here. Tick the columns you want to see. To join two tables, drag the orange dot of one column onto the matching column of the other.'],
  'qb-port': ['Orange dot', 'Drag this onto a matching column in another table to join them, like hooking two train cars together.'],
  'qb-link': ['Join label', '"matches" shows only rows that have a partner in both tables. "keep all" also keeps rows with no partner. Click to switch. The x removes the join.'],
  'qb-card': ['Table card', 'Drag this bar to move the card. The + ticks every column. The x takes the table off the board.'],
  'qb-col': ['Column on the board', 'Tick it to show this column in the answer.'],
  'qb-agg': ['Show or summarise', '"Show each value" lists things. Count, Add up, Average, Smallest and Largest squash many rows into one number, one per group.'],
  'qb-english': ['Your question in words', 'This is what you are asking, written in plain English so you can check it before you press the button.'],
  'qb-run': ['Get the answer', 'Asks the database your question and shows the answer underneath.'],
  'qb-calc': ['Calculation', 'Make a new number from two columns, like quantity × price = money for each line. Then choose Add up to get the total.'],
  'qb-fn': ['Change the value', 'Turn a value into something handier before using it: a date into its year or month, text into capitals, a number rounded.'],
  'qb-having': ['Only groups where', 'After making groups and totals, keep only the groups you want, like customers who spent at least 500.'],
  'qb-count': ['Count rows', 'Adds "how many?" to the answer. Good for questions like "how many orders does each customer have?"'],
  'qb-sort': ['Sort', 'Choose the order of the answer: smallest first or biggest first.'],
  'qb-save': ['Save', 'Keeps this for later, so you do not have to build it again.'],
  'qb-reset': ['Start over', 'Clears the board so you can ask something new.'],
  'chart': ['Chart', 'A picture of the answer. A longer bar means a bigger number.'],
  'create-table': ['New table', 'Makes a brand-new empty box for a new kind of thing, like "suppliers".'],
  'add-col': ['Add a column', 'Adds a new kind of information to every row, like adding a "phone number" line to every card.'],
  'rename': ['Rename', 'Gives it a new name. The information inside stays the same.'],
  'speed': ['Make searching faster', 'Makes searching and sorting this column faster, like adding an index at the back of a book.'],
  'remove-col': ['Remove', 'Deletes this column and everything written in it, for every row. It asks first.'],
  'drop-table': ['Delete table', 'Throws away the whole table and all its rows. You must type its name to be sure.'],
  'empty-table': ['Empty table', 'Removes every row but keeps the table and its columns, like emptying a box but keeping the box.'],
  'sql-editor': ['SQL box', 'Type database language here and press Ctrl+Enter to run it.'],
  'sql-run': ['Run', 'Sends what you typed to the database and shows what comes back.'],
  'dropzone': ['Drop zone', 'Drag a file from your computer onto here, or click to choose one.'],
  'readonly': ['Read-only mode', 'Look but don\'t touch. While this is on, nothing can be changed or deleted.'],
  'ai-data': ['Let the AI look at data', 'Off: the AI only knows the names of your tables and columns. On: it can also look at a few rows to give better answers.'],
  'form-field': ['Form box', 'Fill this in. The small grey text under it says what kind of thing to type.']
};
const X_SEL = [
  ['#explainSw', 'explain'], ['#dockLeft', 'dock-left'], ['#dockRight', 'dock-right'], ['#dockFloat', 'dock-float'], ['.resizer', 'resizer'], ['#menuBtn', 'menu'], ['#guideBtn', 'guide'], ['#aiBtn', 'ai'], ['#tourBtn', 'tour'], ['#undoBtn', 'undo'], ['#connPill', 'conn'],
  ['#refreshTree', 'refresh'], ['#tableSearch', 'findtable'], ['#newTableSide', 'create-table'], ['#createTableBtn', 'create-table'],
  ['#browseSearch', 'search'], ['#addFilterBtn', 'addfilter'], ['#addRowBtn', 'addrow'], ['#delSelBtn', 'delsel'],
  ['.grid .ck', 'rowcheck'], ['.pill.pk', 'pill-pk'], ['.pill.fk', 'pill-fk'], ['.pill.req', 'pill-req'], ['.pill.uni', 'pill-uni'],
  ['#dataGrid td.fk', 'fkcell'], ['#dataGrid td', 'cell'], ['#dataGrid th', 'th'], ['.grid-foot', 'pager'],
  ['.tcard li .port', 'qb-port'], ['.jbadge', 'qb-link'], ['.tcard header', 'qb-card'], ['.tcard li', 'qb-col'], ['.colrow', 'qb-agg'],
  ['.english', 'qb-english'], ['#qbRun', 'qb-run'], ['.frule', 'rule'], ['#qbCanvas', 'qb-canvas'], ['.bar-chart', 'chart'],
  ['#sqlEditor', 'sql-editor'], ['#sqlRun', 'sql-run'], ['.dropzone', 'dropzone'], ['.check:has(#setRO)', 'readonly'],
  ['.modal .field', 'form-field']
];
const X_TEXT = { 'CSV': 'csv', 'Excel': 'xlsx', 'Show SQL': 'showsql', 'Hide SQL': 'showsql', 'Add a column': 'add-col', 'Rename': 'rename', 'Rename table': 'rename', 'Make searching faster': 'speed', 'Remove': 'remove-col', 'Delete table': 'drop-table', 'Empty table': 'empty-table', '+ Count rows': 'qb-count', '+ Sort by': 'qb-sort', 'Save': 'qb-save', 'Start over': 'qb-reset', 'Let the AI look at data': 'ai-data' };

TW.explain = {
  on: false, cur: null, tapped: null,
  init() {
    const t = $('#explainToggle');
    this.set(store.get('explain', true));
    t.onchange = () => { this.set(t.checked); toast(t.checked ? 'Explain is on. Point at anything to learn what it does.' : 'Explain is off.'); };
    document.addEventListener('mouseover', e => { if (this.on && e.pointerType !== 'touch') this.show(e.target, e.clientX, e.clientY); });
    document.addEventListener('mousemove', e => { if (this.on && this.cur) this.place(e.clientX, e.clientY); });
    document.addEventListener('mouseleave', () => this.hide());
    document.addEventListener('scroll', () => this.hide(), true);
    // touch: first tap explains, second tap acts
    document.addEventListener('click', e => {
      if (!this.on || !this._touch) return;
      const hit = this.find(e.target);
      if (hit && hit.el !== this.tapped && !hit.el.closest('#explainSw')) { e.preventDefault(); e.stopPropagation(); this.tapped = hit.el; const r = hit.el.getBoundingClientRect(); this.show(e.target, r.left + r.width / 2, r.bottom); }
      else { this.tapped = null; this.hide(); }
    }, true);
    document.addEventListener('pointerdown', e => { this._touch = e.pointerType === 'touch'; }, true);
  },
  set(v) { this.on = !!v; store.set('explain', this.on); $('#explainToggle').checked = this.on; document.body.classList.toggle('explain', this.on); if (!v) this.hide(); },
  find(el) {
    for (let n = el, d = 0; n && n !== document.body && d < 7; n = n.parentElement, d++) {
      if (n.id === 'xtip') return null;
      if (n.dataset && n.dataset.x && X[n.dataset.x]) return { el: n, key: n.dataset.x };
      for (const [sel, key] of X_SEL) { try { if (n.matches(sel)) return { el: n, key }; } catch (e) { } }
      if ((n.tagName === 'BUTTON' || n.tagName === 'LABEL') && X_TEXT[n.textContent.trim()]) return { el: n, key: X_TEXT[n.textContent.trim()] };
    }
    return null;
  },
  show(target, x, y) {
    const hit = this.find(target);
    if (!hit) { this.hide(); return; }
    if (this.cur !== hit.el) {
      if (this.cur) this.cur.classList.remove('x-hl');
      this.cur = hit.el; hit.el.classList.add('x-hl');
      const [title, text] = X[hit.key];
      const tip = $('#xtip'); tip.replaceChildren(h('b', null, title), text); tip.hidden = false;
    }
    this.place(x, y);
  },
  place(x, y) {
    const tip = $('#xtip'); if (tip.hidden) return;
    const w = tip.offsetWidth, hgt = tip.offsetHeight;
    let left = x + 16, top = y + 18;
    if (left + w > innerWidth - 12) left = Math.max(12, x - w - 12);
    if (top + hgt > innerHeight - 12) top = Math.max(12, y - hgt - 14);
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  },
  hide() { if (this.cur) this.cur.classList.remove('x-hl'); this.cur = null; const t = $('#xtip'); if (t) t.hidden = true; }
};
