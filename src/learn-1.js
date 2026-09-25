/* Learn SQL — part 1: foundations, SELECT, WHERE.
   Rule for every lesson: a word is explained before (or where) it is first used. */
const LEVELS = [
  ['f', '1. Foundations', 'What data, databases and SQL are, and how to run your first query. No experience needed.'],
  ['s', '2. Asking for data', 'SELECT: choosing columns, renaming, simple maths, removing repeats, sorting and limiting.'],
  ['w', '3. Filtering rows', 'WHERE and everything that goes with it: comparisons, AND/OR, lists, ranges, patterns and empty values.'],
  ['g', '4. Totals and groups', 'Counting, adding up, averages, groups, and filtering groups.'],
  ['v', '5. Working with values', 'Functions for numbers, text and dates, IF-style rules, empty values and types.'],
  ['j', '6. Connecting tables', 'Keys, relationships and every kind of JOIN.'],
  ['c', '7. Changing data', 'Adding, changing and deleting rows safely, and transactions.'],
  ['d', '8. Designing databases', 'Creating tables, types, rules, links, good design, indexes and views.'],
  ['a', '9. Advanced queries', 'Subqueries, WITH, set operations, window functions, pivots and duplicates.'],
  ['p', '10. Working like a professional', 'Speed, NULL traps, security, permissions, backups, other databases and a full project.']
];
const LESSONS = [];

