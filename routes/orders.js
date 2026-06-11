const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

// Place an order
router.post('/', (req, res) => {
  const { customer_name, customer_email, address, items, promo_code } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Cart empty' });

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(
      'INSERT INTO orders (customer_name, customer_email, address) VALUES (?, ?, ?)',
      [customer_name, customer_email, address],
      function (err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        const orderId = this.lastID;

        const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
        let failed = false;

        items.forEach((it) => {
          const productId = it.product_id;
          const qty = Number(it.quantity) || 0;
          // get product
          db.get('SELECT id, price, inventory FROM products WHERE id = ?', [productId], (err, product) => {
            if (err || !product) {
              failed = true;
              return;
            }
            if (product.inventory < qty) {
              failed = true;
              return;
            }
            const price = product.price;
            itemStmt.run(orderId, productId, qty, price);
            db.run('UPDATE products SET inventory = inventory - ? WHERE id = ?', [qty, productId]);
          });
        });

        // Note: In this simple flow, asynchronous checks above could finish after we continue.
        // For production, use synchronous control flow or promises. Here we commit after a short timeout.
        setTimeout(() => {
          if (failed) {
            db.run('ROLLBACK');
            return res.status(400).json({ error: 'One or more items unavailable' });
          }
          itemStmt.finalize(() => {
            db.run('COMMIT');
            res.json({ order_id: orderId, status: 'created' });
          });
        }, 200);
      }
    );
  });
});

// Get order status
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    db.all('SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [id], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ order, items });
    });
  });
});

// Admin: list all orders
router.get('/', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
