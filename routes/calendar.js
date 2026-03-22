const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    let result;
    if (month && year) {
      result = await pool.query(
        `SELECT * FROM calendar_events
         WHERE EXTRACT(MONTH FROM event_date) = $1 AND EXTRACT(YEAR FROM event_date) = $2
         ORDER BY event_date ASC`,
        [month, year]
      );
    } else {
      result = await pool.query('SELECT * FROM calendar_events ORDER BY event_date ASC');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { event_date, event_title, word_assignee, prayer_assignee, emcee_assignee, notes } = req.body;
    if (!event_date || !event_title)
      return res.status(400).json({ error: 'event_date and event_title are required' });
    const result = await pool.query(
      `INSERT INTO calendar_events (event_date, event_title, word_assignee, prayer_assignee, emcee_assignee, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_date, event_title, word_assignee || null, prayer_assignee || null, emcee_assignee || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { event_date, event_title, word_assignee, prayer_assignee, emcee_assignee, notes } = req.body;
    const result = await pool.query(
      `UPDATE calendar_events
       SET event_date=$1, event_title=$2, word_assignee=$3, prayer_assignee=$4, emcee_assignee=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [event_date, event_title, word_assignee || null, prayer_assignee || null, emcee_assignee || null, notes || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM calendar_events WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
