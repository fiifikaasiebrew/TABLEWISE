/*
 * Tablewise — learn-2.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Learn SQL — part 2: totals and groups, working with values, connecting tables. */

/* ================= 4. TOTALS AND GROUPS ================= */
LESSONS.push({
  lv: 'g', id: 'count', t: 'Counting rows: COUNT',
  goal: 'Answer "how many?" questions.',
  story: 'Tip the cards out of a box and count them.',
  words: [['Function', 'A named tool that takes something in brackets and gives back an answer, like COUNT(*). Level 5 has many more.'], ['Aggregate function', 'A function that squashes many rows into one answer: COUNT, SUM, AVG, MIN, MAX.'], ['COUNT(*)', 'How many rows.'], ['COUNT(column)', 'How many rows where that column is not empty (not NULL).'], ['COUNT(DISTINCT column)', 'How many different values.']],
  body: 'A **function** is written as a name followed by brackets: `COUNT(*)`. What goes in the brackets is its **input**; the function gives back one **output**.\n\n**COUNT** is an **aggregate function**: it looks at many rows and returns one number.\n\n- `SELECT COUNT(*) FROM customers;` → how many customers.\n- `SELECT COUNT(phone) FROM customers;` → how many customers **have** a phone (empty ones are skipped).\n- `SELECT COUNT(DISTINCT country) FROM customers;` → how many different countries.\n- With WHERE: `SELECT COUNT(*) FROM orders WHERE status = \'pending\';` counts only the rows that pass the filter.\n\nName the answer with AS, or the heading will be something like `COUNT(*)`.',
  anatomy: { sql: "SELECT COUNT(*) AS pending FROM orders WHERE status = 'pending';", parts: [['COUNT(*)', 'count the rows…'], ['AS pending', '…and call the answer pending'], ["WHERE status = 'pending'", 'but only rows that are pending']] },
  when: 'How many customers, orders today, products out of stock, countries we sell to.',
  how: ['Say the question as "how many … are there (that …)?".', 'Find the table that holds one row per thing you are counting.', 'Put the "that …" part in WHERE.', 'Choose COUNT(*) for rows, COUNT(column) for rows with a value, COUNT(DISTINCT column) for different values.', 'Name it with AS.'],
  app: [['The Home screen and the tree show row counts for every table.', 'home', null, '#tree'], ['Question builder: "+ Count".', 'builder']],
  ex: [['SELECT COUNT(*) AS customers FROM customers;', 'All customers.'], ['SELECT COUNT(phone) AS with_phone, COUNT(*) AS everyone FROM customers;', 'COUNT(column) skips empty phones.'], ['SELECT COUNT(DISTINCT country) AS countries FROM customers;', 'Different countries.']],
  practice: [{ task: 'How many products are there?', answer: 'SELECT COUNT(*) FROM products', hint: 'SELECT COUNT(*) FROM products' }, { task: "How many orders have status 'delivered'?", answer: "SELECT COUNT(*) FROM orders WHERE status = 'delivered'", hint: "COUNT(*) … WHERE status = 'delivered'" }, { task: 'How many different ship_city values are there in orders?', answer: 'SELECT COUNT(DISTINCT ship_city) FROM orders', hint: 'COUNT(DISTINCT ship_city)' }],
  recap: ['COUNT(*) counts rows; COUNT(col) skips NULLs; COUNT(DISTINCT col) counts different values.', 'Functions: name(input) → output.']
});
LESSONS.push({
  lv: 'g', id: 'sumavg', t: 'SUM, AVG, MIN and MAX',
  goal: 'Add up, average, and find the smallest and biggest.',
  story: 'SUM is emptying every piggy bank into one pile. AVG is sharing the pile out fairly. MIN and MAX are the smallest and biggest coin.',
  words: [['SUM(x)', 'Adds up all the values.'], ['AVG(x)', 'The average: the total divided by how many values.'], ['MIN(x) / MAX(x)', 'The smallest / biggest value. Works on numbers, dates and text.'], ['ROUND(x, n)', 'Rounds a number to n decimal places. More number functions come in level 5.']],
  body: '- `SUM(quantity)` total items sold\n- `AVG(unit_price)` average price\n- `MIN(order_date)`, `MAX(order_date)` first and last order\n\nYou can put **expressions** inside: `SUM(quantity * unit_price)` adds up the money of every line.\n\nAll of them **ignore NULL values**. AVG divides by the number of non-empty values, not all rows.\n\nAverages often have many decimals. Wrap them in **ROUND**: `ROUND(AVG(unit_price), 2)`.\n\nSeveral aggregates can go in one SELECT: `SELECT MIN(salary), MAX(salary), AVG(salary) FROM employees;`',
  anatomy: { sql: 'SELECT ROUND(AVG(unit_price), 2) AS avg_price FROM products;', parts: [['AVG(unit_price)', 'average of all prices'], ['ROUND(…, 2)', 'rounded to 2 decimals'], ['AS avg_price', 'called avg_price']] },
  when: 'Total sales, average order size, cheapest and most expensive, first and latest dates.',
  how: ['Say the question: "what is the total/average/smallest/biggest … (of the rows that …)?".', 'Find the column (or calculation) to measure.', 'Wrap it in the right function.', 'Add WHERE to limit which rows count.', 'Round averages and money to a sensible number of decimals.'],
  app: [['Question builder: set a column to Add up, Average, Smallest or Largest.', 'builder']],
  ex: [['SELECT SUM(quantity) AS items_sold FROM order_items;', 'Total items.'], ['SELECT ROUND(SUM(quantity * unit_price), 2) AS revenue FROM order_items;', 'Total money, calculated per line then added up.'], ['SELECT MIN(salary) AS lowest, MAX(salary) AS highest, ROUND(AVG(salary), 0) AS average FROM employees;', 'Three answers at once.'], ['SELECT MIN(order_date) AS first_order, MAX(order_date) AS latest FROM orders;', 'Works on dates.']],
  practice: [{ task: 'What is the highest salary among employees?', answer: 'SELECT MAX(salary) FROM employees', hint: 'MAX(salary)' }, { task: 'What is the total units_in_stock across all products?', answer: 'SELECT SUM(units_in_stock) FROM products', hint: 'SUM(units_in_stock)' }, { task: 'What is the average unit_price of products in category_id 1, rounded to 2 decimals?', answer: 'SELECT ROUND(AVG(unit_price), 2) FROM products WHERE category_id = 1', hint: 'ROUND(AVG(unit_price), 2) … WHERE category_id = 1' }],
  recap: ['SUM adds, AVG averages, MIN/MAX find extremes.', 'They ignore NULLs.', 'ROUND(x, 2) tidies decimals.']
});
LESSONS.push({
  lv: 'g', id: 'groupby', t: 'GROUP BY: totals for each group',
  goal: 'Get one total per group, like orders per status.',
  story: 'Tip all the sweets on the table, make one pile per colour, then count each pile.',
  words: [['GROUP BY', 'Clause that splits rows into groups that share the same value, so aggregates are worked out per group.'], ['Group', 'All rows with the same value in the grouped column(s).']],
  body: '`SELECT status, COUNT(*) AS orders FROM orders GROUP BY status;`\n\nThe database:\n1. Makes one **group** per different status.\n2. Runs COUNT(*) **inside each group**.\n3. Returns **one row per group**.\n\n**The golden rule:** every column in SELECT must either be **in GROUP BY** or **inside an aggregate** (COUNT, SUM…). `SELECT status, id, COUNT(*) … GROUP BY status` fails (or gives nonsense), because a group of 100 orders has 100 different ids.\n\n**Several columns:** `GROUP BY country, segment` makes a group for every country-and-segment pair.\n\nClause order now: SELECT, FROM, WHERE, **GROUP BY**, ORDER BY, LIMIT. You can sort by the total: `ORDER BY orders DESC`.',
  anatomy: { sql: 'SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;', parts: [['GROUP BY status', 'one pile per status'], ['status', 'show which pile'], ['COUNT(*) AS orders', 'how many in each pile'], ['ORDER BY orders DESC', 'biggest pile first']] },
  when: 'Almost every report: sales per month, customers per country, orders per salesperson, stock per category.',
  how: ['Say the question as "for each ___, how many/how much ___?".', 'The "for each" part goes in SELECT and in GROUP BY.', 'The "how many/how much" part is an aggregate in SELECT.', 'Put row filters (before grouping) in WHERE.', 'Sort by the total to see the biggest groups first.', 'Check: the totals of all groups should add up to the overall total.'],
  app: [['Question builder: leave a column on "Show each value" and set another to Count or Add up. The first becomes the groups.', 'builder']],
  ex: [['SELECT status, COUNT(*) AS orders FROM orders GROUP BY status ORDER BY orders DESC;', 'Orders per status.'], ['SELECT country, COUNT(*) AS customers FROM customers GROUP BY country ORDER BY customers DESC;', 'Customers per country.'], ['SELECT country, segment, COUNT(*) AS customers FROM customers GROUP BY country, segment ORDER BY country, customers DESC;', 'Two-level groups.'], ['SELECT order_id, SUM(quantity * unit_price) AS order_total FROM order_items GROUP BY order_id ORDER BY order_total DESC LIMIT 5;', 'Total money per order, biggest first.']],
  mistakes: ['Selecting a column that is neither grouped nor aggregated.', 'Grouping by id (every group has one row, so nothing is summed).'],
  practice: [{ task: 'Count customers in each country (show country and the count).', answer: 'SELECT country, COUNT(*) FROM customers GROUP BY country', hint: 'SELECT country, COUNT(*) … GROUP BY country' }, { task: 'Show each category_id with the number of products in it.', answer: 'SELECT category_id, COUNT(*) FROM products GROUP BY category_id', hint: 'GROUP BY category_id' }, { task: 'Show each department_id with the total salary of its employees.', answer: 'SELECT department_id, SUM(salary) FROM employees GROUP BY department_id', hint: 'SUM(salary) … GROUP BY department_id' }],
  recap: ['GROUP BY makes groups; aggregates are worked out per group.', 'Every selected column: grouped or aggregated.', '"For each X, how many Y" → SELECT X, COUNT(*) … GROUP BY X.']
});
LESSONS.push({
  lv: 'g', id: 'having', t: 'HAVING: filtering groups',
  goal: 'Keep only groups whose totals pass a rule.',
  story: 'WHERE picks which sweets go on the table. HAVING throws away the small piles after they are made.',
  words: [['HAVING', 'Clause that filters groups after GROUP BY, using aggregates like COUNT(*) > 5.']],
  body: '`SELECT city, COUNT(*) AS customers FROM customers GROUP BY city HAVING COUNT(*) >= 8;`\n\n- **WHERE** filters **rows before** grouping. It cannot use COUNT/SUM.\n- **HAVING** filters **groups after** grouping. It uses aggregates.\n- You can use both: `WHERE country = \'Ghana\' … GROUP BY city HAVING COUNT(*) > 3`.\n\nClause order: SELECT, FROM, WHERE, GROUP BY, **HAVING**, ORDER BY, LIMIT.\n\nIn most databases write the aggregate again in HAVING (`HAVING COUNT(*) >= 8`) rather than the alias; SQLite and MySQL accept the alias, PostgreSQL and SQL Server do not.',
  anatomy: { sql: 'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) >= 6;', parts: [['GROUP BY customer_id', 'one pile per customer'], ['HAVING COUNT(*) >= 6', 'keep piles with at least 6 orders']] },
  when: 'Customers with more than 5 orders, products that sold over 100 units, duplicate emails (groups with COUNT > 1).',
  how: ['First write the GROUP BY query and check the totals.', 'Decide the rule for the totals ("at least 6").', 'Add HAVING with the aggregate and the rule.', 'If the rule is about single rows (not totals), it belongs in WHERE instead.'],
  app: [['Question builder: "Only groups where…" appears once something is counted or added up.', 'builder']],
  ex: [['SELECT city, COUNT(*) AS customers FROM customers GROUP BY city HAVING COUNT(*) >= 8 ORDER BY customers DESC;', 'Cities with at least 8 customers.'], ["SELECT customer_id, COUNT(*) AS orders FROM orders WHERE status = 'delivered' GROUP BY customer_id HAVING COUNT(*) >= 4;", 'WHERE and HAVING together.'], ['SELECT email, COUNT(*) FROM employees GROUP BY email HAVING COUNT(*) > 1;', 'Finding duplicates: none here, which is good.']],
  practice: [{ task: 'Show customer_id for customers with at least 6 orders (and their count).', answer: 'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id HAVING COUNT(*) >= 6', hint: 'GROUP BY customer_id HAVING COUNT(*) >= 6' }, { task: 'Show product_id and total quantity for products that sold more than 250 units in total.', answer: 'SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id HAVING SUM(quantity) > 250', hint: 'HAVING SUM(quantity) > 250' }],
  quiz: [['"Only orders from 2026, then only customers with 5+ of them." Where does "from 2026" go?', ['WHERE', 'HAVING'], 0, 'It is about single rows, so WHERE. "5+ orders" is about groups, so HAVING.']],
  recap: ['WHERE filters rows before grouping; HAVING filters groups after.', 'Order: WHERE, GROUP BY, HAVING, ORDER BY.']
});
LESSONS.push({
  lv: 'g', id: 'logical', t: 'The order the database really works in',
  goal: 'Understand why some things work in one clause but not another.',
  story: 'You write a recipe title first, but you cook by washing, chopping, then frying. SQL is written in one order and worked in another.',
  words: [['Logical order', 'The order in which the database actually processes the clauses.']],
  body: '**Written order:** SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT\n\n**Worked order:**\n1. **FROM** – which table(s)\n2. **WHERE** – throw away rows\n3. **GROUP BY** – make piles\n4. **HAVING** – throw away piles\n5. **SELECT** – choose and calculate columns, give aliases\n6. **DISTINCT** – remove repeats\n7. **ORDER BY** – sort\n8. **LIMIT** – cut\n\nThis explains:\n- Why an **alias** made in SELECT cannot be used in WHERE (WHERE runs first).\n- Why an alias **can** be used in ORDER BY (it runs after SELECT).\n- Why WHERE cannot use COUNT (groups do not exist yet).',
  when: 'Every time you get "no such column" for an alias, or wonder where a rule should go.',
  how: ['When a query fails, walk through it in the worked order.', 'At each step ask: does this step know about the name I am using yet?', 'Move the rule to the clause where that name exists, or repeat the expression instead of the alias.'],
  app: [['SQL editor: "How will it run?" shows the plan the database chose.', 'sql']],
  ex: [["SELECT unit_price * 1.15 AS with_tax FROM products WHERE unit_price * 1.15 > 30 ORDER BY with_tax DESC;", 'WHERE repeats the expression; ORDER BY may use the alias.']],
  quiz: [['Which clause runs first?', ['SELECT', 'FROM', 'ORDER BY'], 1, 'The database first needs to know which table to read.'], ['Can WHERE use an alias made in SELECT?', ['Yes', 'No, WHERE runs before SELECT'], 1, 'Repeat the expression in WHERE instead.']],
  recap: ['Worked order: FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT.', 'Aliases work in ORDER BY, not in WHERE.']
});

