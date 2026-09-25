/* Learn SQL — part 4: advanced queries and working like a professional. */

/* ================= 9. ADVANCED QUERIES ================= */
LESSONS.push({
  lv: 'a', id: 'subq', t: 'Subqueries: a query inside a query',
  goal: 'Use the answer of one query inside another.',
  story: '"Show me the children taller than the average child." First you work out the average, then you compare everyone with it.',
  words: [['Subquery', 'A SELECT inside brackets, used inside another statement.'], ['Scalar subquery', 'A subquery that returns exactly one value (one row, one column).']],
  body: '**In WHERE, as one value:**\n`WHERE unit_price > (SELECT AVG(unit_price) FROM products)`\n\n**In WHERE, as a list (with IN):**\n`WHERE id IN (SELECT customer_id FROM orders WHERE status = \'pending\')`\n\n**In SELECT, as a column:**\n`SELECT name, unit_price, (SELECT AVG(unit_price) FROM products) AS average FROM products`\n\n**In FROM, as a temporary table (derived table):**\n`SELECT AVG(n) FROM (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) AS per_customer`\n\nThe inner query runs first (logically) and its answer is used by the outer one. A subquery in FROM needs an alias.',
  anatomy: { sql: 'SELECT name FROM products WHERE unit_price > (SELECT AVG(unit_price) FROM products);', parts: [['(SELECT AVG(unit_price) FROM products)', 'first: the average price, one number'], ['WHERE unit_price > …', 'then: keep products above that number']] },
  when: 'Comparing with an average or total, filtering by a list that comes from another query, statistics about groups.',
  how: ['Split the question into steps: "work out X, then use X to …".', 'Write and run the inner query on its own first.', 'Put it in brackets where its answer is needed.', 'One value → use with = > <; a list → use with IN; a table → use in FROM with an alias.'],
  app: [['SQL editor → Function library → "Subqueries and WITH".', 'sql', null, '#sqlLib']],
  ex: [['SELECT name, unit_price FROM products WHERE unit_price > (SELECT AVG(unit_price) FROM products) ORDER BY unit_price DESC;', 'Above-average prices.'], ["SELECT company_name FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE status = 'pending');", 'Customers with a pending order.'], ['SELECT ROUND(AVG(n), 2) AS average_orders_per_customer FROM (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) AS per_customer;', 'Average of a per-customer count.']],
  practice: [{ task: 'Show employees who earn more than the average salary.', answer: 'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)', hint: 'WHERE salary > (SELECT AVG(salary) FROM employees)' }, { task: 'Show customers who have never placed an order, using NOT IN and a subquery on orders.', answer: 'SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)', hint: 'WHERE id NOT IN (SELECT customer_id FROM orders)' }],
  recap: ['A subquery is a SELECT in brackets.', 'One value, a list (IN), or a table (FROM, with alias).']
});
LESSONS.push({
  lv: 'a', id: 'correlated', t: 'Correlated subqueries and EXISTS',
  goal: 'Write subqueries that look at the current row, and use EXISTS.',
  story: 'For each child, ask: "is there at least one library book with your name on it?" The question changes for every child.',
  words: [['Correlated subquery', 'A subquery that uses a column from the outer query, so it is worked out again for each outer row.'], ['EXISTS (…)', 'True when the subquery returns at least one row.'], ['NOT EXISTS (…)', 'True when it returns none.']],
  body: '```\nSELECT c.company_name,\n       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders\nFROM customers c;\n```\nThe inner query uses `c.id` from the outer row, so it gives a different answer for each customer.\n\n**EXISTS** only asks "is there any?":\n```\nSELECT company_name FROM customers c\nWHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n```\n`SELECT 1` is a convention: EXISTS does not care what is selected, only whether a row exists.\n\n**NOT EXISTS vs NOT IN:** NOT EXISTS is safe when there are NULLs; NOT IN returns nothing if the list contains a NULL. Prefer NOT EXISTS.',
  when: 'Customers who have bought something, products never ordered, "latest order per customer".',
  how: ['Write the outer query with a table alias.', 'Write the inner query that links to the outer alias in its WHERE.', 'For "has any" use EXISTS; for "has none" use NOT EXISTS.', 'Test on a couple of rows you can check by hand.'],
  app: [['SQL editor → Function library → "Filtering" → EXISTS / NOT EXISTS.', 'sql', null, '#sqlLib']],
  ex: [['SELECT c.company_name, (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS orders FROM customers c ORDER BY orders DESC LIMIT 5;', 'A count per row.'], ['SELECT name FROM products p WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.id);', 'Never ordered.'], ['SELECT o.customer_id, o.id, o.order_date FROM orders o WHERE o.order_date = (SELECT MAX(o2.order_date) FROM orders o2 WHERE o2.customer_id = o.customer_id) ORDER BY o.customer_id LIMIT 10;', 'Each customer\'s latest order.']],
  practice: [{ task: 'Show company_name of customers who have at least one order (use EXISTS).', answer: 'SELECT company_name FROM customers c WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)', hint: 'WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)' }],
  recap: ['Correlated = uses the outer row.', 'EXISTS asks "any?"; prefer NOT EXISTS to NOT IN.']
});
LESSONS.push({
  lv: 'a', id: 'cte', t: 'WITH: naming steps (CTEs)',
  goal: 'Write long queries as clear, named steps.',
  story: 'A recipe that says: "Step 1: make the dough. Step 2: use the dough to make bread."',
  words: [['CTE (Common Table Expression)', 'A named temporary result defined with WITH at the start of a query.'], ['WITH name AS (…)', 'Defines a CTE.']],
  body: '```\nWITH revenue AS (\n  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS total\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id\n  GROUP BY o.customer_id\n)\nSELECT c.company_name, r.total\nFROM revenue r JOIN customers c ON c.id = r.customer_id\nORDER BY r.total DESC LIMIT 5;\n```\n\n- Several steps: `WITH a AS (…), b AS (SELECT … FROM a) SELECT … FROM b`.\n- A CTE only exists while that one query runs.\n- It does the same job as a subquery in FROM, but reads top to bottom like a story.\n- It also fixes the "fan-out" problem from level 6: total the detail first in a step, then join.',
  when: 'Any query with more than one stage: totals then ranking, cleaning then counting.',
  how: ['Write down the stages in words.', 'Write stage 1 as a SELECT and test it.', 'Wrap it: WITH stage1 AS ( … ).', 'Write the next stage selecting FROM stage1, and so on.', 'The final SELECT uses the last stage.'],
  app: [['SQL editor → Function library → "Subqueries and WITH".', 'sql', null, '#sqlLib']],
  ex: [['WITH revenue AS (\n  SELECT o.customer_id, SUM(oi.quantity * oi.unit_price) AS total\n  FROM orders o JOIN order_items oi ON oi.order_id = o.id\n  GROUP BY o.customer_id\n)\nSELECT c.company_name, ROUND(r.total, 2) AS total\nFROM revenue r JOIN customers c ON c.id = r.customer_id\nORDER BY r.total DESC LIMIT 5;', 'Top customers in two readable steps.']],
  practice: [{ task: 'Using WITH, first count orders per customer_id (call the step counts, the count column n), then show only customer_id and n where n >= 6.', answer: 'WITH counts AS (SELECT customer_id, COUNT(*) AS n FROM orders GROUP BY customer_id) SELECT customer_id, n FROM counts WHERE n >= 6', hint: 'WITH counts AS (SELECT customer_id, COUNT(*) AS n …) SELECT … FROM counts WHERE n >= 6' }],
  recap: ['WITH step AS (SELECT …) SELECT … FROM step.', 'Break long queries into named, testable steps.']
});
LESSONS.push({
  lv: 'a', id: 'setops', t: 'UNION, INTERSECT and EXCEPT',
  goal: 'Stack and compare the results of two queries.',
  story: 'Two lists of names. UNION: everyone on either list. INTERSECT: names on both lists. EXCEPT: names on the first but not the second.',
  words: [['UNION', 'Stack two results and remove duplicates.'], ['UNION ALL', 'Stack and keep duplicates (faster).'], ['INTERSECT', 'Rows in both results.'], ['EXCEPT', 'Rows in the first result but not the second (MINUS in Oracle).']],
  body: 'Both queries must return the **same number of columns** with **compatible types**. Column names come from the first query. ORDER BY goes once, at the very end.\n\n- `SELECT city FROM customers UNION SELECT ship_city FROM orders` – every city mentioned anywhere.\n- `SELECT city FROM customers INTERSECT SELECT ship_city FROM orders` – cities in both.\n- `SELECT id FROM customers EXCEPT SELECT customer_id FROM orders` – customers with no orders.\n\nUse UNION ALL when you know there are no duplicates, or you want them: it skips the de-duplication work.',
  when: 'Combining similar lists (this year + last year, customers + suppliers), comparing two lists.',
  how: ['Write each query separately and check they have the same columns in the same order.', 'Join them with UNION / UNION ALL / INTERSECT / EXCEPT.', 'Add a label column (like \'customer\' AS source) if you need to know where each row came from.', 'Put ORDER BY at the end.'],
  app: [['SQL editor → Function library → "Combining results".', 'sql', null, '#sqlLib']],
  ex: [['SELECT city FROM customers UNION SELECT ship_city FROM orders ORDER BY city;', 'All cities, once each.'], ["SELECT 'customer' AS source, contact_name AS name FROM customers UNION ALL SELECT 'employee', first_name FROM employees LIMIT 8;", 'Two lists with a source label.'], ['SELECT id FROM customers EXCEPT SELECT customer_id FROM orders;', 'Customers with no orders.']],
  practice: [{ task: 'List every city that appears in customers.city or orders.ship_city (no duplicates).', answer: 'SELECT city FROM customers UNION SELECT ship_city FROM orders', hint: 'SELECT city FROM customers UNION SELECT ship_city FROM orders' }],
  recap: ['Same number and types of columns.', 'UNION removes duplicates, UNION ALL keeps them.', 'INTERSECT = both, EXCEPT = first minus second.']
});
LESSONS.push({
  lv: 'a', id: 'window1', t: 'Window functions 1: OVER and ranking',
  goal: 'Number and rank rows without squashing them.',
  story: 'In a race line-up, every runner keeps their own spot but also gets a place number.',
  words: [['Window function', 'A function that looks at a set of rows related to the current row, but keeps every row (unlike GROUP BY).'], ['OVER (…)', 'Says which rows the window covers and in which order.'], ['ROW_NUMBER()', '1, 2, 3… with no ties.'], ['RANK()', 'Places with ties sharing a place; the next place is skipped (1, 2, 2, 4).'], ['DENSE_RANK()', 'Ties share a place; no gap (1, 2, 2, 3).'], ['NTILE(n)', 'Splits rows into n roughly equal groups (quarters, tenths).']],
  body: '`SELECT name, unit_price, ROW_NUMBER() OVER (ORDER BY unit_price DESC) AS position FROM products;`\n\n- **GROUP BY squashes** rows into one per group. **Window functions keep every row** and add a new column.\n- `OVER (ORDER BY …)` decides the order used for numbering.\n- Supported in SQLite 3.25+, PostgreSQL, MySQL 8+, SQL Server, Oracle.\n\nThe difference between ROW_NUMBER, RANK and DENSE_RANK only shows when there are **ties**.',
  anatomy: { sql: 'ROW_NUMBER() OVER (ORDER BY unit_price DESC) AS position', parts: [['ROW_NUMBER()', 'give each row a number'], ['OVER (ORDER BY unit_price DESC)', 'counting from the most expensive'], ['AS position', 'call it position']] },
  when: 'Leaderboards, "the 3rd most expensive", splitting customers into quartiles.',
  how: ['Decide what to number or rank by.', 'Pick ROW_NUMBER (no ties), RANK (ties, gaps) or DENSE_RANK (ties, no gaps).', 'Write function() OVER (ORDER BY …) in SELECT.', 'Remember: you cannot filter on it in WHERE of the same query; wrap it in a CTE and filter outside.'],
  app: [['SQL editor → Function library → "Window functions" (11 ready recipes).', 'sql', null, '#sqlLib']],
  ex: [['SELECT ROW_NUMBER() OVER (ORDER BY unit_price DESC) AS position, name, unit_price FROM products LIMIT 10;', 'Numbered by price.'], ['SELECT name, units_in_stock, RANK() OVER (ORDER BY units_in_stock DESC) AS rank, DENSE_RANK() OVER (ORDER BY units_in_stock DESC) AS dense FROM products LIMIT 12;', 'Compare RANK and DENSE_RANK.'], ['SELECT name, unit_price, NTILE(4) OVER (ORDER BY unit_price DESC) AS price_quarter FROM products;', 'Four price quarters.']],
  practice: [{ task: 'Number the products from most to least expensive with ROW_NUMBER, showing the number and the name.', answer: 'SELECT ROW_NUMBER() OVER (ORDER BY unit_price DESC), name FROM products', hint: 'ROW_NUMBER() OVER (ORDER BY unit_price DESC)' }],
  recap: ['Window functions keep all rows.', 'ROW_NUMBER, RANK, DENSE_RANK, NTILE with OVER (ORDER BY …).']
});
LESSONS.push({
  lv: 'a', id: 'window2', t: 'Window functions 2: PARTITION BY and running totals',
  goal: 'Restart numbering per group, and add running totals and moving averages.',
  story: 'Each team has its own line-up and its own place numbers. And a savings book shows the balance after every deposit.',
  words: [['PARTITION BY', 'Inside OVER: restart the window for each group.'], ['Running total', 'SUM(x) OVER (ORDER BY …): the total so far on each row.'], ['Frame', 'Which nearby rows the window covers, like ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.']],
  body: '- **Per group:** `ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC)` numbers products within each category.\n- **Group total on every row:** `SUM(units_in_stock) OVER (PARTITION BY category_id)`.\n- **Share of total:** `100.0 * units_in_stock / SUM(units_in_stock) OVER ()` – empty OVER () means "all rows".\n- **Running total:** `SUM(orders) OVER (ORDER BY month)`.\n- **Moving average (3 months):** `AVG(orders) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.',
  when: 'Rank within each category, balance over time, cumulative sales, smoothed trends, percent of total.',
  how: ['Decide the groups (PARTITION BY) and the order (ORDER BY) of the window.', 'Choose the function: ROW_NUMBER/RANK, SUM, AVG, COUNT.', 'For running totals add ORDER BY; for moving averages add a ROWS BETWEEN frame.', 'Usually build the per-month (or per-day) totals first in a WITH step.'],
  app: [['SQL editor → Function library → "Running total", "Moving average", "Share of the total".', 'sql', null, '#sqlLib']],
  ex: [['SELECT category_id, name, unit_price, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC) AS place FROM products;', 'Numbering restarts per category.'], ["WITH m AS (SELECT STRFTIME('%Y-%m', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month)\nSELECT month, orders, SUM(orders) OVER (ORDER BY month) AS running_total, ROUND(AVG(orders) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS avg_3_months FROM m;", 'Running total and 3-month average.'], ['SELECT name, units_in_stock, ROUND(100.0 * units_in_stock / SUM(units_in_stock) OVER (), 1) AS percent FROM products ORDER BY percent DESC LIMIT 5;', 'Share of all stock.']],
  practice: [{ task: 'Show each employee first_name, department_id, salary, and the total salary of their department on every row (SUM … OVER PARTITION BY).', answer: 'SELECT first_name, department_id, salary, SUM(salary) OVER (PARTITION BY department_id) FROM employees', hint: 'SUM(salary) OVER (PARTITION BY department_id)' }],
  recap: ['PARTITION BY restarts per group.', 'SUM() OVER (ORDER BY) = running total; frames make moving averages.']
});
LESSONS.push({
  lv: 'a', id: 'window3', t: 'Window functions 3: LAG, LEAD and top N per group',
  goal: 'Compare with the previous/next row and pick the top N in each group.',
  story: 'Look at the runner in front of you (LAG) or behind you (LEAD). And pick the best two players from every team.',
  words: [['LAG(x)', 'The value of x in the previous row of the window.'], ['LEAD(x)', 'The value of x in the next row.'], ['FIRST_VALUE / LAST_VALUE', 'The first/last value in the window.']],
  body: '**Change since last month:**\n```\nWITH m AS (SELECT STRFTIME(\'%Y-%m\', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month)\nSELECT month, orders, orders - LAG(orders) OVER (ORDER BY month) AS change FROM m;\n```\n\n**Top 2 per category** (a very common pattern):\n```\nWITH ranked AS (\n  SELECT category_id, name, unit_price,\n         ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC) AS n\n  FROM products\n)\nSELECT * FROM ranked WHERE n <= 2;\n```\nYou cannot use the window column in WHERE directly, so number in a WITH step and filter outside.',
  when: 'Month-on-month change, time between visits, best sellers per category, latest record per customer.',
  how: ['For comparisons: build one row per period, then LAG over the period order.', 'For top N per group: ROW_NUMBER with PARTITION BY the group and ORDER BY the measure, in a WITH step; then WHERE n <= N.'],
  app: [['SQL editor → Function library → "LAG and LEAD", "Top 3 in each group".', 'sql', null, '#sqlLib']],
  ex: [["WITH m AS (SELECT STRFTIME('%Y-%m', order_date) AS month, COUNT(*) AS orders FROM orders GROUP BY month)\nSELECT month, orders, LAG(orders) OVER (ORDER BY month) AS previous, orders - LAG(orders) OVER (ORDER BY month) AS change FROM m;", 'Change since last month.'], ['WITH ranked AS (SELECT category_id, name, unit_price, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC) AS n FROM products)\nSELECT * FROM ranked WHERE n <= 2;', 'Top 2 per category.'], ['SELECT category_id, name, unit_price, FIRST_VALUE(name) OVER (PARTITION BY category_id ORDER BY unit_price) AS cheapest FROM products;', 'Cheapest product of the category on each row.']],
  practice: [{ task: 'Show the most expensive product (name and unit_price) in each category_id, using ROW_NUMBER in a WITH step.', answer: 'WITH r AS (SELECT category_id, name, unit_price, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC) AS n FROM products) SELECT category_id, name, unit_price FROM r WHERE n = 1', hint: 'ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY unit_price DESC) AS n … WHERE n = 1' }],
  recap: ['LAG/LEAD look at neighbouring rows.', 'Top N per group: ROW_NUMBER in WITH, then filter.']
});
LESSONS.push({
  lv: 'a', id: 'recursive', t: 'Recursive WITH',
  goal: 'Walk hierarchies and generate series.',
  story: 'A family tree: find my parents, then their parents, then theirs, until there are no more.',
  words: [['Recursive CTE', 'A WITH step that refers to itself, repeating until no new rows are found.'], ['Anchor', 'The starting rows.'], ['Recursive part', 'The rows found from the previous round.']],
  body: '```\nWITH RECURSIVE days(d) AS (\n  SELECT DATE(\'2026-09-01\')              -- anchor\n  UNION ALL\n  SELECT DATE(d, \'+1 day\') FROM days     -- recursive part\n  WHERE d < \'2026-09-07\'                 -- stop rule\n)\nSELECT d FROM days;\n```\n\n- The anchor runs once; the recursive part runs again and again on the rows from the previous round.\n- **Always have a stop rule**, or it runs forever (databases have safety limits).\n- SQL Server writes `WITH` without the word RECURSIVE.\n- Classic use: an employees table with `manager_id` → everyone under a given manager, at any depth.',
  when: 'Org charts, category trees, bill of materials, filling in missing dates for a report.',
  how: ['Write the anchor: the starting row(s).', 'Write the step that finds the next row(s) from the previous ones.', 'Add a stop rule.', 'Join the result to your data (for example LEFT JOIN orders on each date to show days with zero orders).'],
  app: [['SQL editor → Function library → "WITH RECURSIVE".', 'sql', null, '#sqlLib']],
  ex: [["WITH RECURSIVE days(d) AS (SELECT DATE('2026-09-01') UNION ALL SELECT DATE(d, '+1 day') FROM days WHERE d < '2026-09-07') SELECT d FROM days;", 'A week of dates.'], ["WITH RECURSIVE days(d) AS (SELECT DATE('2026-09-01') UNION ALL SELECT DATE(d, '+1 day') FROM days WHERE d < '2026-09-14')\nSELECT days.d, COUNT(o.id) AS orders FROM days LEFT JOIN orders o ON o.order_date = days.d GROUP BY days.d;", 'Every day, even days with no orders.']],
  recap: ['Anchor + recursive part + stop rule.', 'Great for hierarchies and date series.']
});
LESSONS.push({
  lv: 'a', id: 'pivot', t: 'Pivoting: rows into columns',
  goal: 'Build spreadsheet-style reports with one column per category.',
  story: 'Instead of a long list "month, status, count", make a grid with months down the side and statuses across the top.',
  words: [['Pivot', 'Turning values of a column into separate columns.'], ['Conditional aggregation', 'SUM(CASE WHEN … THEN 1 ELSE 0 END), one per new column.']],
  body: '```\nSELECT STRFTIME(\'%Y-%m\', order_date) AS month,\n  SUM(CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = \'shipped\'   THEN 1 ELSE 0 END) AS shipped,\n  SUM(CASE WHEN status = \'pending\'   THEN 1 ELSE 0 END) AS pending,\n  SUM(CASE WHEN status = \'cancelled\' THEN 1 ELSE 0 END) AS cancelled\nFROM orders\nGROUP BY month ORDER BY month;\n```\n\nThis works in every database. SQL Server and Oracle also have a PIVOT keyword, and PostgreSQL has crosstab, but conditional aggregation is simpler and portable.\n\nTo sum money instead of counting, put the amount instead of 1: `SUM(CASE WHEN … THEN amount ELSE 0 END)`.',
  when: 'Monthly reports by category, sales by region across the top, attendance grids.',
  how: ['Decide what goes down the side (GROUP BY) and what goes across (one CASE per value).', 'List the values that become columns.', 'Write one SUM(CASE WHEN column = value THEN 1 ELSE 0 END) AS value per column.', 'Export to Excel if people want it as a spreadsheet.'],
  app: [['CSV and Excel buttons above any result export the grid.', 'sql']],
  ex: [["SELECT STRFTIME('%Y-%m', order_date) AS month,\n  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered,\n  SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) AS shipped,\n  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,\n  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled\nFROM orders GROUP BY month ORDER BY month;", 'Statuses across, months down.']],
  practice: [{ task: "Show each country with two columns: retail (count of customers with segment 'Retail') and wholesale (count with segment 'Wholesale').", answer: "SELECT country, SUM(CASE WHEN segment = 'Retail' THEN 1 ELSE 0 END) AS retail, SUM(CASE WHEN segment = 'Wholesale' THEN 1 ELSE 0 END) AS wholesale FROM customers GROUP BY country", hint: "SUM(CASE WHEN segment = 'Retail' THEN 1 ELSE 0 END) AS retail, …" }],
  recap: ['Pivot = SUM(CASE WHEN … THEN 1 ELSE 0 END) per column, grouped by the row label.']
});
LESSONS.push({
  lv: 'a', id: 'dupes', t: 'Finding and removing duplicates',
  goal: 'Spot repeated records and clean them up safely.',
  story: 'The same child written twice on the register. Find the doubles, keep one, cross out the rest.',
  words: [['Duplicate', 'Two or more rows that describe the same real thing.']],
  body: '**1. Find them** with GROUP BY and HAVING:\n`SELECT contact_name, COUNT(*) FROM customers GROUP BY contact_name HAVING COUNT(*) > 1;`\n\n**2. See them all**, numbered inside each group:\n```\nSELECT id, contact_name, ROW_NUMBER() OVER (PARTITION BY contact_name ORDER BY id) AS n\nFROM customers;\n```\nRows with `n > 1` are the extra copies (keeping the oldest id).\n\n**3. Remove the extras** (carefully, after checking and backing up):\n```\nDELETE FROM t WHERE id IN (\n  SELECT id FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY key_column ORDER BY id) AS n FROM t) x\n  WHERE n > 1\n);\n```\n\n**4. Stop it happening again** with a UNIQUE rule on the key column.\n\nDecide carefully what "the same" means: same email? same name and phone? Messy text may need TRIM/LOWER first.',
  when: 'Cleaning imported lists, merging data from two systems, before adding a UNIQUE rule.',
  how: ['Decide which columns define "the same thing".', 'Count duplicates with GROUP BY … HAVING COUNT(*) > 1.', 'Look at them and decide which copy to keep (oldest, newest, most complete).', 'Back up, then delete the others inside a transaction.', 'Add a UNIQUE rule so it cannot happen again.'],
  app: [['Import a file tab: check for duplicates after importing a spreadsheet.', 'import']],
  ex: [['SELECT contact_name, COUNT(*) AS copies FROM customers GROUP BY contact_name HAVING COUNT(*) > 1 ORDER BY copies DESC;', 'Contact names that appear more than once (different people can share a name; this is where judgement comes in).'], ['SELECT id, contact_name, company_name, ROW_NUMBER() OVER (PARTITION BY contact_name ORDER BY id) AS n FROM customers WHERE contact_name IN (SELECT contact_name FROM customers GROUP BY contact_name HAVING COUNT(*) > 1) ORDER BY contact_name, n;', 'Each copy numbered.']],
  practice: [{ task: 'Find ship_city values that appear in more than 25 orders (show ship_city and the count).', answer: 'SELECT ship_city, COUNT(*) FROM orders GROUP BY ship_city HAVING COUNT(*) > 25', hint: 'GROUP BY ship_city HAVING COUNT(*) > 25' }],
  recap: ['Find: GROUP BY … HAVING COUNT(*) > 1.', 'Pick: ROW_NUMBER() OVER (PARTITION BY …).', 'Prevent: UNIQUE rule.']
});