/* ================= 1. FOUNDATIONS ================= */
LESSONS.push({
  lv: 'f', id: 'data', t: 'What is data?',
  goal: 'Understand what "data" means and why people store it.',
  story: 'Every time you buy bread, the shop could write down: what you bought, how many, the price and the date. Each of those little facts is a piece of data. Written down neatly, you can later answer questions like "how much bread did we sell last week?"',
  words: [['Data', 'Facts written down: names, numbers, dates, yes/no answers.'], ['Record', 'All the facts about one thing, like one sale or one customer.']],
  body: 'Data is just **information that has been written down** so it can be used again.\n\nExamples you already know:\n- A school register: each child\'s name, class and whether they came today.\n- A phone\'s contact list: name, number, email.\n- A shop receipt: products, quantities, prices, date.\n\nData is only useful when it is **organised**. A pile of receipts in a box holds the answers, but finding them is slow. If the same facts are written in neat lists with the same headings every time, a computer can search, count and add them up in a blink, even when there are millions.',
  when: 'Any business, school, hospital, charity or app keeps data: customers, stock, money in and out, staff, bookings, marks, appointments.',
  how: ["Look at something you already use (a receipt, a register, a contact list).", "Ask: what is the \"thing\" being recorded? (a sale, a pupil, a contact)", "List the facts written about each thing (name, date, amount).", "Notice that every thing has the same list of facts. That repeating pattern is what makes it data a computer can use."],
  app: [['The practice company "Northwind Supply Co." is already filled with pretend data. The Home screen shows how much there is.', 'home']],
  quiz: [['Which of these is data?', ['The price of a loaf of bread on a receipt', 'The feeling of being hungry', 'The smell of bread'], 0, 'A price is a fact that has been written down. Feelings and smells are not written down facts.'],
    ['Why organise data in neat lists?', ['It looks prettier', 'So a computer can search, count and add it up quickly', 'Because the law says so'], 1, 'Neat, consistent lists are what make fast questions possible.']],
  recap: ['Data = facts written down.', 'All the facts about one thing make a record.', 'Organised data can be searched and counted quickly.']
});
LESSONS.push({
  lv: 'f', id: 'database', t: 'What is a database?',
  goal: 'Know what a database is and why companies use one instead of a spreadsheet.',
  story: 'Imagine a big toy chest. Inside are separate boxes: one for cars, one for dolls, one for blocks. The chest is the database. The boxes are tables. The toys are the records.',
  words: [['Database', 'A organised store of data, usually made of several tables, kept by special software.'], ['Database software (DBMS)', 'The program that keeps the database safe and answers questions about it: SQLite, PostgreSQL, MySQL, SQL Server, Oracle.']],
  body: 'A **database** is an organised collection of data that a computer program looks after. That program is called a **database management system**, or DBMS for short.\n\n**Why not just use a spreadsheet?** Spreadsheets are great for small lists. Databases win when:\n- **There is a lot of data.** Millions of rows are normal.\n- **Many people use it at once.** Hundreds of staff and apps can read and write at the same time without overwriting each other.\n- **Rules are needed.** The database can refuse a price that is text, a missing name, or an order for a customer who does not exist.\n- **Lists must link together.** Orders point to customers, customers point to cities, and nothing is typed twice.\n- **Nothing may be lost.** Databases are built to survive crashes and power cuts, and can be backed up.\n\nAlmost every app you use (banking, shopping, social media, school systems) has a database behind it.',
  when: 'When a spreadsheet becomes too big, is shared by many people, needs rules, or needs to link to other lists.',
  how: ["Decide what things you need to keep track of (customers, products, orders).", "Give each kind of thing its own list (table).", "Decide which facts to keep about each thing (columns).", "Decide how the lists connect (an order belongs to a customer).", "Put it in database software so many people can use it safely, with rules and backups."],
  app: [['Tablewise is a database tool. The name at the top shows which database you are connected to.', 'home', null, '#connPill'], ['Open a database screen: open another database or connect to a company server.', 'connect']],
  quiz: [['In the toy-chest picture, what is the database?', ['A single toy', 'One box', 'The whole chest'], 2, 'The chest holds all the boxes, just like a database holds all the tables.'],
    ['Which is NOT a reason to use a database instead of a spreadsheet?', ['Many people need to use it at once', 'You want coloured cells', 'You need rules that stop bad data'], 1, 'Colour is a spreadsheet feature. Databases are about size, sharing, rules, links and safety.']],
  recap: ['A database is organised data looked after by database software (a DBMS).', 'It handles huge amounts of data, many users, rules, links and safety.']
});
LESSONS.push({
  lv: 'f', id: 'tables', t: 'Tables, rows, columns and cells',
  goal: 'Read a table and name its parts.',
  story: 'Take one box from the toy chest: the "customers" box. Every card inside has the same printed lines: name, city, phone. Each card is filled in for one customer.',
  words: [['Table', 'One list of the same kind of thing, like customers or products. Like one sheet in a spreadsheet.'], ['Column', 'One kind of fact that every row has, like "city". Also called a field.'], ['Row', 'One thing in the table, like one customer. Also called a record.'], ['Cell', 'The spot where one row and one column meet. It holds one value.'], ['Value', 'The actual fact in a cell, like "Accra" or 12.5.']],
  body: 'A database holds **tables**. Each table is about **one kind of thing**.\n\n- Every table has a **name**, like `customers`.\n- **Columns** run down the page. Each column has a name, like `city`, and holds one kind of fact.\n- **Rows** run across. Each row is one thing: one customer, one order.\n- A **cell** is where a row and a column cross. It holds a single **value**.\n\nThe picture below is real data from the practice database: the first 4 rows of the `customers` table. Look at it and find: a column name, a row, and a cell.\n\nTable and column names are usually written in small letters with underscores instead of spaces, like `company_name`. That makes them easy to type.',
  demo: ['SELECT id, company_name, city, country FROM customers LIMIT 4', 'The first 4 rows of the customers table'],
  when: 'Always. Everything in a relational database (the most common kind) lives in tables.',
  how: ["Find the table you need by its name. The name says what kind of thing it holds.", "Read the column names to learn which facts it keeps.", "Look at a few rows to see what real values look like.", "Point to one cell and say it out loud: \"row = this customer, column = city, value = Accra\". If you can do that, you can read any table."],
  app: [['The tree on the left lists every table. Click the little arrow next to a table to see its columns.', 'home', null, '#tree'], ['The Browse data tab shows a table\'s rows like a spreadsheet.', 'browse', 'customers', '#dataGrid']],
  quiz: [['In the picture, "Accra" in the city column is a…', ['table', 'cell value', 'column name'], 1, 'It is the value stored in one cell.'], ['A row in the customers table is…', ['one customer', 'all the cities', 'the whole database'], 0, 'One row = one thing, here one customer.'], ['Which is a good column name?', ['Company Name!', 'company_name', 'the name of the company'], 1, 'Small letters and underscores, no spaces or symbols.']],
  recap: ['A table is a list of one kind of thing.', 'Columns are the kinds of facts; rows are the things; cells hold single values.', 'Names are usually lowercase_with_underscores.']
});
LESSONS.push({
  lv: 'f', id: 'types0', t: 'Kinds of values (types) and empty cells',
  goal: 'Know the main kinds of values and what "empty" (NULL) means.',
  story: 'You would not pour milk into an egg box. Every column has a kind of box: one for words, one for numbers, one for dates.',
  words: [['Type (data type)', 'The kind of value a column holds: text, whole number, decimal, date, yes/no.'], ['NULL', 'A special marker meaning "nothing was written here" or "unknown". It is not zero and not an empty word.']],
  body: 'Every column has a **type**. The database uses it to check values and to know how to sort and calculate.\n\n- **Text** (often called TEXT, VARCHAR or CHAR): names, codes, emails. `Accra`, `NW-1001`.\n- **Whole numbers** (INTEGER, INT): counts and IDs. `42`.\n- **Decimals** (DECIMAL, NUMERIC, REAL): prices, weights. `19.99`. Money should use DECIMAL/NUMERIC, which does not lose pennies.\n- **Dates and times** (DATE, TIMESTAMP, DATETIME): `2026-09-24`. Databases write dates year-month-day so they sort correctly.\n- **Yes/No** (BOOLEAN or BIT): true/false. Some databases store it as 1 and 0.\n\n**Empty cells are called NULL.** NULL means "no value": we do not know, or it does not apply. It is different from `0` (a number) and from `\'\'` (text with no letters). You will see later that NULL needs special care.',
  demo: ['SELECT id, company_name, phone, segment FROM customers WHERE phone IS NULL OR segment IS NULL LIMIT 5', 'Some customers have empty (NULL) phone or segment values'],
  when: 'Choosing types when you design tables, and understanding why a number might sort like text or why a total ignores some rows.',
  how: ["For each column, ask: is this words, a whole number, a decimal, a date, or yes/no?", "Money and measurements: decimal. Counts and IDs: whole number.", "Dates: always a date type, written year-month-day.", "Ask: can this be unknown? If yes, the cell may be NULL, and you will need to handle that when you ask questions."],
  app: [['Table design tab: the "Kind of data" column shows each type in plain words and in database words.', 'design', 'customers'], ['Empty cells show the grey word "empty" on the Browse data tab.', 'browse', 'customers', '#dataGrid']],
  quiz: [['Which type suits a price like 19.99?', ['Text', 'Whole number', 'Decimal'], 2, 'Prices have decimals; DECIMAL/NUMERIC keeps them exact.'], ['A NULL phone number means…', ['the phone is 0', 'nothing was written', 'the phone is a space'], 1, 'NULL means no value at all.'], ['Why write dates as 2026-09-24?', ['It is the law', 'So they sort correctly as text and are clear in every country', 'It is shorter'], 1, 'Year-month-day always sorts in time order and is not confused with day/month vs month/day.']],
  recap: ['Every column has a type: text, whole number, decimal, date, yes/no.', 'NULL = no value. Not 0, not blank text.']
});
LESSONS.push({
  lv: 'f', id: 'keys0', t: 'ID numbers and links (keys) in one minute',
  goal: 'See how tables are connected, before you learn to use it.',
  story: 'Every pupil gets a pupil number. When a library book is borrowed, the librarian writes down the pupil number, not the whole name and address. The number links the book to the pupil.',
  words: [['Primary key (ID)', 'A column whose value is different for every row, usually a number called id. It is the row\'s name tag.'], ['Foreign key (link)', 'A column in one table that holds the ID of a row in another table, like orders.customer_id.'], ['Relationship', 'The connection between two tables made by a foreign key.']],
  body: 'Most tables have an **id** column. It is the **primary key**: no two rows share the same id, so it points at exactly one row.\n\nOther tables can store that id to **link** to it. That column is a **foreign key**. In the practice data:\n- `orders.customer_id` holds a customer\'s id → which customer placed the order.\n- `order_items.product_id` holds a product\'s id → which product was bought.\n\nThe dot in `orders.customer_id` means "the customer_id column of the orders table".\n\nThis way each fact is written **once**. If a customer changes their phone number, you change one row, and every order still points to the right customer. Level 6 teaches how to use these links in questions.',
  demo: ['SELECT id, customer_id, order_date, status FROM orders LIMIT 4', 'Each order stores the id of its customer in customer_id'],
  when: 'Almost every real database is built from linked tables.',
  how: ["Find the ID column of each table (usually id). That is the row's name tag.", "Look for columns ending in _id, like customer_id. Each one is a link.", "Read the link as a sentence: \"each order belongs to one customer\".", "To follow a link by hand, take the number in customer_id and look up the customer with that id."],
  app: [['Home screen: "How the tables connect" lists every link.', 'home'], ['Table design tab: ID and "→ table" markers.', 'design', 'orders'], ['In the tree, a key icon marks the ID column; a link icon marks foreign keys.', 'home', null, '#tree']],
  quiz: [['orders.customer_id = 12 means…', ['the order costs 12', 'this order belongs to the customer whose id is 12', 'there are 12 orders'], 1, 'A foreign key holds the id of a row in another table.'], ['Why link with an id instead of copying the customer\'s name into every order?', ['Ids are prettier', 'So each fact is written once and changes happen in one place', 'Names are not allowed'], 1, 'Writing facts once avoids mistakes and double work.']],
  recap: ['Primary key = unique id of each row.', 'Foreign key = a column holding another table\'s id.', 'table.column (with a dot) names a column of a table.']
});
LESSONS.push({
  lv: 'f', id: 'sql', t: 'What is SQL?',
  goal: 'Know what SQL is and the handful of verbs it is built from.',
  story: 'SQL is the language you speak to the toy chest. You say a short sentence like "show me the red cars from the car box", and the chest hands them over.',
  words: [['SQL', 'Structured Query Language: the language used to talk to relational databases. Say "S-Q-L" or "sequel".'], ['Query', 'A question or instruction written in SQL.'], ['Statement', 'One complete SQL sentence.'], ['Keyword', 'A special SQL word with a fixed meaning, like SELECT or FROM.'], ['Result (result set)', 'The rows and columns the database sends back.']],
  body: 'SQL is a set of **short English-like sentences**. You write one, the database runs it, and sends back a **result**.\n\nThe main **verbs** (you will learn each one properly later):\n- **SELECT**: show me data. *(Read only, nothing changes.)*\n- **INSERT**: add new rows.\n- **UPDATE**: change existing rows.\n- **DELETE**: remove rows.\n- **CREATE / ALTER / DROP**: make, change or remove tables.\n\nThe same SQL works, with small differences, in SQLite, PostgreSQL, MySQL, SQL Server, Oracle and many others. Learning it once is useful almost everywhere.\n\nMost people spend 90% of their time writing **SELECT** queries, so that is where we start.',
  when: 'Whenever you need data from a database: reports, answers to questions, checking numbers, fixing records, building apps.',
  how: ["Say what you want in plain words first: \"show me the names of customers in Accra\".", "Decide the verb: only looking = SELECT; adding = INSERT; changing = UPDATE; removing = DELETE.", "Find the table and columns that hold the facts.", "Write it as a SQL sentence, run it, and check the answer makes sense."],
  app: [['Every button in Tablewise writes SQL for you. On the Browse data tab press "Show SQL" to see it.', 'browse', 'customers', '#browseSearch'], ['The SQL editor is where you write SQL yourself.', 'sql']],
  quiz: [['Which verb only reads data and never changes anything?', ['SELECT', 'UPDATE', 'DELETE'], 0, 'SELECT asks to see data. The others change it.'], ['What is a query?', ['A table', 'A question or instruction written in SQL', 'A kind of database'], 1, 'Queries are the sentences you send to the database.']],
  recap: ['SQL = the language of databases.', 'SELECT reads, INSERT adds, UPDATE changes, DELETE removes, CREATE/ALTER/DROP manage tables.']
});
LESSONS.push({
  lv: 'f', id: 'tools', t: 'Running SQL: the general steps',
  goal: 'Know how to open a query editor and run SQL in any database tool.',
  story: 'SQL is the language; a database tool is the telephone you use to speak it.',
  words: [['Database tool', 'A program you use to connect to a database, look at its tables and run SQL. Tablewise is one.'], ['Connection', 'The details needed to reach a database: where it is (server address or file), its name, and your user name and password.'], ['Query editor', 'The box where you type SQL.'], ['Run (execute)', 'Send the SQL to the database and get the answer back.'], ['Results grid', 'The table of rows that comes back.'], ['Error message', 'The database telling you what it could not understand, and usually where.']],
  body: "Whatever program you use, running SQL always has the same parts:\n1. **A connection** to the database: a file on your computer, or a server with an address, a database name, a user name and a password (your IT team gives you these).\n2. **A list of tables** so you can see what is inside.\n3. **A query editor** where you type SQL.\n4. **A run button** and usually a keyboard shortcut.\n5. **A results grid** with the answer, and a **message area** for errors and \"rows changed\".\n\nThe first time you connect somewhere new, run a harmless query like `SELECT 1` to prove the connection works.\n\n**Reading errors:** the message usually names the word it did not understand and the line. Common ones: \"no such table\" (spelling of a table), \"no such column\" (spelling of a column), \"syntax error near …\" (a grammar mistake just before that word).",
  when: 'Every time you want to write SQL yourself.',
  how: ["Connect to the database (server address, database name, user and password, or a database file).", "Open a query editor (the box where you type SQL).", "Type one statement.", "Run it with the Run button or keyboard shortcut.", "Read the results grid. If there is an error, read the message: it usually names the word or line that is wrong.", "Fix, run again. To run just one statement out of many, select it first, then run."],
  app: [['SQL editor: the editor, Run button, results and a library of ready-made SQL.', 'sql', null, '#sqlEditor'], ['Open a database screen: connections to company servers (desktop app).', 'connect'], ['In these lessons, the Run buttons send SQL to a private practice copy.', 'learn']],
  quiz: [['What do you need before you can run SQL on a company server?', ['Only the table name', 'A connection: address, database name, user name and password', 'Nothing'], 1, 'Without a connection there is nothing to send the SQL to.'], ['An error says "no such column: citty". What is wrong?', ['The table is broken', 'The column name is misspelled', 'The database is off'], 1, 'Errors name the word they did not understand. Here it is a spelling mistake.']],
  recap: ['Connect, open an editor, type, run, read the result.', 'Error messages point at the word or line that is wrong.']
});
LESSONS.push({
  lv: 'f', id: 'grammar', t: 'How a SQL sentence is written',
  goal: 'Read the punctuation and rules of SQL so nothing looks strange later.',
  story: 'Like any language, SQL has capital letters, commas, quotation marks and full stops. Once you know the rules, every sentence is easy to read.',
  words: [['Clause', 'One part of a statement that starts with a keyword, like "FROM customers".'], ['Identifier', 'A name you chose: a table or column name.'], ['Literal', 'A value written directly in the query, like \'Accra\' or 42.'], ['Semicolon ;', 'Marks the end of a statement, like a full stop.'], ['Comment', 'A note for humans that the database ignores.']],
  body: 'A SQL statement is made of **clauses**. Each clause starts with a **keyword**.\n\n**The rules:**\n- **Keywords are not case-sensitive.** `SELECT`, `select` and `Select` are the same. People usually write keywords in CAPITALS so they stand out.\n- **Names (identifiers)** are the table and column names: `customers`, `city`.\n- **Text values go in single quotes**: `\'Accra\'`. Without quotes, the database thinks Accra is a column name.\n- **Numbers have no quotes**: `42`, `19.99`. Decimal point, no thousand commas.\n- **Dates are written as text** in quotes: `\'2026-09-24\'`.\n- **Commas separate items in a list**: `city, country`. No comma after the last one.\n- **A semicolon `;` ends a statement.** With one statement it is optional; with several it is needed.\n- **Spaces and new lines do not matter.** Put each clause on its own line to make it readable.\n- **Comments**: `-- anything after two dashes` is ignored, and so is `/* text between these */`.\n- A name with spaces or odd characters must be quoted: `"order date"` (most databases), `` `order date` `` (MySQL) or `[order date]` (SQL Server). Best to avoid such names.\n\nAn example you can read already, even before learning it:\n\n`SELECT city FROM customers;`\n\nSELECT (keyword) city (a column name) FROM (keyword) customers (a table name) ; (end).',
  when: 'Every time you read or write SQL, and every time you get a "syntax error" (a grammar mistake).',
  how: ["Start each clause with its keyword, each on a new line.", "Put text values in single quotes and leave numbers bare.", "Separate items in a list with commas, with no comma after the last one.", "End the statement with a semicolon.", "If you get a \"syntax error\", check quotes, commas and brackets around the place the message points to."],
  app: [['SQL editor: keywords are coloured; "Format SQL" puts each clause on its own line.', 'sql']],
  quiz: [['How do you write the text Accra in SQL?', ['Accra', '"Accra"', "'Accra'"], 2, 'Text values use single quotes. Double quotes are for names in most databases.'], ['Is SELECT the same as select?', ['Yes, keywords ignore capitals', 'No'], 0, 'Keywords are not case-sensitive.'], ['What is wrong in: SELECT city, country, FROM customers', ['Nothing', 'A comma after the last column', 'Missing quotes around city'], 1, 'No comma after the last item in a list.']],
  recap: ['Keywords start clauses; capitals do not matter.', "Text in 'single quotes', numbers bare, dates as 'YYYY-MM-DD'.", 'Commas between list items, semicolon at the end, -- for comments.']
});
LESSONS.push({
  lv: 'f', id: 'first', t: 'Your first query: SELECT * FROM',
  goal: 'Write and run your first query.',
  story: 'Walk up to the "departments" box and say: "Show me everything in there." That is SELECT * FROM departments.',
  words: [['SELECT', 'Keyword that starts a question: "show me…".'], ['FROM', 'Keyword that says which table to look in.'], ['* (star)', 'Means "all columns".']],
  body: 'The smallest useful query has two clauses:\n\n`SELECT * FROM departments;`\n\nIt returns **every column** and **every row** of the table.\n\nTry it with the Run button below. Then change `departments` to another table name from the tree on the left (for example `categories` or `products`) and run it again.\n\nOn real company tables with millions of rows, `SELECT *` on its own can be slow. In the next lessons you will learn to ask for less.',
  anatomy: { sql: 'SELECT * FROM departments;', parts: [['SELECT', 'Show me…'], ['*', '…all the columns…'], ['FROM departments', '…of the departments table.'], [';', 'End of the sentence.']] },
  when: 'Taking a first look at a table you do not know yet.',
  how: ["Find the table name.", "Write SELECT * FROM table_name;", "Run it and look at the columns and values you get back.", "On a big table, add LIMIT 10 (taught soon) so you only peek at a few rows."],
  app: [['The Browse data tab runs SELECT * for you when you click a table.', 'browse', 'departments', '#dataGrid']],
  ex: [['SELECT * FROM departments;', 'Every column and row of departments. There are 8 departments.'], ['SELECT * FROM categories;', 'Same idea, different table.']],
  mistakes: ['Misspelling the table name gives "no such table". Copy names from the tree.', 'Forgetting FROM: SELECT * departments is an error.'],
  practice: [{ task: 'Show everything in the products table.', answer: 'SELECT * FROM products', hint: 'SELECT * FROM …' }, { task: 'Show everything in the employees table.', answer: 'SELECT * FROM employees', hint: 'Same pattern, different table name.' }],
  recap: ['SELECT * FROM table shows every column and every row.', 'SELECT = show me, * = all columns, FROM = which table.']
});

