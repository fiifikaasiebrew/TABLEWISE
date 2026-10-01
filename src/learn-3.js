/*
 * Tablewise — learn-3.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Learn SQL — part 3: changing data, designing databases. Examples run on a private practice copy. */

/* ================= 7. CHANGING DATA ================= */
LESSONS.push({
  lv: 'c', id: 'insert', t: 'INSERT: adding a row',
  goal: 'Add new rows to a table.',
  story: 'Writing a new card and putting it in the box.',
  words: [['INSERT INTO', 'Adds new rows to a table.'], ['VALUES', 'The values for the new row, in brackets, in the same order as the column list.'], ['Default value', 'The value a column gets when you do not give one.']],
  body: '```\nINSERT INTO categories (name, description)\nVALUES (\'Stationery\', \'Folders and labels\');\n```\n\n- List the **columns**, then the **values in the same order**.\n- Leave out the **id**: the database fills in the next number.\n- Columns you leave out get their **default** value, or NULL.\n- Text in single quotes; numbers bare; dates as `\'YYYY-MM-DD\'`; empty as `NULL`.\n- If a rule is broken (a required column missing, a duplicate in a unique column, a link to a row that does not exist) the database refuses the row and says why.\n- Always write the column list, even if you fill every column. It keeps working if someone adds a column later.',
  anatomy: { sql: "INSERT INTO categories (name, description) VALUES ('Stationery', 'Folders');", parts: [['INSERT INTO categories', 'add to the categories table'], ['(name, description)', 'these columns'], ["VALUES ('Stationery', 'Folders')", 'with these values, in the same order']] },
  when: 'New customers, products, orders, anything new.',
  how: ['Look at the table\'s columns: which are required, which have defaults, which fill themselves (id).', 'Write the column list with the columns you are filling.', 'Write the values in the same order, in the right form.', 'Run it, then SELECT the new row to check it.'],
  app: [['Browse data tab: "Add a row" opens a form with the right box for each column.', 'browse', 'categories', '#addRowBtn'], ['Import: add many rows from a spreadsheet.', 'import']],
  ex: [["INSERT INTO categories (name, description) VALUES ('Stationery', 'Folders and labels');", 'Adds one category to the practice copy.'], ['SELECT * FROM categories;', 'See it with its new id.']],
  practice: [{ task: "Add a department named 'Research' with budget 90000 and floor 4.", answer: "INSERT INTO departments (name, budget, floor) VALUES ('Research', 90000, 4)", check: "SELECT name, budget, floor FROM departments WHERE name = 'Research'", hint: "INSERT INTO departments (name, budget, floor) VALUES (…)" }],
  recap: ['INSERT INTO table (columns) VALUES (values).', 'Skip id; missing columns get defaults.', 'Check the new row with SELECT.']
});
LESSONS.push({
  lv: 'c', id: 'insertmany', t: 'Adding many rows and copying rows',
  goal: 'Insert several rows at once, or copy rows from a query.',
  story: 'Instead of posting one card at a time, you post a whole stack.',
  words: [['Multi-row INSERT', 'Several value brackets separated by commas.'], ['INSERT … SELECT', 'Inserts the rows returned by a query.']],
  body: '**Several rows:**\n```\nINSERT INTO departments (name, budget, floor)\nVALUES (\'Research\', 95000, 4),\n       (\'Training\', 60000, 2);\n```\n\n**Copy from a query:**\n```\nINSERT INTO categories (name, description)\nSELECT \'Archive \' || name, description FROM categories WHERE id = 1;\n```\nThe SELECT must return the same number of columns, in the same order, as the column list.',
  when: 'Loading lists, making archive copies, filling a new table from existing data.',
  how: ['Prepare the values (or the SELECT) and run the SELECT alone first to see exactly what will be inserted.', 'Match the column list and value order.', 'For big loads, wrap it in a transaction (two lessons ahead) so it is all or nothing.', 'Count rows before and after.'],
  app: [['Import a file tab: turns a CSV or Excel file into many INSERTs in one transaction.', 'import']],
  ex: [["INSERT INTO departments (name, budget, floor) VALUES ('Research', 95000, 4), ('Training', 60000, 2);", 'Two rows at once.'], ['SELECT * FROM departments;', 'Check them.']],
  practice: [{ task: "Add two categories in one statement: ('Toys', 'Games and puzzles') and ('Garden', 'Plants and tools').", answer: "INSERT INTO categories (name, description) VALUES ('Toys', 'Games and puzzles'), ('Garden', 'Plants and tools')", check: "SELECT name, description FROM categories WHERE name IN ('Toys', 'Garden')", hint: 'VALUES (…), (…)' }],
  recap: ['VALUES (…), (…), (…) adds several rows.', 'INSERT INTO … SELECT copies query results.']
});
LESSONS.push({
  lv: 'c', id: 'update', t: 'UPDATE: changing rows',
  goal: 'Change values in existing rows safely.',
  story: 'Rubbing out one line on a card and writing something new.',
  words: [['UPDATE', 'Changes values in existing rows.'], ['SET', 'Lists the columns to change and their new values.']],
  body: '```\nUPDATE orders\nSET status = \'delivered\'\nWHERE id = 5;\n```\n\n- **WHERE decides which rows change. Without WHERE, every row changes.**\n- Several columns: `SET status = \'shipped\', ship_city = \'Accra\'`.\n- Use the old value: `SET unit_price = unit_price * 1.05` raises prices by 5%.\n- The database reports how many rows changed. If it is not what you expected, stop and check.',
  anatomy: { sql: "UPDATE orders SET status = 'delivered' WHERE id = 5;", parts: [['UPDATE orders', 'change the orders table'], ["SET status = 'delivered'", 'set status to delivered'], ['WHERE id = 5', 'only for order 5']] },
  when: 'Fixing typos, changing prices, marking orders delivered, cleaning imported data.',
  how: ['Write a SELECT with the WHERE you plan to use and check exactly which rows it returns.', 'Turn it into UPDATE … SET … with the same WHERE.', 'Check the "rows changed" number.', 'SELECT again to confirm.', 'On important data, do it inside a transaction or after a backup.'],
  app: [['Browse data tab: double-click a cell to change it, or right-click a row to edit it as a form.', 'browse', 'products', '#dataGrid'], ['Tablewise warns before running an UPDATE without WHERE, and Undo appears for database files.', 'sql']],
  ex: [["UPDATE orders SET status = 'delivered' WHERE id = 5;", 'One order.'], ['SELECT id, status FROM orders WHERE id = 5;', 'Check it.'], ['UPDATE products SET unit_price = ROUND(unit_price * 1.05, 2) WHERE category_id = 1;', 'Raise one category\'s prices by 5%.']],
  mistakes: ['Forgetting WHERE: every row changes.', 'Running the UPDATE twice when using old values (prices go up 5% twice).'],
  practice: [{ task: 'Set the unit_price of the product with id 1 to 20.', answer: 'UPDATE products SET unit_price = 20 WHERE id = 1', check: 'SELECT id, unit_price FROM products ORDER BY id', hint: 'UPDATE products SET unit_price = 20 WHERE id = 1' }, { task: "Mark every 'pending' order in ship_city 'Accra' as 'shipped'.", answer: "UPDATE orders SET status = 'shipped' WHERE status = 'pending' AND ship_city = 'Accra'", check: 'SELECT id, status FROM orders ORDER BY id', hint: "SET status = 'shipped' WHERE status = 'pending' AND ship_city = 'Accra'" }],
  recap: ['UPDATE table SET col = value WHERE rule.', 'Test the WHERE with SELECT first.', 'No WHERE = every row.']
});
LESSONS.push({
  lv: 'c', id: 'delete', t: 'DELETE, TRUNCATE and DROP',
  goal: 'Remove rows safely, and know the difference from emptying or deleting a table.',
  story: 'DELETE takes some cards out. TRUNCATE empties the box. DROP throws the box away.',
  words: [['DELETE FROM', 'Removes rows that match WHERE (all rows if there is no WHERE).'], ['TRUNCATE TABLE', 'Empties a whole table quickly (not in SQLite; use DELETE FROM there).'], ['DROP TABLE', 'Deletes the table itself, with all its rows and its design.'], ['Cascade', 'A link rule that deletes the linked rows too (set when designing tables).']],
  body: '```\nDELETE FROM orders\nWHERE status = \'cancelled\' AND order_date < \'2025-03-01\';\n```\n\n- **Always test the WHERE with a SELECT first.**\n- Links protect you: deleting a customer who still has orders is refused ("FOREIGN KEY constraint failed"). Delete or move the orders first – or the link was designed with ON DELETE CASCADE, which deletes them automatically (be careful).\n- **Soft delete**: many companies never really delete. They UPDATE a column such as `is_active = 0` so history is kept.\n- On a server there is **no undo**. Backups and transactions are your safety net.',
  when: 'Removing test data, cancelled records, duplicates, old data you are allowed to delete.',
  how: ['SELECT with the planned WHERE and read the rows.', 'COUNT them and write the number down.', 'Run DELETE with exactly the same WHERE.', 'Check that "rows deleted" matches your number.', 'If a link blocks you, decide: delete the linked rows first, or keep the row and mark it inactive.'],
  app: [['Browse data tab: tick rows, then Delete. It asks first, and Undo appears for database files.', 'browse', 'categories', '#dataGrid'], ['Table design tab: "Empty table" and "Delete table" ask you to type the name to be sure.', 'design', 'categories']],
  ex: [["SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND order_date < '2025-03-01';", 'Step 1: how many will go?'], ["DELETE FROM orders WHERE status = 'cancelled' AND order_date < '2025-03-01';", 'Step 2: delete exactly those. (Their order_items go too, because that link was designed with ON DELETE CASCADE.)'], ['DELETE FROM customers WHERE id = 1;', 'Refused: this customer still has orders.']],
  practice: [{ task: 'Delete order_items rows whose quantity is 1.', answer: 'DELETE FROM order_items WHERE quantity = 1', check: 'SELECT COUNT(*) FROM order_items', hint: 'DELETE FROM order_items WHERE quantity = 1' }],
  recap: ['DELETE FROM t WHERE …; test with SELECT first.', 'TRUNCATE empties, DROP removes the table.', 'Consider "soft delete" with an is_active column.']
});
LESSONS.push({
  lv: 'c', id: 'tx', t: 'Transactions: all or nothing',
  goal: 'Group changes so they all happen, or none do.',
  story: 'Swapping toys with a friend: you give yours AND get theirs. Nobody wants a swap that stops halfway.',
  words: [['Transaction', 'A group of statements treated as one unit.'], ['BEGIN', 'Starts a transaction (START TRANSACTION in MySQL, BEGIN TRANSACTION in SQL Server).'], ['COMMIT', 'Saves all changes of the transaction.'], ['ROLLBACK', 'Cancels all changes of the transaction.'], ['ACID', 'The four promises of transactions: Atomic (all or nothing), Consistent (rules kept), Isolated (others do not see half-done work), Durable (saved changes survive crashes).']],
  body: '```\nBEGIN;\nUPDATE products SET units_in_stock = units_in_stock - 5 WHERE id = 1;\nUPDATE products SET units_in_stock = units_in_stock + 5 WHERE id = 2;\nCOMMIT;\n```\n\nIf anything goes wrong before COMMIT, run **ROLLBACK** and it is as if nothing happened. If the computer crashes in the middle, the database rolls back by itself.\n\nWithout BEGIN, most databases treat **each statement as its own tiny transaction** (auto-commit).\n\nUse a transaction for anything where half-done would be a mess: moving money or stock, importing, changing several related tables.',
  when: 'Moving amounts between rows, loading files, multi-step fixes, anything that must not stop halfway.',
  how: ['Write BEGIN.', 'Run the changes one by one.', 'Check the results with SELECT (you see your own changes).', 'If all is right, COMMIT. If not, ROLLBACK.', 'Keep transactions short: while open, other people may have to wait.'],
  app: [['Import always runs as one transaction: if one row fails, nothing is added.', 'import'], ['SQL editor → Function library → "Transactions".', 'sql', null, '#sqlLib']],
  ex: [['BEGIN;\nUPDATE products SET units_in_stock = units_in_stock - 5 WHERE id = 1;\nUPDATE products SET units_in_stock = units_in_stock + 5 WHERE id = 2;\nCOMMIT;', 'Move 5 units of stock.'], ['BEGIN;\nDELETE FROM order_items;\nROLLBACK;', 'Deletes everything… then cancels. Nothing is lost.'], ['SELECT COUNT(*) FROM order_items;', 'Still all there.']],
  quiz: [['During a transaction you realise you updated the wrong rows. What do you run?', ['COMMIT', 'ROLLBACK', 'DELETE'], 1, 'ROLLBACK cancels everything since BEGIN.']],
  recap: ['BEGIN … COMMIT saves all; ROLLBACK cancels all.', 'Use for multi-step changes.']
});
LESSONS.push({
  lv: 'c', id: 'upsert', t: 'Insert or update (upsert)',
  goal: 'Add a row, or update it if it already exists.',
  story: '"Put this card in the box, but if a card with the same number is already there, just update that one."',
  words: [['Upsert', 'Insert-or-update in one statement.'], ['ON CONFLICT', 'SQLite and PostgreSQL: what to do when a unique value already exists.'], ['excluded', 'In ON CONFLICT, the row you tried to insert.']],
  body: 'SQLite and PostgreSQL:\n```\nINSERT INTO products (sku, name, category_id, unit_price, units_in_stock)\nVALUES (\'NW-1000\', \'Ghana Arabica Coffee 1kg\', 1, 19.5, 100)\nON CONFLICT (sku) DO UPDATE SET unit_price = excluded.unit_price;\n```\nThe column in ON CONFLICT must be unique (here sku).\n\nOther databases:\n- MySQL: `… ON DUPLICATE KEY UPDATE unit_price = VALUES(unit_price)`\n- SQL Server: `MERGE INTO products t USING (…) s ON t.sku = s.sku WHEN MATCHED THEN UPDATE … WHEN NOT MATCHED THEN INSERT …`\n\n`ON CONFLICT DO NOTHING` simply skips rows that already exist.',
  when: 'Syncing price lists, loading data that may already exist, "save" buttons in apps.',
  how: ['Find the column that identifies a row uniquely (a code, email, sku).', 'Make sure it has a UNIQUE rule.', 'Write the INSERT, then the conflict part saying which columns to update.', 'Test with one new code and one existing code.'],
  app: [['SQL editor → Function library → "Insert or update (upsert)" shows the version for your database.', 'sql', null, '#sqlLib']],
  ex: [["INSERT INTO products (sku, name, category_id, unit_price, units_in_stock) VALUES ('NW-1000', 'Ghana Arabica Coffee 1kg', 1, 19.5, 100) ON CONFLICT (sku) DO UPDATE SET unit_price = excluded.unit_price;", 'NW-1000 exists, so its price is updated.'], ["SELECT sku, name, unit_price FROM products WHERE sku = 'NW-1000';", 'Check.']],
  recap: ['Upsert = insert, or update when the unique value exists.', 'ON CONFLICT (SQLite/PostgreSQL), ON DUPLICATE KEY (MySQL), MERGE (SQL Server).']
});
LESSONS.push({
  lv: 'c', id: 'safety', t: 'Safe habits when changing data',
  goal: 'Never lose data by accident.',
  story: 'Measure twice, cut once.',
  words: [['Backup', 'A copy of the database you can go back to.'], ['Read-only', 'A mode or account that can look but not change.'], ['Audit log', 'A record of who changed what and when.']],
  body: '1. **SELECT before UPDATE/DELETE**, with the same WHERE.\n2. **Change one row by its id** when you mean one row.\n3. **Use transactions** for anything with several steps.\n4. **Back up** before big changes (and have automatic backups on servers).\n5. **Use read-only** accounts or modes when you only need to look, especially on live company data.\n6. **Try on a copy first** (a test database) when the change is risky.\n7. **Keep a record** of what you ran and why.\n8. **Never run SQL you do not understand**, even if it came from the internet or an AI. Read it first.',
  when: 'Always, and especially on company servers, where there is no undo.',
  how: ['Before any change: what exactly will change, and how will I undo it if wrong?', 'If you cannot answer the second part, make a backup or use a transaction first.'],
  app: [['Settings: Read-only mode.', 'settings', null, '#setRO'], ['Change history: every change with its exact SQL.', 'activity'], ['Open a database screen: "Save a copy" backs up a database file.', 'connect'], ['Learn SQL itself uses a practice copy, so you can experiment safely.', 'learn']],
  quiz: [['Before running DELETE … WHERE, you should…', ['run it twice', 'run SELECT with the same WHERE and check the rows', 'turn off the computer'], 1, 'Seeing exactly what will go is the best protection.']],
  recap: ['SELECT first, transactions, backups, read-only, test copies, read before you run.']
});

