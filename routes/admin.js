const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');

// Update inventory for a product
router.put('/inventory/:productId', (req, res) => {
  const id = req.params.productId;
  const { inventory } = req.body;
  db.run('UPDATE products SET inventory = ? WHERE id = ?', [inventory, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

// Create promotion
router.post('/promotion', (req, res) => {
  const { code, discount_percent } = req.body;
  db.run('INSERT INTO promotions (code, discount_percent, active) VALUES (?, ?, 1)', [code, discount_percent], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// List promotions
router.get('/promotions', (req, res) => {
  db.all('SELECT * FROM promotions', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