/* ================= 2. ASKING FOR DATA ================= */
LESSONS.push({
  lv: 's', id: 'cols', t: 'Choosing columns',
  goal: 'Ask for only the columns you need.',
  story: 'Instead of photocopying the whole card, you copy only the name and the phone number.',
  words: [['Column list', 'The names after SELECT, separated by commas, that say which columns you want.']],
  body: 'Replace the `*` with the **names of the columns** you want, separated by **commas**:\n\n`SELECT company_name, city FROM customers;`\n\n- Columns come back **in the order you write them**, not the order in the table.\n- You can list a column more than once, or in any order you like.\n- Asking for fewer columns is **faster** and easier to read, which matters on big tables.',
  anatomy: { sql: 'SELECT company_name, city FROM customers;', parts: [['SELECT', 'Show me'], ['company_name, city', 'these two columns, in this order'], ['FROM customers', 'from the customers table']] },
  when: 'Nearly always. Real reports rarely need every column.',
  how: ["Look at the table once with SELECT * to see the column names.", "Pick only the columns you need for your question.", "Write them after SELECT, separated by commas, in the order you want to see them.", "Run and check."],
  app: [['Question builder: tick the columns you want on a table card.', 'builder', null, '#qbCanvas'], ['SQL editor: start typing a column name and suggestions pop up.', 'sql', null, '#sqlEditor']],
  ex: [['SELECT company_name, city FROM customers;', 'Two columns only.'], ['SELECT city, company_name FROM customers;', 'Same columns, swapped order.']],
  mistakes: ['A comma after the last column: SELECT a, b, FROM … is an error.', 'A missing comma: SELECT company_name city … treats city as a new name for company_name (you will learn about that next lesson).'],
  practice: [{ task: 'Show only the name and unit_price of every product.', answer: 'SELECT name, unit_price FROM products', hint: 'SELECT name, unit_price FROM products' }, { task: 'Show first_name, last_name and job_title of every employee.', answer: 'SELECT first_name, last_name, job_title FROM employees', hint: 'Three column names separated by commas.' }],
  recap: ['List column names after SELECT, separated by commas.', 'They come back in the order you list them.']
});
LESSONS.push({
  lv: 's', id: 'as', t: 'Renaming columns with AS',
  goal: 'Give result columns friendly names.',
  story: 'A nickname. Your real name stays the same, but on the name badge you can write what you like.',
  words: [['AS', 'Keyword that gives a column (or table) a different name in the result.'], ['Alias', 'The new name made with AS.']],
  body: 'Write `AS new_name` after a column:\n\n`SELECT company_name AS customer, city AS town FROM customers;`\n\n- Only the **result** changes. The table keeps its real names.\n- Use simple names (letters, numbers, underscores). If you really want spaces, put the alias in double quotes: `AS "Customer name"`.\n- The word AS can be left out (`company_name customer`), but writing it is clearer.\n- Later you will give **tables** short aliases too, which is very handy when joining tables.',
  anatomy: { sql: 'SELECT company_name AS customer FROM customers;', parts: [['company_name', 'the real column'], ['AS customer', 'show it with the heading "customer"']] },
  when: 'Reports for other people, spreadsheets you export, and calculated columns that would otherwise have ugly names.',
  how: ["Run your query and look at the headings.", "For any heading that is unclear or ugly, add AS and a clear name after that column.", "Use short lowercase names; use double quotes only if you want spaces."],
  app: [['Question builder names result columns for you, like total_quantity.', 'builder'], ['CSV and Excel buttons above results use these names as headings.', 'sql']],
  ex: [['SELECT company_name AS customer, city AS town FROM customers;', 'Headings are now customer and town.'], ['SELECT name AS "Product name" FROM products;', 'An alias with a space needs double quotes.']],
  practice: [{ task: 'Show product name as product and unit_price as price.', answer: 'SELECT name AS product, unit_price AS price FROM products', hint: 'name AS product, unit_price AS price' }],
  recap: ['column AS alias renames it in the result only.', 'Use double quotes only if the alias has spaces.']
});
LESSONS.push({
  lv: 's', id: 'calc', t: 'Doing maths in SELECT',
  goal: 'Create new columns by calculating from others.',
  story: 'A calculator that works on every row at once: "for every item, multiply how many by the price".',
  words: [['Expression', 'Anything that produces a value: a column, a number, or a calculation like quantity * unit_price.'], ['Operator', 'A symbol that does something: + add, - subtract, * multiply, / divide.']],
  body: 'After SELECT you can write **expressions**, not just column names:\n\n`SELECT order_id, quantity * unit_price AS line_total FROM order_items;`\n\n- `+` add, `-` subtract, `*` multiply, `/` divide. Normal maths order: * and / before + and -. Use brackets to be sure: `(a + b) * c`.\n- You can mix columns and numbers: `unit_price * 1.15`.\n- You can also select a **fixed value**: `SELECT \'hello\' AS greeting` or `SELECT 2 + 2`.\n- Give calculated columns a name with **AS**, or they get an ugly automatic name.\n\n**Watch out, whole-number division.** In SQLite, PostgreSQL and SQL Server, `7 / 2` is `3` because both numbers are whole. Write `7 * 1.0 / 2` or `7.0 / 2` to get `3.5`. MySQL gives 3.5 already.',
  anatomy: { sql: 'SELECT quantity * unit_price AS line_total FROM order_items;', parts: [['quantity * unit_price', 'multiply the two columns on every row'], ['AS line_total', 'call the result line_total']] },
  when: 'Line totals, prices with tax, discounts, differences, percentages.',
  how: ["Say the calculation in words: \"money per line = how many \u00d7 price\".", "Find the columns that hold each part.", "Write it with + - * / and brackets where needed.", "Give it a name with AS.", "Check a row by hand with a calculator to be sure.", "If dividing whole numbers, multiply by 1.0 first."],
  app: [['Question builder: "+ Calculation" makes a calculated column without typing.', 'builder']],
  ex: [['SELECT order_id, quantity, unit_price, quantity * unit_price AS line_total FROM order_items LIMIT 5;', 'Money for each order line. (LIMIT 5 shows only 5 rows; it is taught two lessons from now.)'], ['SELECT name, unit_price, unit_price * 1.15 AS with_tax FROM products;', 'Price plus 15%.'], ['SELECT 7 / 2 AS whole, 7 * 1.0 / 2 AS exact;', 'The whole-number division trap.']],
  practice: [{ task: 'Show each product name with its price after a 10% discount (unit_price * 0.9) as sale_price.', answer: 'SELECT name, unit_price * 0.9 AS sale_price FROM products', hint: 'unit_price * 0.9 AS sale_price' }],
  recap: ['SELECT can calculate: + - * /.', 'Name calculated columns with AS.', 'Whole ÷ whole may drop decimals; multiply by 1.0 first.']
});
LESSONS.push({
  lv: 's', id: 'distinct', t: 'Removing repeats: DISTINCT',
  goal: 'List each different value once.',
  story: 'Thirty children, but only five favourite colours. DISTINCT gives you the five colours, once each.',
  words: [['DISTINCT', 'Keyword placed right after SELECT that removes repeated rows from the result.']],
  body: '`SELECT DISTINCT country FROM customers;` shows every country **once**.\n\n- DISTINCT looks at the **whole row** of the result. `SELECT DISTINCT country, city` gives each different country-and-city pair once.\n- It goes directly after SELECT, before the column list.\n- It is great for exploring: "which statuses exist?", "which cities do we ship to?"',
  anatomy: { sql: 'SELECT DISTINCT country FROM customers;', parts: [['SELECT DISTINCT', 'show me, without repeats,'], ['country', 'the country column'], ['FROM customers', 'of customers']] },
  when: 'Discovering the possible values of a column, making drop-down lists, checking data quality.',
  how: ["Decide which column (or columns) you want the different values of.", "Write SELECT DISTINCT and those columns.", "Add ORDER BY if you want the list sorted."],
  app: [['Question builder: tick "Remove duplicate rows".', 'builder']],
  ex: [['SELECT DISTINCT status FROM orders;', 'The 4 different order statuses.'], ['SELECT DISTINCT country, city FROM customers;', 'Each different pair once.']],
  practice: [{ task: 'List every different country in customers.', answer: 'SELECT DISTINCT country FROM customers', hint: 'SELECT DISTINCT country FROM customers' }, { task: 'List every different job_title in employees.', answer: 'SELECT DISTINCT job_title FROM employees', hint: 'Same idea with job_title.' }],
  recap: ['SELECT DISTINCT removes repeated result rows.', 'It checks all selected columns together.']
});
LESSONS.push({
  lv: 's', id: 'orderby', t: 'Sorting: ORDER BY',
  goal: 'Put results in the order you want.',
  story: 'Lining children up from shortest to tallest, or tallest to shortest.',
  words: [['ORDER BY', 'Clause that sorts the result. Goes after FROM (and after WHERE, which you will learn soon).'], ['ASC', 'Ascending: small to big, A to Z, old to new. The default.'], ['DESC', 'Descending: big to small, Z to A, new to old.']],
  body: '`SELECT name, unit_price FROM products ORDER BY unit_price DESC;`\n\n- Without ORDER BY, the database may return rows in **any order**. Never rely on the order unless you ask for one.\n- **ASC** (default) = smallest first. **DESC** = biggest first.\n- **Several columns**: `ORDER BY country, city` sorts by country, and inside each country by city. Each column can have its own direction: `ORDER BY country ASC, city DESC`.\n- You can sort by a column you did not select, by an alias, or by an expression: `ORDER BY quantity * unit_price DESC`.\n- Text sorts alphabetically; dates sort by time; NULLs go first or last depending on the database.',
  anatomy: { sql: 'SELECT name, unit_price FROM products ORDER BY unit_price DESC;', parts: [['ORDER BY unit_price', 'sort by price'], ['DESC', 'highest first']] },
  when: 'Top lists, alphabetical lists, newest first, largest first.',
  how: ["Decide what the order is based on (price, date, name).", "Decide the direction: smallest/oldest/A first (ASC) or biggest/newest/Z first (DESC).", "If two rows can tie, add a second column to break the tie.", "Add ORDER BY at the end of the query (before LIMIT)."],
  app: [['Browse data tab: click a column name to sort.', 'browse', 'products', '#dataGrid th'], ['Question builder: "+ Sort by".', 'builder']],
  ex: [['SELECT name, unit_price FROM products ORDER BY unit_price DESC;', 'Most expensive first.'], ['SELECT country, city, company_name FROM customers ORDER BY country, city;', 'Country A→Z, then city inside it.'], ['SELECT first_name, hire_date FROM employees ORDER BY hire_date;', 'Longest-serving first.']],
  practice: [{ task: 'Show all employees sorted by salary, highest first.', answer: 'SELECT * FROM employees ORDER BY salary DESC', hint: 'ORDER BY salary DESC', ordered: true }, { task: 'Show customers sorted by country A→Z, and inside each country by company_name A→Z.', answer: 'SELECT * FROM customers ORDER BY country, company_name', hint: 'ORDER BY country, company_name', ordered: true }],
  recap: ['ORDER BY column sorts; ASC small→big (default), DESC big→small.', 'Several columns break ties.', 'No ORDER BY = no guaranteed order.']
});
LESSONS.push({
  lv: 's', id: 'limit', t: 'Only the first few: LIMIT, TOP, FETCH',
  goal: 'Return just the first N rows, and page through results.',
  story: '"Just give me the top 3 sweets, not the whole jar."',
  words: [['LIMIT n', 'Return at most n rows (SQLite, PostgreSQL, MySQL).'], ['TOP n', 'SQL Server\'s way: SELECT TOP 5 …'], ['OFFSET n', 'Skip n rows first. Used for "page 2, page 3".']],
  body: '`SELECT name, unit_price FROM products ORDER BY unit_price DESC LIMIT 3;`\n\n- **LIMIT goes at the very end.**\n- Use it **with ORDER BY**: "the top 3" only makes sense when you say top by what. Without ORDER BY you get any 3 rows.\n- **Paging**: `LIMIT 10 OFFSET 20` skips 20 rows and shows the next 10 (page 3 of 10 per page).\n\n**Different databases, different words:**\n- SQLite, PostgreSQL, MySQL: `… LIMIT 3`\n- SQL Server: `SELECT TOP 3 name, unit_price FROM products ORDER BY unit_price DESC`\n- Standard SQL (PostgreSQL, SQL Server 2012+, Oracle): `… ORDER BY unit_price DESC OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY`',
  anatomy: { sql: 'SELECT name FROM products ORDER BY unit_price DESC LIMIT 3;', parts: [['ORDER BY unit_price DESC', 'most expensive first'], ['LIMIT 3', 'keep only the first 3 rows']] },
  when: 'Top-10 lists, a quick peek at a huge table, testing a query before running it on everything, page-by-page screens.',
  how: ["First sort the rows with ORDER BY so the \"top\" ones come first.", "Add LIMIT with how many rows you want (or TOP in SQL Server).", "For page-by-page lists, add OFFSET: rows to skip = (page number \u2212 1) \u00d7 rows per page."],
  app: [['Question builder: "Max rows".', 'builder'], ['Browse data tab: rows per page and Next/Previous at the bottom use LIMIT and OFFSET.', 'browse', 'orders', '.grid-foot']],
  ex: [['SELECT name, unit_price FROM products ORDER BY unit_price DESC LIMIT 3;', 'Top 3 by price.'], ['SELECT id, company_name FROM customers ORDER BY id LIMIT 5 OFFSET 5;', 'Rows 6 to 10: "page 2" with 5 per page.']],
  mistakes: ['LIMIT without ORDER BY: you get some rows, not the top ones.', 'Putting LIMIT before ORDER BY: it must be last.'],
  practice: [{ task: 'Show the 5 cheapest products (all columns).', answer: 'SELECT * FROM products ORDER BY unit_price LIMIT 5', hint: 'ORDER BY unit_price LIMIT 5', ordered: true }, { task: 'Show the 3 employees with the highest salary: first_name and salary.', answer: 'SELECT first_name, salary FROM employees ORDER BY salary DESC LIMIT 3', hint: 'ORDER BY salary DESC LIMIT 3', ordered: true }],
  recap: ['LIMIT n (or TOP n in SQL Server) keeps the first n rows.', 'Always pair it with ORDER BY.', 'OFFSET skips rows for paging.']
});