/* ================= 8. DESIGNING DATABASES ================= */
LESSONS.push({
  lv: 'd', id: 'create', t: 'CREATE TABLE',
  goal: 'Create a new table with columns and types.',
  story: 'Building a new box and printing the lines on the cards before any card goes in.',
  words: [['CREATE TABLE', 'Makes a new table.'], ['Column definition', 'A column name followed by its type and rules, like name TEXT NOT NULL.'], ['DDL', 'Data Definition Language: the SQL that designs tables (CREATE, ALTER, DROP). SELECT/INSERT/UPDATE/DELETE are DML (Data Manipulation Language).']],
  body: '```\nCREATE TABLE suppliers (\n  id      INTEGER PRIMARY KEY AUTOINCREMENT,\n  name    TEXT NOT NULL,\n  country TEXT,\n  rating  INTEGER\n);\n```\n\n- One line per column: **name, type, rules**, separated by commas.\n- The **first column** is usually the auto-numbered id.\n- Auto-numbering is written differently per database: `INTEGER PRIMARY KEY AUTOINCREMENT` (SQLite), `INTEGER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY` or `SERIAL PRIMARY KEY` (PostgreSQL), `INT AUTO_INCREMENT PRIMARY KEY` (MySQL), `INT IDENTITY(1,1) PRIMARY KEY` (SQL Server).\n- `CREATE TABLE IF NOT EXISTS …` does nothing if the table is already there.\n- Table names: plural nouns in lowercase (`suppliers`, `invoices`).',
  anatomy: { sql: 'CREATE TABLE suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);', parts: [['CREATE TABLE suppliers', 'make a table called suppliers'], ['id INTEGER PRIMARY KEY AUTOINCREMENT', 'an auto-numbered id'], ['name TEXT NOT NULL', 'a required text column']] },
  when: 'A new kind of thing to keep track of: suppliers, invoices, tasks, bookings.',
  how: ['Name the thing (plural): suppliers.', 'List every fact you need about one of them.', 'Choose a type for each fact.', 'Decide which facts are required, unique, or have a default.', 'Add an auto-numbered id first, and foreign keys for anything it belongs to.', 'Write CREATE TABLE, run it, then insert a test row.'],
  app: [['Table design tab: "Create a new table" builds CREATE TABLE for you, with templates like Contacts and Tasks.', 'design', null, '#createTableBtn']],
  ex: [['CREATE TABLE suppliers (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  country TEXT,\n  rating INTEGER\n);', 'A new table in the practice copy.'], ["INSERT INTO suppliers (name, country, rating) VALUES ('Coastal Coffee Co', 'Ghana', 5);", 'Put a row in.'], ['SELECT * FROM suppliers;', 'See it.']],
  practice: [{ task: 'Create a table called tasks with an auto-numbered id, a required text title, and a done column of type INTEGER.', answer: 'CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER)', check: "SELECT name, type, \"notnull\", pk FROM pragma_table_info('tasks') ORDER BY cid", hint: 'CREATE TABLE tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER)' }],
  recap: ['CREATE TABLE name (column type rules, …).', 'Start with an auto-numbered id.']
});
LESSONS.push({
  lv: 'd', id: 'types', t: 'Choosing data types well',
  goal: 'Pick the right type for every column in any database.',
  story: 'Different boxes for different things: words, numbers, dates. Put things in the wrong box and they break.',
  words: [['VARCHAR(n)', 'Text up to n characters.'], ['TEXT', 'Text of any length.'], ['INTEGER / BIGINT', 'Whole numbers (BIGINT for very large ones).'], ['DECIMAL(p, s) / NUMERIC', 'Exact decimals: p digits in total, s after the point. Use for money.'], ['REAL / FLOAT', 'Approximate decimals. Fine for measurements, not for money.'], ['BOOLEAN / BIT', 'True/false.'], ['DATE / TIMESTAMP / DATETIME', 'A day / a day and time.']],
  body: '- **Names, emails, codes** → VARCHAR(255) or TEXT\n- **Long notes** → TEXT (NVARCHAR(MAX) in SQL Server)\n- **Counts, quantities, ids** → INTEGER\n- **Money** → DECIMAL(12,2). Never FLOAT: 0.1 + 0.2 is not exactly 0.3 in FLOAT.\n- **Measurements** → DECIMAL or REAL\n- **Yes/No** → BOOLEAN (PostgreSQL), BIT (SQL Server), TINYINT(1) (MySQL), INTEGER 0/1 (SQLite)\n- **Dates** → DATE; **date and time** → TIMESTAMP / DATETIME / DATETIME2\n- **Phone numbers, postcodes, ID numbers** → text, not numbers (they have leading zeros and + signs, and you never do maths on them).\n\nSQLite is relaxed and will store anything anywhere; other databases enforce types strictly. Design as if it were strict.',
  when: 'Every time you add a column.',
  how: ['Ask: will I do maths on it? If not, it is probably text (phone numbers!).', 'Money → DECIMAL with 2 places.', 'Dates → a date type, never text in your own format.', 'Choose the smallest type that surely fits, but do not be stingy with text lengths.'],
  app: [['Table design tab: "Kind of data" offers friendly choices and picks the right type for your database.', 'design', 'products']],
  quiz: [['Best type for a phone number like +233 24 123 4567?', ['INTEGER', 'Text (VARCHAR)', 'DECIMAL'], 1, 'It has + and spaces, may start with 0, and you never add phone numbers.'], ['Best type for prices?', ['FLOAT', 'DECIMAL(12,2)', 'TEXT'], 1, 'DECIMAL is exact, so pennies are never lost.']],
  recap: ['Text for words and codes (including phone numbers).', 'DECIMAL for money, INTEGER for counts, DATE/TIMESTAMP for time.']
});
LESSONS.push({
  lv: 'd', id: 'constraints', t: 'Rules: NOT NULL, UNIQUE, DEFAULT, CHECK',
  goal: 'Make the database refuse bad data.',
  story: 'A form that will not let you hand it in without your name, and will not accept "13" in the month box.',
  words: [['Constraint', 'A rule on a column or table that the database enforces.'], ['NOT NULL', 'Required: cannot be empty.'], ['UNIQUE', 'No two rows may share the value.'], ['DEFAULT', 'The value used when none is given.'], ['CHECK (rule)', 'Your own rule, like CHECK (stars BETWEEN 1 AND 5).']],
  body: '```\nCREATE TABLE reviews (\n  id         INTEGER PRIMARY KEY,\n  product_id INTEGER NOT NULL REFERENCES products(id),\n  email      TEXT UNIQUE,\n  stars      INTEGER CHECK (stars BETWEEN 1 AND 5),\n  note       TEXT DEFAULT \'\'\n);\n```\n\nRules in the database are better than rules in an app, because they protect the data **no matter who** writes to it: the app, an import, a colleague typing SQL.\n\nWhen a rule is broken, the statement fails with an error naming the rule. Tablewise translates these errors into plain words.',
  when: 'Designing any table: decide the rules at the start.',
  how: ['For each column ask: must it always have a value? (NOT NULL)', 'Must it be different for every row? (UNIQUE)', 'Is there a sensible starting value? (DEFAULT)', 'Is there a range or list of allowed values? (CHECK)', 'Test by inserting a row that breaks each rule and making sure it is refused.'],
  app: [['Table design tab: Required, No duplicates and Default when adding columns.', 'design', 'customers']],
  ex: [["CREATE TABLE reviews (\n  id INTEGER PRIMARY KEY,\n  product_id INTEGER NOT NULL REFERENCES products(id),\n  email TEXT UNIQUE,\n  stars INTEGER CHECK (stars BETWEEN 1 AND 5),\n  note TEXT DEFAULT ''\n);", 'Run this first.'], ['INSERT INTO reviews (product_id, stars) VALUES (1, 9);', 'Refused on purpose: 9 stars breaks the CHECK rule.'], ['INSERT INTO reviews (product_id, stars) VALUES (1, 5);', 'Accepted.']],
  mistakes: ['Adding rules later to a table that already holds bad data: the database refuses until the data is fixed.'],
  recap: ['NOT NULL, UNIQUE, DEFAULT, CHECK keep bad data out.', 'Database rules protect data from every source.']
});
LESSONS.push({
  lv: 'd', id: 'fkdesign', t: 'Designing links: FOREIGN KEY and ON DELETE',
  goal: 'Create links and decide what happens when a linked row is deleted.',
  story: 'If a club closes, what happens to its members\' cards? Keep them, throw them away too, or cross out the club name?',
  words: [['REFERENCES', 'Makes a column a foreign key to another table\'s key.'], ['ON DELETE RESTRICT / NO ACTION', 'Refuse to delete a row that others still point to (the default).'], ['ON DELETE CASCADE', 'Delete the pointing rows too.'], ['ON DELETE SET NULL', 'Empty the pointing column instead.']],
  body: '```\nCREATE TABLE invoices (\n  id          INTEGER PRIMARY KEY,\n  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,\n  amount      DECIMAL(12,2) NOT NULL\n);\n```\n\nOr at the end of the table: `FOREIGN KEY (customer_id) REFERENCES customers(id)`.\n\n**Choosing ON DELETE:**\n- **RESTRICT** (default): safest. You cannot delete a customer who has invoices.\n- **CASCADE**: for "parts of" something. Deleting an order deletes its order lines (that is how the practice data is set up).\n- **SET NULL**: the link is optional, like an order\'s salesperson leaving the company.\n\nSQLite only enforces foreign keys when `PRAGMA foreign_keys = ON` is set; Tablewise turns it on for you.',
  when: 'Every time one table belongs to another.',
  how: ['For each "belongs to", add a column named other_id with the same type as the other table\'s id.', 'Add REFERENCES other(id).', 'Decide ON DELETE: parts → CASCADE, optional link → SET NULL, everything else → RESTRICT.', 'Add an index on the foreign key column for fast joins (lesson on indexes).'],
  app: [['Table design tab → "Add a column" → kind "Link to another table".', 'design', 'orders'], ['Table design tab: "Links from this table" and "Links into this table".', 'design', 'orders']],
  ex: [['CREATE TABLE invoices (\n  id INTEGER PRIMARY KEY,\n  customer_id INTEGER NOT NULL REFERENCES customers(id),\n  amount DECIMAL(12,2) NOT NULL\n);', 'An invoice belongs to a customer.'], ['INSERT INTO invoices (customer_id, amount) VALUES (9999, 10);', 'Refused: there is no customer 9999.']],
  recap: ['REFERENCES makes a link the database protects.', 'ON DELETE: RESTRICT (safe), CASCADE (parts), SET NULL (optional).']
});
LESSONS.push({
  lv: 'd', id: 'alter', t: 'Changing and removing tables: ALTER and DROP',
  goal: 'Add, rename and remove columns and tables.',
  story: 'Adding a new printed line to every card already in the box, or throwing the box away.',
  words: [['ALTER TABLE', 'Changes a table\'s design.'], ['ADD COLUMN / RENAME COLUMN / DROP COLUMN', 'Add, rename or remove a column.'], ['DROP TABLE', 'Deletes a whole table.']],
  body: '- `ALTER TABLE customers ADD COLUMN vip INTEGER DEFAULT 0;` (SQL Server: `ADD vip INT DEFAULT 0`)\n- `ALTER TABLE customers RENAME COLUMN segment TO customer_type;` (SQL Server: `EXEC sp_rename \'customers.segment\', \'customer_type\', \'COLUMN\'`)\n- `ALTER TABLE customers DROP COLUMN phone;`\n- `ALTER TABLE categories RENAME TO product_groups;` (MySQL: `RENAME TABLE …`)\n- `DROP TABLE IF EXISTS old_stuff;`\n\n**Things that depend on names** (saved queries, views, apps) break when you rename or drop. Check before you change.\n\nChanging a column\'s **type** is `ALTER COLUMN` / `MODIFY` in most databases; SQLite cannot do it directly (tools rebuild the table for you).',
  when: 'When needs change: a new field, a clearer name, a column nobody uses.',
  how: ['Search for everything that uses the table or column (reports, views, apps).', 'Back up first.', 'Make the change.', 'Update or test everything that used the old name.'],
  app: [['Table design tab: Add a column, Rename, Remove, Rename table, Delete table.', 'design', 'customers']],
  ex: [['ALTER TABLE customers ADD COLUMN vip INTEGER DEFAULT 0;', 'New column on every row.'], ['SELECT company_name, vip FROM customers LIMIT 3;', 'Everyone got the default 0.'], ['ALTER TABLE customers DROP COLUMN vip;', 'And gone again.']],
  practice: [{ task: 'Add a column called notes of type TEXT to the products table.', answer: 'ALTER TABLE products ADD COLUMN notes TEXT', check: "SELECT name, type FROM pragma_table_info('products') ORDER BY cid", hint: 'ALTER TABLE products ADD COLUMN notes TEXT' }],
  recap: ['ALTER TABLE … ADD / RENAME / DROP COLUMN.', 'DROP TABLE removes everything. Check what depends on it first.']
});
LESSONS.push({
  lv: 'd', id: 'normal', t: 'Good design: normalisation',
  goal: 'Design tables that do not repeat facts or tangle them.',
  story: 'A tidy toy chest: cars with cars, dolls with dolls, and a note saying which doll belongs to whom, instead of dolls glued to cars.',
  words: [['First normal form (1NF)', 'One value per cell; no lists in a cell; no repeating columns like product1, product2.'], ['Second normal form (2NF)', 'Every fact depends on the whole key, not part of it.'], ['Third normal form (3NF)', 'Facts depend only on the key, not on other non-key columns.'], ['Denormalise', 'Deliberately repeat some data for speed, knowing the cost.']],
  body: '**Signs of a problem, and the fix:**\n\n- A cell holds a list (`"coffee, tea, rice"`) → make a separate table with one row per item. *(1NF)*\n- Columns like `phone1, phone2, phone3` → a `phones` table. *(1NF)*\n- `order_items` stores the product\'s **category name** → it depends on the product, not the order line; keep it in products/categories only. *(2NF)*\n- `customers` stores `city` and `city_population` → population depends on the city, not the customer; move it to a cities table. *(3NF)*\n\n**A simple test:** if a fact changes, how many rows must you update? The answer should be **one**.\n\n**The practice data** is normalised: order_items keeps its own `unit_price` on purpose, because the price *at the time of sale* is a fact about the sale, not the product.',
  when: 'Designing a new database or fixing a messy one.',
  how: ['List the things (nouns) and give each a table.', 'Put only facts about that thing in its table.', 'Split out anything that repeats or is a list.', 'Link with foreign keys.', 'Test: each changing fact is updated in exactly one row.'],
  app: [['Home screen: see how the practice company is split into 7 linked tables.', 'home']],
  quiz: [['A column "products" holding "coffee, tea" breaks which rule?', ['1NF: one value per cell', '3NF', 'None'], 0, 'A list in a cell belongs in its own table.'], ['Customers store city_population. Where should it go?', ['Stay in customers', 'A cities table', 'orders'], 1, 'Population is a fact about the city.']],
  recap: ['One value per cell, no repeating columns.', 'Each fact about the thing its table is about.', 'A change should touch one row.']
});
LESSONS.push({
  lv: 'd', id: 'designproj', t: 'Designing a database step by step',
  goal: 'Go from a real-life description to working tables.',
  story: 'A small library wants to know which member has borrowed which book, and when it is due back.',
  words: [['Entity', 'A "thing" the database is about: member, book, loan.'], ['ER diagram', 'A drawing of the tables and their links.']],
  body: '**1. Find the things (entities):** members, books, loans.\n\n**2. List the facts:**\n- members: name, phone, joined date\n- books: title, author, isbn\n- loans: which member, which book, borrowed date, due date, returned date\n\n**3. Relationships:** a member has many loans; a book has many loans (over time). So loans links members and books (like order_items links orders and products).\n\n**4. Types and rules:** isbn unique; due date required; returned date can be empty (still out).\n\n**5. Write it:**\n```\nCREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, joined DATE);\nCREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT, isbn TEXT UNIQUE);\nCREATE TABLE loans (\n  id INTEGER PRIMARY KEY,\n  member_id INTEGER NOT NULL REFERENCES members(id),\n  book_id INTEGER NOT NULL REFERENCES books(id),\n  borrowed DATE NOT NULL, due DATE NOT NULL, returned DATE\n);\n```\n\n**6. Test with questions:** "which books are overdue?" → `WHERE returned IS NULL AND due < DATE(\'now\')`. If a question is hard to answer, the design may need changing.',
  when: 'Starting any new system: a shop, a school, a clinic, a project tracker.',
  how: ['Write a paragraph describing the business in plain words.', 'Underline the nouns: they are tables. The describing words are columns.', 'Find "has many" / "belongs to" sentences: they are links.', 'Choose types and rules.', 'Create, add a few test rows, and try the questions people will ask.'],
  app: [['Table design tab: create each table with "Create a new table", using "Link to another table" for links.', 'design', null, '#createTableBtn']],
  ex: [["CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT, joined DATE);\nCREATE TABLE books (id INTEGER PRIMARY KEY, title TEXT NOT NULL, author TEXT, isbn TEXT UNIQUE);\nCREATE TABLE loans (id INTEGER PRIMARY KEY, member_id INTEGER NOT NULL REFERENCES members(id), book_id INTEGER NOT NULL REFERENCES books(id), borrowed DATE NOT NULL, due DATE NOT NULL, returned DATE);\nINSERT INTO members (name) VALUES ('Abena'), ('Yaw');\nINSERT INTO books (title, isbn) VALUES ('The Bee Keeper', '111'), ('River Songs', '222');\nINSERT INTO loans (member_id, book_id, borrowed, due) VALUES (1, 2, '2026-08-01', '2026-08-15'), (2, 1, '2026-09-20', '2026-10-04');", 'Build the library and add test data.'], ["SELECT m.name, b.title, l.due FROM loans l JOIN members m ON m.id = l.member_id JOIN books b ON b.id = l.book_id WHERE l.returned IS NULL AND l.due < DATE('now');", 'Which books are overdue?']],
  recap: ['Nouns → tables, facts → columns, "has many" → links.', 'Test the design with the real questions.']
});
LESSONS.push({
  lv: 'd', id: 'index', t: 'Indexes: making searches fast',
  goal: 'Know what an index is, when to add one and when not to.',
  story: 'The index at the back of a book. Without it, you read every page to find "dinosaurs".',
  words: [['Index', 'A sorted lookup the database keeps for a column, so it can jump to rows instead of reading them all.'], ['Unique index', 'An index that also forbids repeats.'], ['Composite index', 'An index on several columns together, in a set order.']],
  body: '`CREATE INDEX idx_orders_customer ON orders (customer_id);`\n\n**Speeds up:** WHERE on that column, JOINs on it, ORDER BY it.\n**Costs:** a little disk space, and every INSERT/UPDATE/DELETE has to update the index too.\n\n**Good candidates:**\n- Foreign key columns (customer_id, product_id).\n- Columns you filter by a lot (status, order_date, email).\n\n**Poor candidates:** tiny tables, columns with only 2–3 different values on their own, columns you never search.\n\n**Composite:** `CREATE INDEX idx ON orders (status, order_date)` helps `WHERE status = … AND order_date > …`, and `WHERE status = …` alone, but not `WHERE order_date > …` alone (order matters, like a phone book sorted by surname then first name).\n\nPrimary keys and UNIQUE columns get an index automatically.',
  when: 'Tables with thousands of rows or more that feel slow when filtering, joining or sorting.',
  how: ['Find the slow query.', 'Look at its WHERE, JOIN and ORDER BY columns.', 'Check the query plan (level 10): does it "scan" the whole table?', 'Add an index on the column used to find rows.', 'Run the plan again and time the query.', 'Do not index everything: each index slows down writes.'],
  app: [['Table design tab: "Make searching faster" next to a column adds an index.', 'design', 'orders'], ['SQL editor: "How will it run?" shows whether an index is used.', 'sql']],
  ex: [['EXPLAIN QUERY PLAN SELECT * FROM orders WHERE ship_city = \'Accra\';', 'Before: SCAN (reads every row).'], ['CREATE INDEX idx_orders_city ON orders (ship_city);', 'Add the index.'], ['EXPLAIN QUERY PLAN SELECT * FROM orders WHERE ship_city = \'Accra\';', 'After: SEARCH … USING INDEX.']],
  recap: ['Indexes speed up finding, joining and sorting.', 'They slow down writes slightly.', 'Index foreign keys and frequently filtered columns.']
});
LESSONS.push({
  lv: 'd', id: 'views', t: 'Views: saved questions',
  goal: 'Save a query so it can be used like a table.',
  story: 'A window into the toy chest that always shows the same corner, even when toys move.',
  words: [['View', 'A saved SELECT with a name. Querying it runs the saved SELECT with the latest data.'], ['Materialised view', 'A view whose result is stored and refreshed on demand (PostgreSQL, Oracle; indexed views in SQL Server).']],
  body: '```\nCREATE VIEW order_totals AS\nSELECT order_id, SUM(quantity * unit_price) AS total\nFROM order_items\nGROUP BY order_id;\n```\n\nThen: `SELECT * FROM order_totals WHERE total > 500;`\n\n- A view stores the **question**, not the answer, so it is always up to date.\n- Great for hiding complicated joins behind a simple name, and for giving people access to only some columns.\n- `DROP VIEW order_totals;` removes it; the real data is untouched.\n- Most views are read-only.',
  when: 'Reports people use often, standard definitions ("what counts as revenue"), limiting what people can see.',
  how: ['Write and test the SELECT until it is right.', 'Put CREATE VIEW name AS in front.', 'Use the view like a table in other queries.', 'Name it clearly and document what it means.'],
  app: [['Question builder: after "Get the answer", press "Save as a view".', 'builder'], ['Views appear in the tree under "Saved views".', 'home', null, '#tree']],
  ex: [['CREATE VIEW order_totals AS SELECT order_id, SUM(quantity * unit_price) AS total FROM order_items GROUP BY order_id;', 'Save the question.'], ['SELECT * FROM order_totals ORDER BY total DESC LIMIT 5;', 'Use it like a table.']],
  practice: [{ task: 'Create a view called ghana_customers showing all columns of customers in Ghana.', answer: "CREATE VIEW ghana_customers AS SELECT * FROM customers WHERE country = 'Ghana'", check: 'SELECT * FROM ghana_customers', hint: "CREATE VIEW ghana_customers AS SELECT * FROM customers WHERE country = 'Ghana'" }],
  recap: ['CREATE VIEW name AS SELECT …', 'A view is a saved question; always fresh.']
});
