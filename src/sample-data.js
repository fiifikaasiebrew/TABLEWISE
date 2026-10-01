/*
 * Tablewise — sample-data.js
 * Author: Fiifi Kaasiebrew (https://github.com/fiifikaasiebrew)
 * Copyright (c) 2026 Fiifi Kaasiebrew. All rights reserved.
 */
/* Tablewise — builds the "Northwind Supply Co." practice database */
(function (root) {
  function buildSampleSQL() {
    let seed = 20260924;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const q = s => s === null ? 'NULL' : typeof s === 'number' ? String(s) : "'" + String(s).replace(/'/g, "''") + "'";
    const out = [];
    out.push(`
CREATE TABLE departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  budget NUMERIC(12,2),
  floor INTEGER
);
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  job_title TEXT,
  department_id INTEGER REFERENCES departments(id),
  hire_date DATE,
  salary NUMERIC(12,2),
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  segment TEXT,
  created_at DATE
);
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  unit_price NUMERIC(12,2) NOT NULL,
  units_in_stock INTEGER NOT NULL DEFAULT 0,
  discontinued INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  employee_id INTEGER REFERENCES employees(id),
  order_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  ship_city TEXT
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(4,2) NOT NULL DEFAULT 0
);`);
    const depts = [['Sales', 420000, 2], ['Operations', 380000, 1], ['Finance', 210000, 3], ['Human Resources', 150000, 3], ['Engineering', 610000, 4], ['Marketing', 260000, 2], ['Customer Support', 175000, 1], ['Legal', 140000, 5]];
    out.push('INSERT INTO departments (name,budget,floor) VALUES ' + depts.map(d => `(${q(d[0])},${d[1]},${d[2]})`).join(',') + ';');

    const firsts = ['Ama', 'Kofi', 'Akosua', 'Kwame', 'Efua', 'Yaw', 'Abena', 'Kojo', 'Adwoa', 'Kwabena', 'Maria', 'James', 'Priya', 'Chen', 'Sofia', 'Daniel', 'Aisha', 'Lucas', 'Grace', 'Omar', 'Hannah', 'Mateo', 'Zainab', 'Liam', 'Nana', 'Esi', 'David', 'Fatima', 'Samuel', 'Leila'];
    const lasts = ['Mensah', 'Owusu', 'Boateng', 'Asante', 'Osei', 'Addo', 'Quaye', 'Tetteh', 'Garcia', 'Smith', 'Patel', 'Wang', 'Rossi', 'Okafor', 'Haddad', 'Silva', 'Johnson', 'Nkrumah', 'Appiah', 'Darko', 'Kim', 'Novak', 'Ansah', 'Frimpong'];
    const titlesByDept = { 1: ['Sales Rep', 'Account Manager', 'Sales Lead'], 2: ['Warehouse Lead', 'Logistics Analyst', 'Ops Coordinator'], 3: ['Accountant', 'Financial Analyst'], 4: ['HR Partner', 'Recruiter'], 5: ['Software Engineer', 'Data Engineer', 'QA Engineer'], 6: ['Marketing Specialist', 'Designer'], 7: ['Support Agent', 'Support Lead'], 8: ['Counsel', 'Paralegal'] };
    const emps = [];
    const usedEmail = new Set();
    for (let i = 1; i <= 42; i++) {
      const f = pick(firsts), l = pick(lasts);
      let email = (f + '.' + l).toLowerCase() + '@northwind.example';
      let k = 2; while (usedEmail.has(email)) email = (f + '.' + l + k++).toLowerCase() + '@northwind.example';
      usedEmail.add(email);
      const d = i <= 12 ? 1 : int(1, 8);
      const y = int(2016, 2025), m = int(1, 12), day = int(1, 28);
      const sal = Math.round((38000 + rnd() * 70000 + (d === 5 ? 25000 : 0)) / 100) * 100;
      emps.push(`(${q(f)},${q(l)},${q(email)},${q(pick(titlesByDept[d]))},${d},'${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}',${sal},${rnd() < 0.92 ? 1 : 0})`);
    }
    out.push('INSERT INTO employees (first_name,last_name,email,job_title,department_id,hire_date,salary,is_active) VALUES ' + emps.join(',') + ';');

    const places = [['Accra', 'Ghana'], ['Kumasi', 'Ghana'], ['Takoradi', 'Ghana'], ['Tamale', 'Ghana'], ['Lagos', 'Nigeria'], ['Abuja', 'Nigeria'], ['Nairobi', 'Kenya'], ['Johannesburg', 'South Africa'], ['London', 'United Kingdom'], ['Manchester', 'United Kingdom'], ['Berlin', 'Germany'], ['Paris', 'France'], ['Toronto', 'Canada'], ['New York', 'United States'], ['Chicago', 'United States'], ['Austin', 'United States'], ['São Paulo', 'Brazil'], ['Dubai', 'United Arab Emirates'], ['Mumbai', 'India'], ['Singapore', 'Singapore']];
    const w1 = ['Golden', 'Blue', 'Summit', 'River', 'Coastal', 'Harbor', 'Evergreen', 'Northern', 'Sunrise', 'Pioneer', 'Atlas', 'Unity', 'Crown', 'Savanna', 'Metro', 'Bright', 'Keystone', 'Prime', 'Oak', 'Silverline'];
    const w2 = ['Traders', 'Foods', 'Retail', 'Logistics', 'Supplies', 'Market', 'Holdings', 'Stores', 'Distributors', 'Group', 'Wholesale', 'Enterprises'];
    const segs = ['Retail', 'Wholesale', 'Hospitality', 'Government', 'Education'];
    const custs = [];
    for (let i = 1; i <= 120; i++) {
      const [city, country] = pick(places);
      const cn = pick(firsts) + ' ' + pick(lasts);
      const comp = pick(w1) + ' ' + pick(w2) + (rnd() < .3 ? ' Ltd' : '');
      const y = int(2021, 2026), m = y === 2026 ? int(1, 8) : int(1, 12);
      const phone = '+' + int(1, 99) + ' ' + int(200, 999) + ' ' + int(1000, 9999); const seg = pick(segs);
      custs.push(`(${q(comp)},${q(cn)},${q(cn.toLowerCase().replace(' ', '.') + '@' + comp.split(' ')[0].toLowerCase() + '.example')},${i % 11 === 0 ? 'NULL' : q(phone)},${q(city)},${q(country)},${i % 17 === 0 ? 'NULL' : q(seg)},'${y}-${String(m).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}')`);
    }
    out.push('INSERT INTO customers (company_name,contact_name,email,phone,city,country,segment,created_at) VALUES ' + custs.join(',') + ';');

    const cats = [['Beverages', 'Coffee, tea, juices and water'], ['Pantry', 'Rice, oils, spices and canned goods'], ['Office Supplies', 'Paper, pens and desk items'], ['Cleaning', 'Detergents and cleaning tools'], ['Electronics', 'Small devices and accessories'], ['Snacks', 'Biscuits, nuts and chips']];
    out.push('INSERT INTO categories (name,description) VALUES ' + cats.map(c => `(${q(c[0])},${q(c[1])})`).join(',') + ';');
    const prodNames = {
      1: [['Ghana Arabica Coffee 1kg', 18.5], ['Green Tea 100 bags', 6.2], ['Mango Juice 1L', 2.9], ['Sparkling Water 12-pack', 7.4], ['Cocoa Drink Powder 500g', 5.8]],
      2: [['Jasmine Rice 25kg', 31], ['Palm Oil 5L', 14.75], ['Tomato Paste 24 tins', 12.3], ['Mixed Spice Jar', 3.1], ['Plantain Flour 2kg', 4.6]],
      3: [['A4 Paper 5 reams', 22], ['Ballpoint Pens 50-box', 9.9], ['Stapler Heavy Duty', 15.4], ['Sticky Notes 12-pack', 6.5], ['Filing Box', 4.2]],
      4: [['Dish Soap 5L', 8.8], ['Floor Cleaner 5L', 11.2], ['Microfibre Cloths 20', 7.5], ['Hand Sanitiser 1L', 5.4], ['Bin Bags 100', 6.1]],
      5: [['USB-C Charger 30W', 19.9], ['Wireless Mouse', 14.5], ['HDMI Cable 2m', 6.9], ['Power Bank 20000mAh', 29.5], ['Keyboard Wired', 17.25]],
      6: [['Plantain Chips 24-pack', 13.6], ['Roasted Peanuts 1kg', 7.2], ['Shortbread Biscuits Tin', 9.4], ['Coconut Chips 500g', 6.8]]
    };
    const prods = []; const prodPrice = [];
    let sku = 1000;
    for (const [cid, list] of Object.entries(prodNames)) for (const [n, p] of list) {
      prods.push(`(${q('NW-' + (sku++))},${q(n)},${cid},${p},${int(0, 400)},${rnd() < 0.07 ? 1 : 0})`);
      prodPrice.push(p);
    }
    out.push('INSERT INTO products (sku,name,category_id,unit_price,units_in_stock,discontinued) VALUES ' + prods.join(',') + ';');

    const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'shipped', 'pending', 'cancelled'];
    const orders = []; const items = [];
    for (let i = 1; i <= 420; i++) {
      const c = int(1, 120);
      const y = rnd() < .55 ? 2026 : 2025;
      const m = y === 2026 ? int(1, 9) : int(1, 12);
      const d = y === 2026 && m === 9 ? int(1, 23) : int(1, 28);
      const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let st = pick(statuses);
      if (y === 2026 && m === 9 && d > 18) st = rnd() < .6 ? 'pending' : 'shipped';
      const emp = int(1, 12);
      orders.push(`(${c},${i % 23 === 0 ? 'NULL' : emp},'${date}',${q(st)},${q(pick(places)[0])})`);
      const n = int(1, 4);
      const used = new Set();
      for (let j = 0; j < n; j++) {
        let p = int(1, prodPrice.length); while (used.has(p)) p = int(1, prodPrice.length); used.add(p);
        items.push(`(${i},${p},${int(1, 30)},${prodPrice[p - 1]},${pick([0, 0, 0, 0.05, 0.1])})`);
      }
    }
    out.push('INSERT INTO orders (customer_id,employee_id,order_date,status,ship_city) VALUES ' + orders.join(',') + ';');
    out.push('INSERT INTO order_items (order_id,product_id,quantity,unit_price,discount) VALUES ' + items.join(',') + ';');
    return out.join('\n');
  }
  root.TWSample = { buildSampleSQL, name: 'Northwind Supply Co. (practice data)' };
})(window);