/* ================= 3. FILTERING ================= */
LESSONS.push({
  lv: 'w', id: 'where', t: 'WHERE: keeping only some rows',
  goal: 'Filter rows with a simple rule.',
  story: 'WHERE is a sieve. You pour all the rows in, and only the ones that match the rule fall through.',
  words: [['WHERE', 'Clause that keeps only the rows where a rule is true. Goes after FROM, before ORDER BY.'], ['Condition', 'A rule that is true or false for each row, like city = \'Accra\'.'], ['= (equals)', 'Is the same as.']],
  body: '`SELECT company_name, city FROM customers WHERE city = \'Accra\';`\n\n- The database checks the condition **for every row** and keeps the rows where it is **true**.\n- **Text** needs single quotes: `\'Accra\'`. **Numbers** do not: `WHERE floor = 2`.\n- Whether `\'accra\'` matches `\'Accra\'` depends on the database: MySQL and SQL Server usually ignore capitals, SQLite and PostgreSQL usually do not.\n- **Order of clauses so far**: SELECT … FROM … WHERE … ORDER BY … LIMIT …',
  anatomy: { sql: "SELECT company_name FROM customers WHERE city = 'Accra';", parts: [['WHERE', 'only keep rows where…'], ['city', '…the city column…'], ['=', '…is equal to…'], ["'Accra'", '…the text Accra.']] },
  when: 'Nearly every real query: one customer, one status, one date range, one product.',
  how: ["Say in words which rows you want: \"orders that are still pending\".", "Find the column that holds that fact (status).", "Choose the comparison (= for \"is\").", "Write the value correctly: text in single quotes, numbers bare, dates as 'YYYY-MM-DD'.", "Run and look at a few rows to check they really match.", "If nothing comes back, check the exact spelling and capitals of the value with SELECT DISTINCT on that column."],
  app: [['Browse data tab: the Filter button, or the small funnel next to any column name.', 'browse', 'customers', '#addFilterBtn'], ['Question builder: "Only rows where…".', 'builder'], ['Browse data tab → "Show SQL" shows the WHERE Tablewise writes.', 'browse', 'customers', '#browseSearch']],
  ex: [["SELECT company_name, city FROM customers WHERE city = 'Accra';", 'Customers in Accra.'], ['SELECT name, floor FROM departments WHERE floor = 2;', 'A number: no quotes.'], ["SELECT id, order_date, status FROM orders WHERE status = 'pending' ORDER BY order_date DESC;", 'WHERE and ORDER BY together.']],
  mistakes: ["Double quotes for text: WHERE city = \"Accra\" treats Accra as a column name in most databases.", 'Putting WHERE after ORDER BY. The order is FROM, WHERE, ORDER BY.'],
  practice: [{ task: "Show all orders whose status is 'pending'.", answer: "SELECT * FROM orders WHERE status = 'pending'", hint: "WHERE status = 'pending'" }, { task: 'Show all products in category_id 3.', answer: 'SELECT * FROM products WHERE category_id = 3', hint: 'Numbers need no quotes.' }],
  recap: ["WHERE condition keeps matching rows.", "Text in 'quotes', numbers bare.", 'Order: SELECT, FROM, WHERE, ORDER BY, LIMIT.']
});
LESSONS.push({
  lv: 'w', id: 'compare', t: 'Comparing: > < >= <= and not equal',
  goal: 'Filter with bigger, smaller and not-equal rules.',
  story: '"Who is taller than 120 cm?" You compare every child with a number.',
  words: [['> <', 'More than, less than.'], ['>= <=', 'At least (more than or equal), at most (less than or equal).'], ['<> or !=', 'Not equal. Both work in most databases; <> is the standard.']],
  body: '- `unit_price > 20` more than 20 (20 itself is **not** included)\n- `unit_price >= 20` 20 or more\n- `unit_price < 5`, `unit_price <= 5`\n- `status <> \'delivered\'` anything except delivered\n\nThey work on **numbers**, **dates** (earlier/later: `order_date >= \'2026-09-01\'`) and **text** (alphabetical: `company_name < \'C\'` is names starting A or B).\n\nYou can compare two columns too: `WHERE units_in_stock < 20`, or with an expression: `WHERE quantity * unit_price > 500`.',
  when: 'Prices over a limit, stock below a level, orders after a date, anything except a status.',
  how: ["Decide the limit value (20, a date).", "Decide whether the limit itself is included: \"over 20\" is >, \"20 or more\" is >=.", "Write column, comparison, value.", "Test with a value right on the edge to be sure it is included or left out as you intended."],
  app: [['Filter rule options: "is more than / after", "is less than / before", "is at least", "is at most", "is not".', 'browse', 'products', '#addFilterBtn']],
  ex: [['SELECT name, unit_price FROM products WHERE unit_price > 20;', 'Over 20.'], ["SELECT id, order_date FROM orders WHERE order_date >= '2026-09-01' ORDER BY order_date;", 'On or after 1 September 2026.'], ["SELECT id, status FROM orders WHERE status <> 'delivered' LIMIT 10;", 'Everything not delivered.'], ['SELECT order_id, quantity * unit_price AS total FROM order_items WHERE quantity * unit_price > 500;', 'Big order lines.']],
  practice: [{ task: 'Show products with fewer than 20 units_in_stock.', answer: 'SELECT * FROM products WHERE units_in_stock < 20', hint: 'units_in_stock < 20' }, { task: 'Show employees hired on or after 2023-01-01.', answer: "SELECT * FROM employees WHERE hire_date >= '2023-01-01'", hint: "hire_date >= '2023-01-01'" }],
  recap: ['> < >= <= compare numbers, dates and text.', "<> (or !=) means not equal."]
});
LESSONS.push({
  lv: 'w', id: 'andor', t: 'Combining rules: AND, OR, NOT',
  goal: 'Use several rules at once, correctly.',
  story: 'AND: "a red AND round sweet" must be both. OR: "an apple OR an orange" can be either. NOT turns a rule around.',
  words: [['AND', 'Both conditions must be true.'], ['OR', 'At least one condition must be true.'], ['NOT', 'Reverses a condition.'], ['Brackets ( )', 'Group conditions so they are checked together first.']],
  body: '- `WHERE country = \'Ghana\' AND segment = \'Retail\'` → both must match.\n- `WHERE city = \'Accra\' OR city = \'Kumasi\'` → either one.\n- `WHERE NOT status = \'cancelled\'` → everything except cancelled.\n\n**The trap:** AND is worked out **before** OR (like × before + in maths). So\n\n`WHERE status = \'pending\' OR status = \'shipped\' AND ship_city = \'Accra\'`\n\nmeans pending (anywhere) OR (shipped AND Accra). If you meant "pending or shipped, and in Accra", use **brackets**:\n\n`WHERE (status = \'pending\' OR status = \'shipped\') AND ship_city = \'Accra\'`\n\n**Rule of thumb: whenever you mix AND and OR, add brackets.**',
  when: 'Almost every real filter has more than one rule.',
  how: ["Write each rule on its own first and test it.", "Decide how they combine: must all be true (AND) or any one is enough (OR).", "When you mix AND and OR, put brackets around the OR part.", "Run and check a few rows against every rule."],
  app: [['Browse data tab: several filters are joined with AND.', 'browse', 'customers', '#addFilterBtn'], ['Question builder: "all rules match" (AND) or "any rule matches" (OR).', 'builder']],
  ex: [["SELECT company_name, country, segment FROM customers WHERE country = 'Ghana' AND segment = 'Retail';", 'Both rules.'], ["SELECT company_name, city FROM customers WHERE city = 'Accra' OR city = 'Kumasi';", 'Either city.'], ["SELECT id, status, ship_city FROM orders WHERE (status = 'pending' OR status = 'shipped') AND ship_city = 'Accra';", 'Brackets make the meaning clear.']],
  practice: [{ task: "Show customers whose city is 'Lagos' or 'Abuja'.", answer: "SELECT * FROM customers WHERE city = 'Lagos' OR city = 'Abuja'", hint: "city = 'Lagos' OR city = 'Abuja'" }, { task: 'Show products with unit_price over 10 AND units_in_stock under 100.', answer: 'SELECT * FROM products WHERE unit_price > 10 AND units_in_stock < 100', hint: 'Two conditions joined with AND.' }],
  quiz: [["WHERE a = 1 OR b = 2 AND c = 3 is read as…", ['(a = 1 OR b = 2) AND c = 3', 'a = 1 OR (b = 2 AND c = 3)'], 1, 'AND is worked out first, like multiplication.']],
  recap: ['AND = both, OR = either, NOT = the opposite.', 'AND goes before OR. Use brackets when mixing them.']
});
LESSONS.push({
  lv: 'w', id: 'in', t: 'Lists: IN and NOT IN',
  goal: 'Match any value from a list.',
  story: '"Is your name Ama, Kofi or Esi?" One question instead of three.',
  words: [['IN (…)', 'True when the value equals any item in the list.'], ['NOT IN (…)', 'True when the value equals none of them.']],
  body: '`WHERE city IN (\'Accra\', \'Kumasi\', \'Tamale\')` is a short way of writing three ORs.\n\n- Items are separated by commas, text in quotes.\n- `NOT IN` keeps rows that match none of the items.\n- Later (level 9) you will put a whole query inside the brackets: `WHERE id IN (SELECT …)`.\n- Careful: if a NOT IN list contains NULL, nothing matches. You will learn why in the NULL lesson.',
  when: 'A handful of cities, product codes, statuses or IDs.',
  how: ["Collect the list of values you want to match.", "Write column IN (value1, value2, \u2026), with text in quotes.", "For the opposite, use NOT IN, and check the column has no empty values (NULL), which would spoil it."],
  app: [['Filter rules "is one of" and "is not one of": type values separated by commas.', 'browse', 'customers', '#addFilterBtn']],
  ex: [["SELECT company_name, city FROM customers WHERE city IN ('Accra', 'Kumasi', 'Tamale');", 'Three cities.'], ["SELECT id, status FROM orders WHERE status NOT IN ('delivered', 'cancelled');", 'Still open orders.']],
  practice: [{ task: "Show employees whose department_id is 1, 3 or 5.", answer: 'SELECT * FROM employees WHERE department_id IN (1, 3, 5)', hint: 'department_id IN (1, 3, 5)' }, { task: "Show orders whose status is not 'delivered' and not 'cancelled'.", answer: "SELECT * FROM orders WHERE status NOT IN ('delivered', 'cancelled')", hint: "NOT IN ('delivered', 'cancelled')" }],
  recap: ['IN (a, b, c) = equals any of them.', 'NOT IN = equals none of them.']
});
LESSONS.push({
  lv: 'w', id: 'between', t: 'Ranges: BETWEEN',
  goal: 'Filter values inside a range.',
  story: 'Everyone aged 6 to 9, including 6-year-olds and 9-year-olds.',
  words: [['BETWEEN a AND b', 'True when the value is from a to b, including both ends.']],
  body: '`WHERE unit_price BETWEEN 5 AND 10` is the same as `unit_price >= 5 AND unit_price <= 10`.\n\n- **Both ends are included.**\n- Write the small value first.\n- Works for numbers, dates and text.\n- **Dates with times**: `order_time BETWEEN \'2026-07-01\' AND \'2026-07-31\'` misses things on 31 July after midnight. For timestamps prefer `>= \'2026-07-01\' AND < \'2026-08-01\'`.',
  when: 'Price bands, date ranges (a month, a quarter, a year), age ranges.',
  how: ["Find the lowest and highest values of the range.", "Write column BETWEEN low AND high (low first).", "Remember both ends are included.", "For dates that also have times, use >= start AND < the day after the end."],
  app: [['Filter rule "is between". For dates also "in the last … days", "this month", "this year".', 'browse', 'orders', '#addFilterBtn']],
  ex: [['SELECT name, unit_price FROM products WHERE unit_price BETWEEN 5 AND 10 ORDER BY unit_price;', '5 to 10 inclusive.'], ["SELECT id, order_date FROM orders WHERE order_date BETWEEN '2026-07-01' AND '2026-07-31';", 'July 2026.']],
  practice: [{ task: 'Show employees with salary between 50000 and 70000.', answer: 'SELECT * FROM employees WHERE salary BETWEEN 50000 AND 70000', hint: 'salary BETWEEN 50000 AND 70000' }, { task: 'Show orders placed in August 2026 (2026-08-01 to 2026-08-31).', answer: "SELECT * FROM orders WHERE order_date BETWEEN '2026-08-01' AND '2026-08-31'", hint: "BETWEEN '2026-08-01' AND '2026-08-31'" }],
  recap: ['BETWEEN a AND b includes both ends.', 'For date-times, use >= start AND < next day.']
});
LESSONS.push({
  lv: 'w', id: 'like', t: 'Patterns in text: LIKE',
  goal: 'Find text that contains, starts with or ends with something.',
  story: 'Looking for every word with "cat" in it: cat, catch, scatter.',
  words: [['LIKE', 'Compares text with a pattern.'], ['% (percent)', 'In a pattern: any number of any characters, even none.'], ['_ (underscore)', 'In a pattern: exactly one character.'], ['ILIKE', 'PostgreSQL\'s LIKE that ignores capitals.']],
  body: '- `LIKE \'%Foods%\'` contains Foods anywhere\n- `LIKE \'P%\'` starts with P\n- `LIKE \'%Ltd\'` ends with Ltd\n- `LIKE \'NW-10_0\'` NW-10, one character, then 0\n- `NOT LIKE` the opposite\n\n**Capitals:** MySQL and SQL Server usually ignore capitals in LIKE. SQLite ignores them for A–Z. PostgreSQL does not; use `ILIKE`, or `LOWER(column) LIKE \'%foods%\'` (LOWER is taught in level 5).\n\n**Speed:** `LIKE \'abc%\'` can use an index; `LIKE \'%abc\'` has to read every row.',
  when: 'Searching names, emails, notes, product codes when you know only part of the text.',
  how: ["Decide where the known text is: anywhere, at the start, or at the end.", "Build the pattern: '%text%', 'text%' or '%text'.", "Use _ for a single unknown character.", "Check whether capitals matter in your database; if unsure, compare LOWER(column) with lowercase text."],
  app: [['Browse data tab: the search box does "contains" across all text columns.', 'browse', 'customers', '#browseSearch'], ['Filter rules: "contains", "does not contain", "starts with", "ends with".', 'browse', 'customers', '#addFilterBtn']],
  ex: [["SELECT company_name FROM customers WHERE company_name LIKE '%Foods%';", 'Contains Foods.'], ["SELECT name FROM products WHERE name LIKE 'P%';", 'Starts with P.'], ["SELECT sku, name FROM products WHERE sku LIKE 'NW-10_0';", 'One-character wildcard.']],
  mistakes: ["Forgetting %: LIKE 'Foods' only finds exactly Foods.", "Using * as a wildcard (that is for file names, not SQL)."],
  practice: [{ task: "Find customers whose company_name ends with 'Ltd'.", answer: "SELECT * FROM customers WHERE company_name LIKE '%Ltd'", hint: "LIKE '%Ltd'" }, { task: "Find employees whose email contains 'mensah'.", answer: "SELECT * FROM employees WHERE email LIKE '%mensah%'", hint: "LIKE '%mensah%'" }],
  recap: ['% = anything, _ = one character.', "'%x%' contains, 'x%' starts with, '%x' ends with.", 'PostgreSQL: ILIKE to ignore capitals.']
});
LESSONS.push({
  lv: 'w', id: 'null', t: 'Empty values: IS NULL',
  goal: 'Find and handle missing values correctly.',
  story: 'An empty line on a form is not "0" and not a space. It means "we don\'t know". Asking "is unknown equal to unknown?" gets the answer "we don\'t know" – not yes.',
  words: [['IS NULL', 'True when the cell is empty.'], ['IS NOT NULL', 'True when the cell has a value.'], ['Three-valued logic', 'In SQL a condition can be true, false or unknown. Rows are kept only when it is true.']],
  body: 'NULL means **no value**. To find it you must write **IS NULL** or **IS NOT NULL**:\n\n`SELECT company_name FROM customers WHERE phone IS NULL;`\n\n**Why not `= NULL`?** Any comparison with NULL (`=`, `<>`, `>` …) gives **unknown**, not true, so the row is never kept. `WHERE phone = NULL` returns nothing, always.\n\n**Other effects of NULL:**\n- `WHERE segment <> \'Retail\'` does **not** return rows where segment is NULL. Add `OR segment IS NULL` if you want them.\n- Maths with NULL gives NULL: `5 + NULL` is NULL.\n- `NOT IN` a list that contains NULL returns nothing.\n- In level 5 you will learn `COALESCE`, which swaps NULL for a value you choose.',
  when: 'Finding missing data (no phone, no email, no salesperson), cleaning data, avoiding wrong counts.',
  how: ["Ask: can this column be empty? (Look at the data or the table design.)", "To find empty cells, use IS NULL; to skip them, IS NOT NULL.", "Whenever you use <>, NOT IN or maths on a column that can be empty, decide what should happen to empty rows and add OR \u2026 IS NULL, or COALESCE, if needed."],
  app: [['Filter rules "is empty" and "is not empty".', 'browse', 'customers', '#addFilterBtn'], ['Empty cells show the grey word "empty".', 'browse', 'customers', '#dataGrid']],
  ex: [['SELECT company_name, phone FROM customers WHERE phone IS NULL;', 'Customers with no phone.'], ['SELECT company_name, phone FROM customers WHERE phone = NULL;', 'Always returns nothing. This is the classic mistake.'], ["SELECT company_name, segment FROM customers WHERE segment <> 'Retail' OR segment IS NULL;", 'Include empty segments on purpose.']],
  practice: [{ task: 'Show orders that have no employee_id.', answer: 'SELECT * FROM orders WHERE employee_id IS NULL', hint: 'employee_id IS NULL' }, { task: 'Show customers that do have a phone number.', answer: 'SELECT * FROM customers WHERE phone IS NOT NULL', hint: 'IS NOT NULL' }],
  quiz: [['What does WHERE phone = NULL return?', ['Rows with no phone', 'Nothing, ever', 'Every row'], 1, 'Comparisons with NULL are unknown, so no row passes. Use IS NULL.']],
  recap: ['Use IS NULL / IS NOT NULL, never = NULL.', 'Comparisons with NULL are unknown, so those rows are dropped.', 'NULL in maths gives NULL.']
});
LESSONS.push({
  lv: 'w', id: 'select-all', t: 'Checkpoint: the full SELECT so far',
  goal: 'Combine everything from levels 2 and 3 in one query.',
  story: 'You have learnt all the parts of a bike. Now you ride it.',
  words: [['Clause order', 'The order clauses must be written in: SELECT, FROM, WHERE, ORDER BY, LIMIT.']],
  body: 'Every query you have written follows this shape:\n\n```\nSELECT   columns or expressions (AS aliases)\nFROM     table\nWHERE    conditions joined with AND / OR\nORDER BY columns ASC/DESC\nLIMIT    number\n```\n\nOnly SELECT is required (FROM is required when you read a table). The others are optional but must appear **in this order**.\n\nA good habit when building a query:\n1. Start with `SELECT * FROM table LIMIT 10` to see the data.\n2. Add WHERE rules one at a time, running each time.\n3. Replace * with the columns you need.\n4. Add ORDER BY and LIMIT last.',
  when: 'Every day.',
  how: ["Say the whole question in plain words.", "Start with SELECT * FROM table LIMIT 10 to see the data.", "Add the WHERE rules one at a time, running after each one.", "Swap * for the columns you need, adding AS names and calculations.", "Add ORDER BY and LIMIT last.", "Read the answer and ask: does this make sense? Check one row by hand."],
  app: [['The Question builder shows the same shape: columns, rules, sort, limit. Press "See the SQL" to compare.', 'builder']],
  ex: [["SELECT company_name, city, segment\nFROM customers\nWHERE country = 'Ghana' AND (segment = 'Retail' OR segment = 'Wholesale')\nORDER BY city, company_name\nLIMIT 10;", 'Everything together.']],
  practice: [{ task: "Show the name and unit_price of the 3 most expensive products that are not discontinued (discontinued = 0).", answer: 'SELECT name, unit_price FROM products WHERE discontinued = 0 ORDER BY unit_price DESC LIMIT 3', hint: 'WHERE discontinued = 0 ORDER BY unit_price DESC LIMIT 3', ordered: true },
    { task: "Show id, order_date and ship_city of shipped orders going to Accra or Kumasi, newest first.", answer: "SELECT id, order_date, ship_city FROM orders WHERE status = 'shipped' AND ship_city IN ('Accra', 'Kumasi') ORDER BY order_date DESC, id", hint: "WHERE status = 'shipped' AND ship_city IN (…) ORDER BY order_date DESC" },
    { task: "Show company_name of customers in Ghana whose name starts with 'S', A→Z.", answer: "SELECT company_name FROM customers WHERE country = 'Ghana' AND company_name LIKE 'S%' ORDER BY company_name", hint: "country = 'Ghana' AND company_name LIKE 'S%'", ordered: true }],
  recap: ['SELECT … FROM … WHERE … ORDER BY … LIMIT, in that order.', 'Build queries one step at a time.']
});