/* ================= 5. WORKING WITH VALUES ================= */
LESSONS.push({
  lv: 'v', id: 'funcs', t: 'Functions in general',
  goal: 'Read and use any function, even ones you have never seen.',
  story: 'A juicer: put oranges in, get juice out. A function takes values in and gives one value back.',
  words: [['Argument', 'A value you give a function inside its brackets, separated by commas.'], ['Scalar function', 'A function that works on one row at a time (unlike aggregates, which squash many rows).'], ['Nesting', 'Putting one function inside another: ROUND(AVG(x), 2).']],
  body: 'Every function looks like `NAME(argument1, argument2, …)`.\n\n- **Scalar functions** work **row by row**: `UPPER(city)` gives one answer per row.\n- **Aggregate functions** (COUNT, SUM…) squash **many rows** into one.\n- Functions can be used in SELECT, WHERE, ORDER BY, GROUP BY – anywhere a value is allowed.\n- They can be **nested**: the inner one is worked out first.\n- Most function names are the same in every database, but some differ (for example text length is LENGTH in SQLite/PostgreSQL, LEN in SQL Server, CHAR_LENGTH in MySQL). When unsure, search "<database name> <what you want> function".',
  when: 'Tidying text, rounding, working with dates, turning one kind of value into another.',
  how: ['Say what you want to happen to each value ("make it capitals", "take the year").', 'Look up the function (the SQL editor\'s function library lists many, explained simply).', 'Check what arguments it needs and in what order.', 'Try it on a few rows first with LIMIT.', 'Nest functions from the inside out.'],
  app: [['SQL editor: the Function library lists 130+ functions and recipes, each explained and ready to try.', 'sql', null, '#sqlLib']],
  ex: [["SELECT city, UPPER(city) AS loud, LENGTH(city) AS letters FROM customers LIMIT 5;", 'Two scalar functions, one answer per row.'], ['SELECT ROUND(AVG(unit_price), 1) AS avg_price FROM products;', 'Nesting: AVG first, then ROUND.']],
  recap: ['NAME(arguments) → one value.', 'Scalar = per row; aggregate = many rows.', 'Nested functions work inside-out.']
});
LESSONS.push({
  lv: 'v', id: 'numfn', t: 'Number functions',
  goal: 'Round, remove minus signs, find remainders and avoid division traps.',
  story: 'A calculator with extra buttons: round, remainder, make positive.',
  words: [['ROUND(x, n)', 'Round to n decimals (0 = whole number).'], ['ABS(x)', 'Remove the minus sign.'], ['CEIL / FLOOR', 'Round up / down to a whole number (CEILING in SQL Server; not built into every SQLite).'], ['% (modulo)', 'The remainder after dividing: 7 % 2 = 1.']],
  body: '- `ROUND(12.345, 2)` → 12.35. `ROUND(12.5, 0)` → 13.\n- `ABS(-4)` → 4.\n- `id % 2 = 0` → even ids.\n- **Division trap:** whole ÷ whole may drop decimals in SQLite, PostgreSQL and SQL Server. Use `* 1.0` or `CAST(x AS REAL)` (CAST comes later in this level).\n- **Divide by zero** is an error. Protect it with `NULLIF(bottom, 0)` (taught in the COALESCE lesson).\n- **Percent of total:** `part * 100.0 / total`.',
  when: 'Money, percentages, rounding reports, checking even/odd, bucketing numbers.',
  how: ['Decide how exact the answer must be (money: 2 decimals).', 'Round at the end of the calculation, not in the middle.', 'Whenever you divide, ask: can the bottom be zero? can both be whole numbers?', 'Test with a few rows and check by hand.'],
  app: [['Question builder: under a number column, choose "Rounded" or "Rounded to 2 decimals".', 'builder'], ['SQL editor → Function library → "Numbers and maths".', 'sql', null, '#sqlLib']],
  ex: [['SELECT name, unit_price, ROUND(unit_price * 1.155, 2) AS rounded FROM products LIMIT 5;', 'Rounding money.'], ['SELECT id, id % 2 AS remainder FROM orders LIMIT 6;', 'Even (0) and odd (1).'], ["SELECT status, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM orders), 1) AS percent FROM orders GROUP BY status;", 'Percent of all orders. (The bracketed SELECT inside is a "subquery", taught in level 9; here it just means "the total number of orders".)']],
  practice: [{ task: 'Show each product name with unit_price rounded to a whole number, as whole_price.', answer: 'SELECT name, ROUND(unit_price, 0) AS whole_price FROM products', hint: 'ROUND(unit_price, 0)' }],
  recap: ['ROUND, ABS, %, CEIL/FLOOR.', 'Multiply by 1.0 before dividing whole numbers.', 'Guard against dividing by zero.']
});
LESSONS.push({
  lv: 'v', id: 'textfn', t: 'Text functions',
  goal: 'Clean, cut and join text.',
  story: 'Tools for words: make them LOUD or quiet, trim the edges, cut out a piece, glue pieces together.',
  words: [['UPPER / LOWER', 'All capitals / all small letters.'], ['LENGTH', 'Number of characters (LEN in SQL Server, CHAR_LENGTH in MySQL).'], ['TRIM', 'Remove spaces at the start and end.'], ['SUBSTR(text, start, count)', 'Cut out a piece (SUBSTRING in most other databases).'], ['REPLACE(text, old, new)', 'Swap every old for new.'], ['INSTR(text, find)', 'Position of find inside text, 0 if missing (POSITION in PostgreSQL, CHARINDEX in SQL Server).'], ['|| (concatenate)', 'Glue text together in SQLite and PostgreSQL. MySQL and SQL Server use CONCAT(a, b).']],
  body: '- `UPPER(\'ghana\')` → GHANA\n- `TRIM(\'  hi  \')` → hi\n- `SUBSTR(\'NW-1004\', 4, 4)` → 1004 (start at character 4, take 4)\n- `REPLACE(name, \'Pack\', \'Box\')`\n- `first_name || \' \' || last_name` → full name\n\n**Searching without worrying about capitals:** `WHERE LOWER(company_name) LIKE \'%golden%\'`.\n\n**Imported data is often messy.** TRIM, UPPER/LOWER and REPLACE are how you clean it.',
  when: 'Building full names, tidying imports, pulling codes apart, case-insensitive searches, email domains.',
  how: ['Look at a few real values first to see how messy they are.', 'Pick the tool: tidy (TRIM, UPPER/LOWER), cut (SUBSTR), find (INSTR), swap (REPLACE), glue (|| or CONCAT).', 'Build complicated changes step by step, one function at a time, checking each result.', 'When you are happy, the same expression can be used in an UPDATE to fix the data for good (level 7).'],
  app: [['Question builder: under a text column choose "In CAPITALS", "In small letters", "Without extra spaces", "First letter" or "Number of letters".', 'builder'], ['SQL editor → Function library → "Text".', 'sql', null, '#sqlLib']],
  ex: [["SELECT first_name || ' ' || last_name AS full_name, UPPER(last_name) AS loud, LENGTH(first_name) AS letters FROM employees LIMIT 5;", 'Glue, capitals, length.'], ['SELECT sku, SUBSTR(sku, 4, 4) AS number_part FROM products LIMIT 5;', 'Cutting a code apart.'], ["SELECT email, SUBSTR(email, INSTR(email, '@') + 1) AS domain FROM employees LIMIT 5;", 'Everything after the @.']],
  practice: [{ task: "Show every employee's email in capital letters.", answer: 'SELECT UPPER(email) FROM employees', hint: 'UPPER(email)' }, { task: "Show employees' full names as first_name, a space, last_name, called full_name.", answer: "SELECT first_name || ' ' || last_name AS full_name FROM employees", hint: "first_name || ' ' || last_name" }],
  recap: ['UPPER/LOWER, TRIM, LENGTH, SUBSTR, REPLACE, INSTR.', '|| glues text (CONCAT in MySQL/SQL Server).']
});
LESSONS.push({
  lv: 'v', id: 'dates1', t: 'Dates 1: today, years and months',
  goal: 'Get today\'s date and pull the year or month out of a date.',
  story: 'A calendar you can ask questions: "what year was this?", "which month?".',
  words: [["DATE('now')", "Today's date in SQLite (CURRENT_DATE in PostgreSQL, CURDATE() in MySQL, CAST(GETDATE() AS DATE) in SQL Server)."], ['STRFTIME(format, date)', "SQLite's function to format or pull parts out of a date. '%Y' year, '%m' month, '%d' day, '%Y-%m' year-month."], ['EXTRACT / YEAR() / MONTH()', 'The same job in other databases: EXTRACT(YEAR FROM d) in PostgreSQL, YEAR(d) in MySQL and SQL Server.']],
  body: 'Dates are stored as `YYYY-MM-DD` (and times as `YYYY-MM-DD HH:MM:SS`).\n\nIn SQLite (the practice database):\n- `DATE(\'now\')` → today\n- `STRFTIME(\'%Y\', order_date)` → year, like 2026\n- `STRFTIME(\'%m\', order_date)` → month number, like 09\n- `STRFTIME(\'%Y-%m\', order_date)` → year-month, like 2026-09, perfect for **monthly totals** with GROUP BY\n\nOther databases:\n- PostgreSQL: `EXTRACT(YEAR FROM d)`, `TO_CHAR(d, \'YYYY-MM\')`\n- MySQL: `YEAR(d)`, `MONTH(d)`, `DATE_FORMAT(d, \'%Y-%m\')`\n- SQL Server: `YEAR(d)`, `MONTH(d)`, `FORMAT(d, \'yyyy-MM\')`\n\nThe SQL editor\'s function library shows the right version for the database you are connected to.',
  when: 'Monthly and yearly reports, "this year" filters, grouping by month or weekday.',
  how: ['Decide the time unit of your question: day, month, year.', 'Turn the date into that unit with the date function of your database.', 'Use it in SELECT and GROUP BY for per-month/per-year totals, or in WHERE to filter.', 'Sort by it so months come out in order (year-month text sorts correctly).'],
  app: [['Question builder: under a date column choose "Year", "Year and month" or "Day of the week".', 'builder'], ['Filter rules for dates: "this month", "this year".', 'browse', 'orders', '#addFilterBtn']],
  ex: [["SELECT DATE('now') AS today;", 'Today from the database clock.'], ["SELECT STRFTIME('%Y-%m', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month ORDER BY month;", 'Orders per month.'], ["SELECT STRFTIME('%Y', hire_date) AS year, COUNT(*) AS hires FROM employees GROUP BY year ORDER BY year;", 'Hires per year.']],
  practice: [{ task: "Count orders per year. (Use STRFTIME('%Y', order_date).)", answer: "SELECT STRFTIME('%Y', order_date), COUNT(*) FROM orders GROUP BY STRFTIME('%Y', order_date)", hint: "SELECT STRFTIME('%Y', order_date) AS y, COUNT(*) … GROUP BY y" }, { task: "Show orders from the year 2025 only (all columns).", answer: "SELECT * FROM orders WHERE STRFTIME('%Y', order_date) = '2025'", hint: "WHERE STRFTIME('%Y', order_date) = '2025'" }],
  recap: ["Dates are 'YYYY-MM-DD'.", "SQLite: DATE('now'), STRFTIME('%Y' / '%m' / '%Y-%m', d).", 'Year-month text is ideal for monthly GROUP BY.']
});
LESSONS.push({
  lv: 'v', id: 'dates2', t: 'Dates 2: adding days and measuring gaps',
  goal: 'Move dates forward/back and count days between dates.',
  story: '"The bill is due 30 days after the order." "How many days ago was that?"',
  words: [["DATE(d, '+30 days')", "SQLite: move a date. Also '-7 days', '+1 month', '+1 year'."], ['JULIANDAY(d)', 'SQLite: a day number, so JULIANDAY(a) - JULIANDAY(b) = days between.'], ['DATEADD / DATEDIFF', 'SQL Server (and DATE_ADD / DATEDIFF in MySQL) for the same jobs. PostgreSQL uses d + INTERVAL \'30 days\' and a - b.']],
  body: 'SQLite:\n- `DATE(order_date, \'+30 days\')` → due date\n- `DATE(\'now\', \'-30 days\')` → 30 days ago, handy in WHERE: `WHERE order_date >= DATE(\'now\', \'-30 days\')`\n- `JULIANDAY(\'now\') - JULIANDAY(order_date)` → days since the order (a decimal; wrap in CAST(… AS INTEGER) for whole days)\n\nOther databases:\n- PostgreSQL: `order_date + INTERVAL \'30 days\'`, `CURRENT_DATE - order_date`\n- MySQL: `DATE_ADD(order_date, INTERVAL 30 DAY)`, `DATEDIFF(CURDATE(), order_date)`\n- SQL Server: `DATEADD(day, 30, order_date)`, `DATEDIFF(day, order_date, GETDATE())`',
  when: 'Due dates, overdue lists, "last 30 days", ages and years of service, delivery times.',
  how: ['Say it in days/months: "30 days after", "within the last 7 days".', 'Use the add-days function to make the boundary date.', 'Compare with >= or < in WHERE, or show the difference in SELECT.', 'Check with a date you can count on a calendar.'],
  app: [['Filter rule "is in the last … days".', 'browse', 'orders', '#addFilterBtn'], ['SQL editor → Function library → "Dates and times".', 'sql', null, '#sqlLib']],
  ex: [["SELECT id, order_date, DATE(order_date, '+30 days') AS pay_by FROM orders LIMIT 5;", 'Due dates.'], ["SELECT id, order_date FROM orders WHERE order_date >= DATE('now', '-30 days') ORDER BY order_date DESC;", 'Last 30 days.'], ["SELECT first_name, hire_date, CAST((JULIANDAY('now') - JULIANDAY(hire_date)) / 365.25 AS INTEGER) AS years_here FROM employees ORDER BY years_here DESC LIMIT 5;", 'Years of service. CAST(… AS INTEGER) keeps the whole number (CAST is explained two lessons from now).']],
  practice: [{ task: "Show id and order_date of orders placed in the last 60 days.", answer: "SELECT id, order_date FROM orders WHERE order_date >= DATE('now', '-60 days')", hint: "order_date >= DATE('now', '-60 days')" }],
  recap: ["SQLite: DATE(d, '+n days'), JULIANDAY differences.", 'Other databases: INTERVAL, DATE_ADD, DATEADD, DATEDIFF.']
});
LESSONS.push({
  lv: 'v', id: 'case', t: 'CASE: IF rules inside a query',
  goal: 'Make a value depend on rules.',
  story: 'A sorting machine: small sweets go left, medium ones in the middle, big ones right.',
  words: [['CASE … END', 'Chooses a value by checking rules in order.'], ['WHEN … THEN', 'One rule and the value to give when it is true.'], ['ELSE', 'The value when no rule matched (NULL if you leave ELSE out).']],
  body: '```\nCASE\n  WHEN unit_price < 8  THEN \'cheap\'\n  WHEN unit_price < 20 THEN \'medium\'\n  ELSE \'dear\'\nEND\n```\n\n- Rules are checked **top to bottom**; the **first true one wins**.\n- Use it in SELECT (make a new column), ORDER BY (custom order), GROUP BY (group into bands).\n- **Simple form** for swapping codes: `CASE status WHEN \'delivered\' THEN \'Arrived\' WHEN \'shipped\' THEN \'On the way\' ELSE \'Other\' END`.\n- **Counting only some rows**: `SUM(CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END)`.',
  anatomy: { sql: "CASE WHEN unit_price < 8 THEN 'cheap' ELSE 'dear' END AS band", parts: [['CASE', 'start choosing'], ['WHEN unit_price < 8 THEN \'cheap\'', 'if under 8, say cheap'], ["ELSE 'dear'", 'otherwise say dear'], ['END AS band', 'stop, call it band']] },
  when: 'Price bands, grades, turning codes into words, custom sort orders, counting categories side by side.',
  how: ['Write the rules in plain words as a list, most specific first.', 'Turn each into WHEN rule THEN value.', 'Add ELSE for everything else.', 'Close with END and name it with AS.', 'Group by the CASE expression to count each band.'],
  app: [['SQL editor → Function library → "Conditions".', 'sql', null, '#sqlLib']],
  ex: [["SELECT name, unit_price, CASE WHEN unit_price < 8 THEN 'cheap' WHEN unit_price < 20 THEN 'medium' ELSE 'dear' END AS band FROM products;", 'Price bands.'], ["SELECT COUNT(*) AS all_orders, SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered FROM orders;", 'Counting only some rows.'], ["SELECT id, status FROM orders ORDER BY CASE status WHEN 'pending' THEN 1 WHEN 'shipped' THEN 2 ELSE 3 END, id LIMIT 10;", 'A custom sort order.']],
  practice: [{ task: "Show employee first_name and pay_level: 'high' when salary > 80000, otherwise 'normal'.", answer: "SELECT first_name, CASE WHEN salary > 80000 THEN 'high' ELSE 'normal' END AS pay_level FROM employees", hint: "CASE WHEN salary > 80000 THEN 'high' ELSE 'normal' END" }, { task: "Count how many products are 'low' stock (units_in_stock < 50) and how many are 'ok', using CASE and GROUP BY.", answer: "SELECT CASE WHEN units_in_stock < 50 THEN 'low' ELSE 'ok' END AS stock, COUNT(*) FROM products GROUP BY CASE WHEN units_in_stock < 50 THEN 'low' ELSE 'ok' END", hint: 'Put the same CASE in SELECT and GROUP BY.' }],
  recap: ['CASE WHEN … THEN … ELSE … END.', 'First true rule wins.', 'Works in SELECT, ORDER BY, GROUP BY and inside SUM.']
});
LESSONS.push({
  lv: 'v', id: 'coalesce', t: 'Handling empties: COALESCE and NULLIF',
  goal: 'Replace NULLs with something useful, and avoid dividing by zero.',
  story: 'COALESCE: "if the first box is empty, look in the next one". NULLIF: "pretend this value is empty".',
  words: [['COALESCE(a, b, …)', 'Gives the first value that is not NULL.'], ['NULLIF(a, b)', 'Gives NULL if a equals b, otherwise a.'], ['IFNULL / ISNULL', 'Two-value versions of COALESCE in SQLite/MySQL (IFNULL) and SQL Server (ISNULL).']],
  body: '- `COALESCE(phone, \'no phone\')` → the phone, or the words no phone.\n- `COALESCE(discount, 0)` → makes maths safe when discount can be empty.\n- `COALESCE(mobile, office_phone, \'none\')` → first one that exists.\n- `x / NULLIF(y, 0)` → if y is 0 the answer is NULL instead of an error.\n\nCOALESCE works in every database, so prefer it over IFNULL/ISNULL.',
  when: 'Reports that should show 0 or "unknown" instead of blanks, safe maths, fallbacks between columns.',
  how: ['Find the columns that can be empty.', 'Decide what an empty value should mean in this report (0? "unknown"? another column?).', 'Wrap the column in COALESCE with that fallback.', 'For every division, wrap the bottom in NULLIF(…, 0).'],
  app: [['SQL editor → Function library → "Conditions".', 'sql', null, '#sqlLib']],
  ex: [["SELECT company_name, COALESCE(phone, 'no phone') AS phone FROM customers WHERE phone IS NULL;", 'Fallback text.'], ['SELECT id, COALESCE(employee_id, 0) AS salesperson FROM orders WHERE employee_id IS NULL;', 'Fallback number.'], ['SELECT name, units_in_stock, ROUND(unit_price / NULLIF(units_in_stock, 0), 3) AS ratio FROM products ORDER BY units_in_stock LIMIT 5;', 'No divide-by-zero error.']],
  practice: [{ task: "Show company_name and the segment, or the text 'unknown' when it is empty, as segment.", answer: "SELECT company_name, COALESCE(segment, 'unknown') AS segment FROM customers", hint: "COALESCE(segment, 'unknown')" }],
  recap: ['COALESCE = first non-empty value.', 'NULLIF(y, 0) prevents divide-by-zero errors.']
});
LESSONS.push({
  lv: 'v', id: 'cast', t: 'Changing types: CAST',
  goal: 'Turn text into numbers (and back) when needed.',
  story: '"12" written as a word is not the number 12. CAST turns one into the other.',
  words: [['CAST(x AS type)', 'Treat x as another type for this query: CAST(\'12\' AS INTEGER).'], ['Implicit conversion', 'When the database changes a type by itself. Convenient, but can surprise you.']],
  body: '- Text sorts letter by letter: `\'10\'` comes before `\'9\'`. As numbers, 9 comes first.\n- `CAST(\'42\' AS INTEGER) + 1` → 43.\n- `CAST(price AS TEXT)` turns a number into text (for gluing into sentences).\n- `CAST(x AS INTEGER)` on a decimal cuts off the decimals in SQLite.\n\nType names differ a little: INTEGER/INT, REAL/FLOAT, DECIMAL(10,2), TEXT/VARCHAR, DATE. MySQL uses SIGNED for whole numbers in CAST. PostgreSQL also has the short form `\'42\'::integer`.\n\nIf text cannot become a number (`CAST(\'abc\' AS INTEGER)`), some databases give an error, others give 0 or NULL.',
  when: 'Imported data stored as text, sorting numbers kept as text, joining a text code to a number ID, building messages.',
  how: ['Notice the symptom: odd sorting, maths not working, or joins finding nothing.', 'Check the column types (Table design tab or the table design).', 'CAST to the type you need in the query.', 'If it happens a lot, fix the column type in the table design instead.'],
  app: [['Table design tab: "Kind of data" shows each column\'s type.', 'design', 'products'], ['Import: choose the right kind of data for each column before importing.', 'import']],
  ex: [["SELECT '10' < '9' AS as_text, CAST('10' AS INTEGER) < CAST('9' AS INTEGER) AS as_numbers;", '1 means true, 0 false.'], ["SELECT 'Product ' || CAST(id AS TEXT) || ' costs ' || CAST(unit_price AS TEXT) AS message FROM products LIMIT 3;", 'Numbers into a sentence.']],
  practice: [{ task: "Show unit_price of every product cut to a whole number with CAST(… AS INTEGER), as whole.", answer: 'SELECT CAST(unit_price AS INTEGER) AS whole FROM products', hint: 'CAST(unit_price AS INTEGER)' }],
  recap: ['CAST(x AS type) changes the type for the query.', 'Text numbers sort wrongly; cast them.']
});

