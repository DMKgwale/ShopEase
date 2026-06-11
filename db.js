const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './data.db';

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    inventory INTEGER NOT NULL DEFAULT 0
  )`);

  db.run(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_email TEXT,
    address TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    discount_percent INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )`);

  const stmt = db.prepare("INSERT INTO products (name, description, price, inventory) VALUES (?, ?, ?, ?)");
  stmt.run('Red Sneakers', 'Comfortable red sneakers', 59.99, 20);
  stmt.run('Blue Jeans', 'Classic blue denim jeans', 39.5, 50);
  stmt.run('White T-Shirt', '100% cotton tee', 14.99, 100);
  stmt.run('Wireless Headphones', 'Noise-cancelling over-ear', 129.99, 15);
  stmt.finalize();

  db.run("INSERT INTO promotions (code, discount_percent, active) VALUES ('SUMMER10', 10, 1)");

  console.log('Database initialized and seeded.');
});

db.close();
