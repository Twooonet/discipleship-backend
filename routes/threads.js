const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, COUNT(r.id)::int AS reply_count
       FROM threads t
       LEFT JOIN thread_replies r ON t.id = r.thread_id
       GROUP BY t.id
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { author_name, title, content } = req.body;
    if (!author_name || !title || !content)
      return res.status(400).json({ error: 'author_name, title, and content are required' });
    const result = await pool.query(
      'INSERT INTO threads (author_name, title, content) VALUES ($1, $2, $3) RETURNING *',
      [author_name.trim(), title.trim(), content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const thread = await pool.query('SELECT * FROM threads WHERE id = $1', [req.params.id]);
    if (!thread.rows.length) return res.status(404).json({ error: 'Thread not found' });
    const replies = await pool.query(
      'SELECT * FROM thread_replies WHERE thread_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ ...thread.rows[0], replies: replies.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/replies', async (req, res) => {
  try {
    const { author_name, content } = req.body;
    if (!author_name || !content)
      return res.status(400).json({ error: 'author_name and content are required' });
    const result = await pool.query(
      'INSERT INTO thread_replies (thread_id, author_name, content) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, author_name.trim(), content.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM threads WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/replies/:replyId', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM thread_replies WHERE id = $1 AND thread_id = $2', [
      req.params.replyId,
      req.params.id,
    ]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