/* ================= 6. CONNECTING TABLES ================= */
LESSONS.push({
  lv: 'j', id: 'why-split', t: 'Why data is split into tables',
  goal: 'Understand why databases use many linked tables.',
  story: 'If you write your grandma\'s address on 100 birthday cards and she moves, you must fix 100 cards. Keep it once in an address book and just write "Grandma" on the cards.',
  words: [['Redundancy', 'The same fact stored in many places. It causes mistakes.'], ['Normalisation', 'Designing tables so each fact is stored once (more in level 8).']],
  body: 'Imagine one giant orders table with the customer\'s name, city and phone typed on every order. Problems:\n- The phone changes → update hundreds of rows, and some get missed.\n- A typo ("Acra") makes one customer look like two.\n- A customer with no orders cannot be stored at all.\n\nSo databases split things:\n- `customers` – one row per customer\n- `orders` – one row per order, with `customer_id` pointing to the customer\n- `order_items` – one row per product line, pointing to the order and the product\n- `products`, `categories`, `employees`, `departments`\n\nThe cost: to answer "which customer bought what?", you must **connect** tables again. That is what JOIN does, in the next lessons.',
  demo: ['SELECT o.id AS order_id, o.customer_id, c.company_name FROM orders o, customers c WHERE c.id = o.customer_id LIMIT 4', 'Orders only store customer_id; the name lives once in customers'],
  when: 'Designing any database, and reading one someone else designed.',
  how: ['List the "things" in the business (customers, orders, products).', 'Give each thing its own table with an id.', 'Where one thing belongs to another, store the other\'s id (a foreign key).', 'When you need facts from both, join them in a query.'],
  app: [['Home screen: "How the tables connect" shows every link in the practice data.', 'home']],
  quiz: [['Why store customer_id in orders instead of the customer\'s name?', ['Names are too long', 'So the customer\'s facts live in one place and stay correct', 'It is required by SQL'], 1, 'One place per fact = fewer mistakes.']],
  recap: ['Each fact once, in its own table.', 'Links (ids) connect them; JOIN puts them back together.']
});
LESSONS.push({
  lv: 'j', id: 'pk', t: 'Primary keys',
  goal: 'Know what a primary key is and why every table needs one.',
  story: 'Two children called Kofi Mensah in one school. Their pupil numbers tell them apart.',
  words: [['Primary key', 'The column (or columns) whose value is unique for every row and never empty. Usually id.'], ['Auto-number', 'The database fills in the next id for you: AUTOINCREMENT (SQLite), SERIAL/IDENTITY (PostgreSQL), AUTO_INCREMENT (MySQL), IDENTITY (SQL Server).'], ['Composite key', 'A primary key made of two or more columns together.']],
  body: 'A **primary key** guarantees:\n- **Unique**: no two rows share it.\n- **Not empty**: every row has one.\n- **Stable**: it should never change.\n\nMost tables use a simple number `id` that the database fills in automatically. Names or emails make poor keys because they change and can repeat.\n\nWith a primary key you can always point at **exactly one row**: `WHERE id = 42`. That is how tools edit or delete a single row safely.',
  demo: ['SELECT id, name FROM departments', 'Every department has its own id'],
  when: 'Every table you create should have one.',
  how: ['Give every new table an id column that auto-numbers.', 'To change or delete one specific row, always use WHERE id = ….', 'Never reuse or change ids once they are in use.'],
  app: [['Table design tab: the ID marker and "auto-numbered".', 'design', 'departments'], ['Browse data tab: editing a cell uses the id behind the scenes. Press "Show SQL" after an edit in History.', 'activity']],
  quiz: [['Which is the best primary key for customers?', ['company_name', 'email', 'an auto-numbered id'], 2, 'Names and emails change and can repeat; ids do not.']],
  recap: ['Primary key = unique, not empty, stable.', 'Usually an auto-numbered id.']
});
LESSONS.push({
  lv: 'j', id: 'fk', t: 'Foreign keys and relationships',
  goal: 'Read links between tables and know the three kinds of relationship.',
  story: 'One mum can have many children, but each child has one mum. That is one-to-many.',
  words: [['Foreign key', 'A column that holds the primary key of a row in another table.'], ['One-to-many', 'One row here, many rows there: one customer, many orders. The most common kind.'], ['Many-to-many', 'Many on both sides: an order has many products, a product is in many orders. Needs a middle table.'], ['Junction (link) table', 'The middle table for many-to-many, like order_items.'], ['Referential integrity', 'The database refusing links to rows that do not exist.']],
  body: '- `orders.customer_id` → `customers.id`: **one customer, many orders**.\n- `products.category_id` → `categories.id`: one category, many products.\n- `order_items` has **two** foreign keys: `order_id` and `product_id`. It connects orders and products, which are **many-to-many**.\n- **One-to-one** exists too (a person and their passport), but is rare.\n\nWith a foreign key rule in place, the database **refuses**: an order for customer 999 if there is no customer 999, and deleting a customer who still has orders. That protection is called **referential integrity**.',
  demo: ['SELECT id, order_id, product_id, quantity FROM order_items LIMIT 5', 'order_items links orders and products'],
  when: 'Reading any database: find the links first, then you know how to join.',
  how: ['For each table, list its columns ending in _id.', 'Say each as a sentence: "each order_item belongs to one order and one product".', 'Decide the kind: one-to-many, or many-to-many through a middle table.', 'Draw it on paper with arrows if it helps. That drawing is your map for joins.'],
  app: [['Table design tab: "Links from this table" and "Links into this table".', 'design', 'order_items'], ['Home screen: the list of links.', 'home']],
  quiz: [['Customers and orders are…', ['one-to-one', 'one-to-many', 'many-to-many'], 1, 'One customer can have many orders; each order has one customer.'], ['Why does order_items exist?', ['To store customers', 'To link orders and products, which are many-to-many', 'Nothing'], 1, 'It is the junction table.']],
  recap: ['Foreign key = id of a row in another table.', 'One-to-many is most common; many-to-many needs a junction table.', 'The database protects links (referential integrity).']
});
LESSONS.push({
  lv: 'j', id: 'join', t: 'JOIN: putting tables side by side',
  goal: 'Combine two tables in one query.',
  story: 'A list of orders with customer numbers, and a list of customers with names. JOIN lays them side by side so each order shows its customer\'s name.',
  words: [['JOIN (INNER JOIN)', 'Combines rows from two tables where the ON rule matches. Rows with no partner are left out.'], ['ON', 'The matching rule, usually foreign key = primary key.'], ['Table alias', 'A short nickname for a table: FROM orders AS o (or just orders o).'], ['Qualified name', 'table.column or alias.column, so the database knows which table a column is from.']],
  body: '```\nSELECT o.id, o.order_date, c.company_name\nFROM orders AS o\nJOIN customers AS c ON c.id = o.customer_id;\n```\n\nThe database takes each order, finds the customer whose `id` equals the order\'s `customer_id`, and puts them side by side.\n\n- **Aliases** (`o`, `c`) keep it short. Once you give an alias, use it everywhere in the query.\n- **Qualify** columns (`o.id`, `c.id`) because both tables have an `id`. Otherwise you get "ambiguous column".\n- `JOIN` and `INNER JOIN` mean the same.\n- All other clauses still work: WHERE, GROUP BY, ORDER BY, LIMIT come after the joins.',
  anatomy: { sql: 'SELECT o.id, c.company_name FROM orders AS o JOIN customers AS c ON c.id = o.customer_id;', parts: [['FROM orders AS o', 'start with orders, nicknamed o'], ['JOIN customers AS c', 'bring in customers, nicknamed c'], ['ON c.id = o.customer_id', 'match each order to the customer with that id'], ['o.id, c.company_name', 'show the order id and the customer name']] },
  when: 'Every time the answer needs facts from more than one table.',
  how: ['Say which facts you need and which tables hold them.', 'Find the link between the tables (the foreign key).', 'Start FROM the table that is the "main" thing of your question, give it an alias.', 'JOIN the other table with ON foreign_key = primary_key.', 'Qualify every column with its alias.', 'Check the row count: joining one-to-many should give as many rows as the "many" side.'],
  app: [['Question builder: drag two linked tables onto the board. The join line appears by itself.', 'builder', null, '#qbCanvas'], ['Browse data tab: Ctrl-click an underlined value to jump to the linked row.', 'browse', 'orders', '#dataGrid']],
  ex: [['SELECT o.id, o.order_date, c.company_name FROM orders AS o JOIN customers AS c ON c.id = o.customer_id LIMIT 10;', 'Each order with its customer.'], ['SELECT p.name, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id;', 'Each product with its category.'], ["SELECT o.id, c.company_name, o.status FROM orders o JOIN customers c ON c.id = o.customer_id WHERE c.country = 'Kenya' ORDER BY o.id;", 'Joins plus WHERE and ORDER BY.']],
  mistakes: ['Forgetting ON (or joining on the wrong columns) pairs every row with every row: a huge, wrong answer.', '"Ambiguous column name": qualify it with the alias.'],
  practice: [{ task: 'Show each product name with its category name.', answer: 'SELECT p.name, c.name FROM products p JOIN categories c ON c.id = p.category_id', hint: 'FROM products p JOIN categories c ON c.id = p.category_id' }, { task: 'Show each employee first_name with the name of their department.', answer: 'SELECT e.first_name, d.name FROM employees e JOIN departments d ON d.id = e.department_id', hint: 'JOIN departments d ON d.id = e.department_id' }],
  recap: ['FROM a JOIN b ON b.id = a.b_id.', 'Use aliases and qualify columns.', 'Rows without a partner are dropped by INNER JOIN.']
});
LESSONS.push({
  lv: 'j', id: 'leftjoin', t: 'LEFT JOIN: keeping everyone',
  goal: 'Keep rows that have no partner, and find missing things.',
  story: 'The class register and a list of who brought lunch. LEFT JOIN keeps every child on the register; the lunch column is empty for those who forgot.',
  words: [['LEFT JOIN (LEFT OUTER JOIN)', 'Keeps every row of the first (left) table, even with no match. The right side is NULL when there is no partner.']],
  body: '```\nSELECT c.company_name, o.id AS order_id\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id;\n```\n\n- Customers with orders appear once per order.\n- Customers with **no** orders appear once, with `order_id` NULL.\n\n**Finding what is missing** (a very common task): add `WHERE o.id IS NULL`.\n\n**Counting with LEFT JOIN**: use `COUNT(o.id)`, not `COUNT(*)`, so customers with no orders get 0 instead of 1.\n\n**Watch out:** a WHERE rule on the right table (like `WHERE o.status = \'shipped\'`) removes the NULL rows and turns it back into an inner join. Put such rules in the ON instead: `LEFT JOIN orders o ON o.customer_id = c.id AND o.status = \'shipped\'`.',
  anatomy: { sql: 'SELECT c.company_name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL;', parts: [['LEFT JOIN orders o', 'bring in orders but keep every customer'], ['WHERE o.id IS NULL', 'keep the customers that found no order']] },
  when: 'Customers with no orders, products never sold, staff with no sales, "show zero, not nothing" reports.',
  how: ['Put the table you want to keep completely on the left (after FROM).', 'LEFT JOIN the other table.', 'To find the missing ones, add WHERE right_table.id IS NULL.', 'To count, count a column of the right table.', 'Put filters on the right table inside ON, not WHERE.'],
  app: [['Question builder: click the label on a join line and switch it from "matches" to "keep all".', 'builder']],
  ex: [['SELECT c.company_name, COUNT(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.company_name ORDER BY orders LIMIT 10;', 'Customers with the fewest orders, including zero.'], ['SELECT p.name FROM products p LEFT JOIN order_items oi ON oi.product_id = p.id WHERE oi.id IS NULL;', 'Products never ordered.']],
  practice: [{ task: 'Find customers who have never ordered. Show company_name.', answer: 'SELECT c.company_name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL', hint: 'LEFT JOIN orders o ON … WHERE o.id IS NULL' }, { task: 'Show every employee first_name with how many orders they handled (0 if none).', answer: 'SELECT e.first_name, COUNT(o.id) FROM employees e LEFT JOIN orders o ON o.employee_id = e.id GROUP BY e.id, e.first_name', hint: 'LEFT JOIN orders o ON o.employee_id = e.id … COUNT(o.id) … GROUP BY e.id, e.first_name' }],
  recap: ['LEFT JOIN keeps all left rows; missing right side = NULL.', 'WHERE right.id IS NULL finds the missing.', 'COUNT(right.id) gives 0 for no match.']
});
LESSONS.push({
  lv: 'j', id: 'multijoin', t: 'Joining three or more tables',
  goal: 'Walk across several tables in one query.',
  story: 'Order line → which order? → which customer? Like following arrows on a treasure map.',
  words: [['Join path', 'The chain of links you follow from one table to another.']],
  body: '```\nSELECT c.company_name, p.name AS product, oi.quantity\nFROM order_items oi\nJOIN orders o    ON o.id = oi.order_id\nJOIN customers c ON c.id = o.customer_id\nJOIN products p  ON p.id = oi.product_id;\n```\n\nEach JOIN adds one table and needs its own ON. You can mix JOIN and LEFT JOIN.\n\nThen group as usual: revenue per customer = `SUM(oi.quantity * oi.unit_price)` grouped by customer.',
  when: 'Sales per customer, per category, per salesperson, per department.',
  how: ['Draw the path: start table → next → next, following foreign keys.', 'Start FROM the table with the most detail (often the "lines" table).', 'Add one JOIN at a time and run after each to check the row count.', 'Group and sum at the end.'],
  app: [['Question builder: drag order_items, orders and customers. The lines appear automatically.', 'builder']],
  ex: [['SELECT c.company_name, p.name AS product, oi.quantity FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN customers c ON c.id = o.customer_id JOIN products p ON p.id = oi.product_id LIMIT 10;', 'Who bought what.'], ['SELECT c.company_name, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS revenue FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN customers c ON c.id = o.customer_id GROUP BY c.company_name ORDER BY revenue DESC LIMIT 5;', 'Top 5 customers by revenue.']],
  practice: [{ task: 'Show total quantity sold per category name.', answer: 'SELECT cat.name, SUM(oi.quantity) FROM order_items oi JOIN products p ON p.id = oi.product_id JOIN categories cat ON cat.id = p.category_id GROUP BY cat.name', hint: 'order_items → products → categories, GROUP BY the category name' }, { task: 'Show each department name with the number of orders handled by its employees.', answer: 'SELECT d.name, COUNT(o.id) FROM orders o JOIN employees e ON e.id = o.employee_id JOIN departments d ON d.id = e.department_id GROUP BY d.name', hint: 'orders → employees → departments' }],
  recap: ['One JOIN … ON per extra table.', 'Build and check one join at a time.']
});
LESSONS.push({
  lv: 'j', id: 'otherjoins', t: 'RIGHT, FULL, CROSS and self joins',
  goal: 'Know the rarer joins and when they help.',
  story: 'RIGHT JOIN is LEFT JOIN seen from the other side. FULL keeps everyone from both lists. CROSS pairs every shirt with every pair of trousers. A self join compares a list with itself.',
  words: [['RIGHT JOIN', 'Keeps every row of the second (right) table.'], ['FULL OUTER JOIN', 'Keeps every row from both tables (not in MySQL).'], ['CROSS JOIN', 'Every row of one table paired with every row of the other.'], ['Self join', 'A table joined to itself using two different aliases.']],
  body: '- **RIGHT JOIN**: rarely needed; swap the tables and use LEFT JOIN instead, which most people find easier to read.\n- **FULL OUTER JOIN**: compare two lists and see what is in one, the other, or both. MySQL does not have it (use a LEFT JOIN and a RIGHT JOIN glued with UNION, level 9).\n- **CROSS JOIN**: a table of 6 rows × a table of 8 rows = 48 rows. Useful for making every combination (sizes × colours, every product × every month).\n- **Self join**: `employees a JOIN employees b ON a.department_id = b.department_id AND a.id < b.id` lists pairs of colleagues. Also used for "employee and their manager" when a table has a manager_id pointing to itself.',
  when: 'FULL: reconciling two lists. CROSS: all combinations. Self: pairs or hierarchies inside one table.',
  how: ['Ask which rows you must keep: only matches (JOIN), all of one side (LEFT), all of both (FULL), every combination (CROSS).', 'For a self join, give the table two aliases and treat them as two different tables.', 'Check the row count against what you expect.'],
  app: [['SQL editor → Function library → "Joining tables".', 'sql', null, '#sqlLib']],
  ex: [['SELECT d.name AS department, e.first_name FROM departments d FULL OUTER JOIN employees e ON e.department_id = d.id ORDER BY d.name LIMIT 10;', 'Everyone from both tables.'], ['SELECT c.name AS category, d.name AS department FROM categories c CROSS JOIN departments d LIMIT 8;', 'Every combination.'], ['SELECT a.first_name, b.first_name AS colleague, a.department_id FROM employees a JOIN employees b ON a.department_id = b.department_id AND a.id < b.id LIMIT 8;', 'Pairs of colleagues (a.id < b.id avoids pairing someone with themselves or listing each pair twice).']],
  recap: ['Prefer LEFT over RIGHT.', 'FULL keeps both sides; CROSS makes all combinations; self join uses two aliases.']
});
LESSONS.push({
  lv: 'j', id: 'joinpitfalls', t: 'Join mistakes that give wrong numbers',
  goal: 'Spot and fix the joins that silently double your totals.',
  story: 'If you count the sweets in each bag, then tip in a second list that repeats each bag three times, you count every sweet three times.',
  words: [['Fan-out', 'When a join repeats rows of one table many times, making sums too big.']],
  body: '**1. Totals too big (fan-out).** Joining orders to order_items repeats each order once per line. If you then `SUM` a column from orders, or `COUNT(*)` orders, each order is counted several times. Fix: `COUNT(DISTINCT o.id)`, or total the detail table first and join the totals (level 9).\n\n**2. Rows disappear.** An INNER JOIN drops rows with no partner (and rows where the foreign key is NULL). Use LEFT JOIN if you must keep them.\n\n**3. Missing or wrong ON.** Every row pairs with every row. The answer is huge.\n\n**4. Ambiguous names.** Always qualify columns with aliases.\n\n**Always check:** row count before and after each join, and one total against a number you already know.',
  when: 'Every report that joins and sums.',
  how: ['Count rows of the main table on its own.', 'Add the join and count again. Did it grow? Is that expected (one-to-many)?', 'If summing a column from the "one" side after joining the "many" side, total separately or use COUNT(DISTINCT).', 'Compare the final total with a simple known total.'],
  app: [['Question builder: the plain-English sentence tells you which tables are joined and how.', 'builder']],
  ex: [['SELECT COUNT(*) AS rows_after_join, COUNT(DISTINCT o.id) AS real_orders FROM orders o JOIN order_items oi ON oi.order_id = o.id;', 'The join has more rows than there are orders.']],
  practice: [{ task: 'Count how many different orders contain at least one item of product_id 1 (join orders and order_items, count distinct order ids).', answer: 'SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE oi.product_id = 1', hint: 'COUNT(DISTINCT o.id) … WHERE oi.product_id = 1' }],
  recap: ['Joins to "many" tables repeat rows: watch sums and counts.', 'INNER JOIN drops unmatched rows.', 'Check row counts at every step.']
});