/* ================= 10. WORKING LIKE A PROFESSIONAL ================= */
LESSONS.push({
  lv: 'p', id: 'plans', t: 'Why a query is slow: reading plans',
  goal: 'Use EXPLAIN to see how the database finds your answer.',
  story: 'Looking for one sock by emptying every drawer, versus knowing which drawer it is in.',
  words: [['Query plan', 'The database\'s step-by-step plan for running a query.'], ['EXPLAIN', 'Shows the plan without (or as well as) running it. EXPLAIN QUERY PLAN in SQLite.'], ['Scan', 'Reading every row of a table.'], ['Seek / search', 'Jumping to the right rows using an index.']],
  body: '- SQLite: `EXPLAIN QUERY PLAN SELECT …` → look for **SCAN** (reads everything) vs **SEARCH … USING INDEX** (jumps).\n- PostgreSQL: `EXPLAIN` or `EXPLAIN ANALYZE` (actually runs it and shows times) → **Seq Scan** vs **Index Scan**.\n- MySQL: `EXPLAIN` → type **ALL** means a full scan; **ref**/**range** use an index.\n- SQL Server: the "execution plan" (Table Scan / Index Scan vs Index Seek).\n\nOn a small table a scan is fine. On millions of rows, a scan in a query that runs often is the usual cause of slowness.',
  when: 'A query that takes seconds instead of a blink, or gets slower as data grows.',
  how: ['Time the query.', 'Run EXPLAIN on it.', 'Find steps that scan big tables.', 'Add an index on the column used to find rows there, or rewrite the filter so an index can be used (next lesson).', 'Run EXPLAIN and time it again to prove it helped.'],
  app: [['SQL editor: "How will it run?" shows the plan with plain tips.', 'sql'], ['Table design tab: "Make searching faster" adds an index.', 'design', 'orders']],
  ex: [['EXPLAIN QUERY PLAN SELECT * FROM orders WHERE ship_city = \'Accra\';', 'SCAN: every row is read.'], ['EXPLAIN QUERY PLAN SELECT * FROM orders WHERE id = 42;', 'SEARCH using the primary key: instant.']],
  recap: ['EXPLAIN shows the plan.', 'Scan = read everything; seek/search = jump with an index.']
});
LESSONS.push({
  lv: 'p', id: 'fast', t: 'Writing fast queries',
  goal: 'Know the habits that keep queries fast on big data.',
  story: 'Ask the librarian for "books by Achebe", not "every book, and I will look through them".',
  words: [['Sargable', 'A condition written so the database can use an index (Search ARGument ABLE).']],
  body: '1. **Select only the columns you need.** `SELECT *` moves more data.\n2. **Filter early** with WHERE, so fewer rows are joined and grouped.\n3. **Do not wrap indexed columns in functions** in WHERE. `WHERE STRFTIME(\'%Y\', order_date) = \'2026\'` cannot use an index on order_date; `WHERE order_date >= \'2026-01-01\' AND order_date < \'2027-01-01\'` can.\n4. **Avoid leading wildcards** (`LIKE \'%abc\'`) on big tables.\n5. **Index foreign keys** and columns you filter or sort by often.\n6. **Use EXISTS** for "has any" instead of counting everything.\n7. **UNION ALL** instead of UNION when duplicates are impossible.\n8. **LIMIT** while exploring.\n9. **Test with realistic amounts of data**; small test tables hide slowness.',
  when: 'Reports on large tables, dashboards that refresh often, anything users wait for.',
  how: ['Measure first; do not guess.', 'Check the plan.', 'Apply one habit at a time and measure again.', 'Keep the fastest version that still gives the same answer.'],
  app: [['SQL editor shows how many milliseconds each query took, next to the Run button.', 'sql']],
  ex: [["EXPLAIN QUERY PLAN SELECT id FROM orders WHERE STRFTIME('%Y', order_date) = '2026';", 'A function on the column: SCAN even with an index.'], ["CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (order_date);", 'Add an index on order_date.'], ["EXPLAIN QUERY PLAN SELECT id FROM orders WHERE order_date >= '2026-01-01' AND order_date < '2027-01-01';", 'Range on the raw column: SEARCH using the index.']],
  recap: ['Fewer columns, filter early, no functions on indexed columns, index keys, measure.']
});
LESSONS.push({
  lv: 'p', id: 'nulltraps', t: 'NULL traps (the full list)',
  goal: 'Avoid the silent mistakes NULL causes.',
  story: 'Unknown plus 5 is still unknown. And "is unknown equal to unknown?" – nobody knows.',
  words: [['Three-valued logic', 'Conditions can be TRUE, FALSE or UNKNOWN; only TRUE rows are kept.']],
  body: '1. `= NULL` never matches → use **IS NULL**.\n2. `<>` and `NOT IN` skip NULL rows → add `OR col IS NULL` if needed.\n3. **NOT IN with a NULL in the list returns nothing** → use NOT EXISTS.\n4. **Maths with NULL is NULL** → `COALESCE(col, 0)`.\n5. **Text joined with NULL** is NULL in most databases (`\'a\' || NULL`) → COALESCE.\n6. **COUNT(col) skips NULLs**, COUNT(*) does not.\n7. **AVG ignores NULLs**, so it divides by fewer rows than you might think.\n8. **SUM of no rows is NULL**, not 0 → `COALESCE(SUM(x), 0)`.\n9. **UNIQUE** columns usually allow several NULLs.\n10. **Sorting**: NULLs go first in some databases, last in others (`NULLS LAST` in PostgreSQL).',
  when: 'Totals that look too small, counts that do not add up, queries that suddenly return nothing.',
  how: ['For every column in a condition or calculation, ask: can it be NULL?', 'If yes, decide what NULL should mean here and handle it with IS NULL or COALESCE.', 'Compare COUNT(*) with COUNT(col) to see how many NULLs there are.'],
  app: [['Filter rule "is empty" finds NULLs; empty cells show "empty" in grey.', 'browse', 'orders', '#addFilterBtn']],
  ex: [['SELECT 5 + NULL AS maths, COUNT(*) AS all_rows, COUNT(employee_id) AS with_employee FROM orders;', 'Traps 4 and 6.'], ["SELECT COUNT(*) FROM customers WHERE segment NOT IN ('Retail', NULL);", 'Trap 3: always 0.'], ["SELECT COALESCE(SUM(quantity), 0) AS total FROM order_items WHERE order_id = -1;", 'Trap 8, fixed.']],
  recap: ['IS NULL, COALESCE, NOT EXISTS, COUNT(col) vs COUNT(*).']
});
LESSONS.push({
  lv: 'p', id: 'injection', t: 'Security: SQL injection and parameters',
  goal: 'Understand the most famous database attack and how to prevent it.',
  story: 'If a stranger writes "…and give me all the money" on an order slip and the cashier reads it out as an instruction, that is a disaster. Values must stay values.',
  words: [['SQL injection', 'An attack where someone types SQL into a form, and a badly built app runs it.'], ['Parameter (placeholder)', 'A ? (or $1, @p1, :name) in the SQL, with the value sent separately so it can never become code.'], ['Prepared statement', 'SQL with placeholders, prepared once and run with different values.']],
  body: 'A careless app builds SQL by gluing text:\n\n`"SELECT * FROM users WHERE name = \'" + typed_name + "\'"`\n\nIf someone types `\' OR 1=1 --`, the SQL becomes\n\n`SELECT * FROM users WHERE name = \'\' OR 1=1 --\'`\n\n`1=1` is always true and `--` hides the rest, so **every user is returned**. Worse input could delete tables.\n\n**The fix: parameters.** Write `WHERE name = ?` and send the value separately. The database treats it only as a value, never as SQL. Every programming language supports this.\n\nAlso: give apps accounts with only the permissions they need, and never show raw database errors to the public.',
  when: 'Whenever you or your team build anything that sends user input to a database.',
  how: ['Never glue user input into SQL text.', 'Use placeholders (?, $1, @p1) and pass values separately.', 'Give the app\'s database user the least permissions possible.', 'Test forms by typing a single quote \' – if you get a database error, the app is vulnerable.'],
  app: [['Every Tablewise filter, form and edit sends values as parameters. Browse data tab → "Show SQL" shows where they go.', 'browse', 'customers', '#browseSearch']],
  ex: [["SELECT company_name FROM customers WHERE company_name = '' OR 1=1 --' LIMIT 3;", 'What an injected query looks like: the OR 1=1 returns everything.']],
  recap: ['Never glue input into SQL.', 'Use parameters.', 'Least privilege for app accounts.']
});
LESSONS.push({
  lv: 'p', id: 'perms', t: 'Users, roles and permissions',
  goal: 'Control who can read and change what.',
  story: 'Some people have the key to look in the cupboard; fewer have the key to move things; one person has the key to the building.',
  words: [['User / login', 'An account that connects to the database.'], ['Role', 'A named group of permissions you can give to many users.'], ['GRANT', 'Gives a permission.'], ['REVOKE', 'Takes it away.'], ['Least privilege', 'Give each person or app only what they need.']],
  body: 'On server databases (PostgreSQL, MySQL, SQL Server, Oracle) an administrator creates users and roles:\n\n```\nCREATE ROLE report_reader;\nGRANT SELECT ON orders, customers TO report_reader;\nGRANT report_reader TO ama;\nREVOKE SELECT ON customers FROM report_reader;\n```\n\nTypical set-up in a company:\n- **Readers** (analysts, report tools): SELECT only.\n- **Writers** (the app): SELECT, INSERT, UPDATE, DELETE on its tables.\n- **Owners/admins**: CREATE/ALTER/DROP, and managing users.\n\nViews help: grant access to a view that shows only some columns (no salaries) instead of the whole table.\n\nSQLite has no users; whoever can open the file can do everything, so protect the file itself.',
  when: 'Any shared database: teams, apps, auditors, interns, contractors.',
  how: ['List the kinds of people and apps that use the database.', 'For each, list what they must read and change.', 'Create one role per kind and grant exactly that.', 'Give people roles, not individual permissions.', 'Review access regularly and remove leavers.'],
  app: [['Open a database screen: tick "Open in read-only mode" on a server connection (desktop app).', 'connect'], ['Settings: Read-only mode stops all changes in Tablewise.', 'settings', null, '#setRO']],
  quiz: [['A reporting tool only needs to read sales. What should its account have?', ['Everything', 'SELECT on the tables it reports on', 'DROP'], 1, 'Least privilege: read only what it needs.']],
  recap: ['Users log in; roles group permissions; GRANT and REVOKE manage them.', 'Least privilege, and use views to hide sensitive columns.']
});
LESSONS.push({
  lv: 'p', id: 'backups', t: 'Backups, restores and history',
  goal: 'Make sure data can always be brought back.',
  story: 'Photocopy your homework before your little brother spills juice on it – and check the photocopy is readable.',
  words: [['Backup', 'A copy of the database at a point in time.'], ['Restore', 'Putting a backup back.'], ['Point-in-time recovery', 'Restoring to any exact moment using backups plus logs (server databases).']],
  body: '- **SQLite**: the whole database is one file. Copy it (when nothing is writing).\n- **PostgreSQL**: `pg_dump` / `pg_restore`, plus continuous archiving for point-in-time recovery.\n- **MySQL**: `mysqldump`, or physical backup tools.\n- **SQL Server**: `BACKUP DATABASE … TO DISK = …` and `RESTORE DATABASE`, with full, differential and log backups.\n- Cloud databases usually back up automatically; check how long backups are kept.\n\n**A backup you have never restored is only a hope.** Test restores regularly on a spare machine.\n\nFollow the **3-2-1 rule**: 3 copies, on 2 different kinds of storage, 1 off-site.',
  when: 'On a schedule (usually nightly), and before big changes, imports or upgrades.',
  how: ['Decide how much data you can afford to lose (an hour? a day?) – that sets how often to back up.', 'Automate the backups.', 'Keep copies in another place.', 'Practise restoring to a test database.', 'Before any big change, take an extra backup.'],
  app: [['Open a database screen: "Save a copy" backs up a database file.', 'connect'], ['Change history: export the log of changes as CSV.', 'activity']],
  quiz: [['What makes a backup trustworthy?', ['It is big', 'You have tested restoring it', 'It is recent only'], 1, 'Only a tested restore proves the backup works.']],
  recap: ['Automate backups, keep copies elsewhere, test restores.', '3 copies, 2 media, 1 off-site.']
});
LESSONS.push({
  lv: 'p', id: 'programs', t: 'Stored procedures, functions and triggers',
  goal: 'Know what code inside the database is and when it is used.',
  story: 'A vending machine: press one button and a whole set of steps runs inside the machine.',
  words: [['Stored procedure', 'A saved set of SQL steps you run by name, with inputs.'], ['User-defined function', 'Your own function, usable inside queries.'], ['Trigger', 'SQL that runs automatically when rows are inserted, updated or deleted.']],
  body: '- **Stored procedures** (PostgreSQL, MySQL, SQL Server, Oracle): `CALL close_month(2026, 9);` runs many steps safely in one go. Written in the database\'s own language (PL/pgSQL, T-SQL, PL/SQL).\n- **Functions**: `SELECT tax(price) FROM products`.\n- **Triggers**: "whenever a row is deleted from orders, write a line to an audit table". SQLite supports triggers too.\n\nThey keep rules close to the data, but they are also hidden logic: document them well.\n\nA SQLite trigger example:\n```\nCREATE TABLE price_log (product_id INTEGER, old_price REAL, new_price REAL, changed_at TEXT);\nCREATE TRIGGER log_price AFTER UPDATE OF unit_price ON products\nBEGIN\n  INSERT INTO price_log VALUES (OLD.id, OLD.unit_price, NEW.unit_price, DATETIME(\'now\'));\nEND;\n```\nOLD and NEW are the row before and after the change.',
  when: 'Audit logs, keeping totals up to date, complex multi-step jobs run by many apps.',
  how: ['Use them for rules that must always happen whatever app writes the data.', 'Keep them small and documented.', 'Test them like any other code.'],
  app: [['Change history tab: Tablewise keeps its own log of changes it made.', 'activity']],
  ex: [["CREATE TABLE price_log (product_id INTEGER, old_price REAL, new_price REAL, changed_at TEXT);\nCREATE TRIGGER log_price AFTER UPDATE OF unit_price ON products\nBEGIN\n  INSERT INTO price_log VALUES (OLD.id, OLD.unit_price, NEW.unit_price, DATETIME('now'));\nEND;", 'Create the log and the trigger.'], ['UPDATE products SET unit_price = unit_price + 1 WHERE id = 1;', 'Change a price…'], ['SELECT * FROM price_log;', '…and the trigger wrote a log line by itself.']],
  recap: ['Procedures = named steps; functions = your own functions; triggers = automatic reactions to changes.']
});
LESSONS.push({
  lv: 'p', id: 'dialects', t: 'SQLite, PostgreSQL, MySQL, SQL Server: the differences',
  goal: 'Move queries between databases without surprises.',
  story: 'English in Ghana, the UK and the US: the same language, a few different words.',
  words: [['Dialect', 'One database\'s version of SQL.'], ['ANSI SQL', 'The official standard all dialects are based on.']],
  body: '**The same everywhere:** SELECT, FROM, WHERE, JOIN, GROUP BY, HAVING, ORDER BY, INSERT, UPDATE, DELETE, CASE, COALESCE, window functions (modern versions).\n\n**Different:**\n- **First N rows:** LIMIT (SQLite, PostgreSQL, MySQL) · TOP (SQL Server) · FETCH FIRST (standard, Oracle)\n- **Glue text:** || (SQLite, PostgreSQL, Oracle) · CONCAT() (MySQL, SQL Server, also PostgreSQL) · + (SQL Server)\n- **Auto-number:** AUTOINCREMENT · SERIAL / IDENTITY · AUTO_INCREMENT · IDENTITY(1,1)\n- **Today:** DATE(\'now\') · CURRENT_DATE · CURDATE() · GETDATE()\n- **Year of a date:** STRFTIME(\'%Y\', d) · EXTRACT(YEAR FROM d) · YEAR(d) · YEAR(d)\n- **Quoting names:** "name" (standard) · `name` (MySQL) · [name] (SQL Server)\n- **Text length:** LENGTH · LENGTH · CHAR_LENGTH · LEN\n- **Upsert:** ON CONFLICT · ON CONFLICT · ON DUPLICATE KEY UPDATE · MERGE\n- **Types:** SQLite is flexible; the others enforce types strictly.\n- **Capitals in text comparisons:** usually ignored in MySQL and SQL Server; not in PostgreSQL (use ILIKE/LOWER).',
  when: 'Moving a query or a whole database to another system, or reading examples written for another database.',
  how: ['Write standard SQL where you can.', 'When a query fails after moving, check the list above first: limits, text gluing, dates, auto-numbers.', 'Search "<database> <function>" for the exact spelling.'],
  app: [['SQL editor → Function library automatically shows the version for the database you are connected to.', 'sql', null, '#sqlLib'], ['The desktop app connects to all four kinds.', 'connect']],
  recap: ['Core SQL is shared; limits, text, dates, auto-numbers and quoting differ.']
});
LESSONS.push({
  lv: 'p', id: 'style', t: 'Readable SQL and teamwork',
  goal: 'Write SQL that others (and future you) can read and trust.',
  story: 'Neat handwriting and a label on every jar.',
  words: [['Style guide', 'An agreed way of writing SQL in a team.'], ['Version control', 'Keeping SQL files in a system like Git so every change is recorded.']],
  body: '- **Keywords in CAPITALS**, names in lowercase_with_underscores.\n- **One clause per line**, and one column per line in long SELECTs.\n- **Meaningful aliases** (`c` for customers is fine; `t1`, `t2` are not).\n- **Always write column lists** in INSERT and avoid `SELECT *` in saved reports.\n- **Comment the why**, not the what: `-- exclude test customers created by the QA team`.\n- **Use WITH steps** instead of deeply nested subqueries.\n- **Keep important SQL in files** under version control, with a short description.\n- **Name things consistently**: tables plural, ids as `id`, links as `other_id`, dates as `something_date` or `something_at`.',
  when: 'Every query you save or share.',
  how: ['Write it so it works.', 'Then tidy: format, rename aliases, add comments.', 'Ask a colleague to read it; if they have questions, add comments answering them.'],
  app: [['SQL editor: "Format SQL" formats, "Save" keeps queries under a name.', 'sql']],
  ex: [["-- Top 5 customers by revenue, delivered orders only\nWITH revenue AS (\n  SELECT o.customer_id,\n         SUM(oi.quantity * oi.unit_price) AS total\n  FROM orders AS o\n  JOIN order_items AS oi ON oi.order_id = o.id\n  WHERE o.status = 'delivered'\n  GROUP BY o.customer_id\n)\nSELECT c.company_name,\n       ROUND(r.total, 2) AS revenue\nFROM revenue AS r\nJOIN customers AS c ON c.id = r.customer_id\nORDER BY r.total DESC\nLIMIT 5;", 'A tidy, commented report.']],
  recap: ['Capital keywords, one clause per line, clear aliases, comments for the why, saved in files.']
});
LESSONS.push({
  lv: 'p', id: 'project', t: 'Final project: a complete sales report',
  goal: 'Use everything together to answer a real business request.',
  story: 'Your manager asks: "For each product category, what did we sell in 2026 (delivered orders only), how does it compare with 2025, and which product sold best in each category?"',
  words: [['Requirement', 'What the person asking actually needs.']],
  body: '**Step 1 – understand the question.** Categories as rows. Money = quantity × unit_price from order_items. Only delivered orders. Two years side by side. Plus the best product per category.\n\n**Step 2 – find the tables and path.** order_items → orders (status, date) → products → categories.\n\n**Step 3 – build step by step** with WITH:\n1. `lines`: every delivered order line with year, category and product, and its amount.\n2. `by_cat`: 2025 and 2026 totals per category (conditional aggregation).\n3. `best`: top product per category in 2026 (ROW_NUMBER).\n4. Final: join by_cat and best, add the % change, sort.\n\n**Step 4 – check.** The sum of the categories should equal a simple total of all delivered lines for each year.\n\n**Step 5 – deliver.** Export to Excel, save the query with a clear name and a comment.\n\nRun the example below and read it step by step.',
  when: 'This is what real SQL work looks like.',
  how: ['Clarify the question and write it down.', 'Map tables and links.', 'Build in WITH steps, testing each.', 'Check totals against something simple.', 'Tidy, comment, save, share.'],
  app: [['SQL editor: paste, run, Excel export, Save.', 'sql']],
  ex: [["WITH lines AS (\n  SELECT STRFTIME('%Y', o.order_date) AS yr, cat.name AS category, p.name AS product,\n         oi.quantity * oi.unit_price AS amount\n  FROM order_items oi\n  JOIN orders o ON o.id = oi.order_id\n  JOIN products p ON p.id = oi.product_id\n  JOIN categories cat ON cat.id = p.category_id\n  WHERE o.status = 'delivered'\n),\nby_cat AS (\n  SELECT category,\n         SUM(CASE WHEN yr = '2025' THEN amount ELSE 0 END) AS sales_2025,\n         SUM(CASE WHEN yr = '2026' THEN amount ELSE 0 END) AS sales_2026\n  FROM lines GROUP BY category\n),\nbest AS (\n  SELECT category, product,\n         ROW_NUMBER() OVER (PARTITION BY category ORDER BY SUM(amount) DESC) AS n\n  FROM lines WHERE yr = '2026'\n  GROUP BY category, product\n)\nSELECT b.category,\n       ROUND(b.sales_2025, 2) AS sales_2025,\n       ROUND(b.sales_2026, 2) AS sales_2026,\n       ROUND((b.sales_2026 - b.sales_2025) * 100.0 / NULLIF(b.sales_2025, 0), 1) AS change_pct,\n       t.product AS best_product_2026\nFROM by_cat b\nLEFT JOIN best t ON t.category = b.category AND t.n = 1\nORDER BY sales_2026 DESC;", 'The full report.'], ["SELECT STRFTIME('%Y', o.order_date) AS yr, ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status = 'delivered' GROUP BY yr;", 'The check: these totals should match the column sums above.']],
  practice: [{ task: 'Your turn: show each country with its number of customers and its delivered revenue (quantity * unit_price of delivered orders), highest revenue first. Countries with no delivered revenue can be left out.', answer: "SELECT c.country, COUNT(DISTINCT c.id), SUM(oi.quantity * oi.unit_price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id WHERE o.status = 'delivered' GROUP BY c.country ORDER BY revenue DESC", hint: 'customers → orders → order_items, WHERE status = delivered, GROUP BY country, COUNT(DISTINCT c.id), SUM(…)', ordered: true }],
  recap: ['Understand → map → build in steps → check → deliver.']
});
LESSONS.push({
  lv: 'p', id: 'next', t: 'What to do next',
  goal: 'Keep improving after the course.',
  story: 'You can ride the bike now. Time for longer rides.',
  words: [],
  body: '- **Practise daily** on real questions from your work.\n- **Rebuild** Question-builder reports in SQL, and compare with "See the SQL".\n- **Read other people\'s SQL** and ask the AI to explain anything new.\n- **Learn your database\'s extras**: PostgreSQL JSON and full-text search, SQL Server T-SQL, MySQL replication.\n- **Learn data modelling** further (star schemas for reporting, data warehouses).\n- **Pair SQL with a tool**: spreadsheets, Power BI, Tableau, Python (pandas) or R all speak SQL.\n- **Come back** to any lesson here; the practice copy resets whenever you like.',
  when: 'Now.',
  how: ['Pick one real question a week and answer it with SQL.', 'Write it tidy, save it, and explain it to someone else.'],
  app: [['Ask AI (top right): "explain this query" or "write a query that…".', 'home', null, '#aiBtn'], ['SQL editor: the full Function library.', 'sql']],
  recap: ['Practise on real questions, read others\' SQL, go deeper into your own database.']
});
