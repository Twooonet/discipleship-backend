const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM offerings ORDER BY entry_date DESC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='offering' THEN amount ELSE 0 END), 0) AS total_offerings,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type='offering' THEN amount ELSE -amount END), 0) AS balance
      FROM offerings
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { entry_date, amount, description, type } = req.body;
    if (!entry_date || !amount || !type)
      return res.status(400).json({ error: 'entry_date, amount, and type are required' });
    if (!['offering', 'expense'].includes(type))
      return res.status(400).json({ error: 'type must be offering or expense' });
    const result = await pool.query(
      'INSERT INTO offerings (entry_date, amount, description, type) VALUES ($1, $2, $3, $4) RETURNING *',
      [entry_date, parseFloat(amount), description || null, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM offerings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
