const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// --- ALBUMS ---

router.get('/albums', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, COUNT(p.id)::int AS photo_count
      FROM albums a
      LEFT JOIN photos p ON p.album_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/albums', async (req, res) => {
  try {
    const { name, description, created_by } = req.body;
    if (!name) return res.status(400).json({ error: 'Album name is required' });
    const result = await pool.query(
      'INSERT INTO albums (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), description || null, created_by?.trim() || 'Anonymous']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/albums/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM albums WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PHOTOS ---

router.get('/albums/:albumId/photos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY created_at DESC',
      [req.params.albumId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/albums/:albumId/photos', async (req, res) => {
  try {
    const { photo_url, caption, uploaded_by } = req.body;
    if (!photo_url) return res.status(400).json({ error: 'photo_url is required' });

    const result = await pool.query(
      'INSERT INTO photos (album_id, photo_url, caption, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.albumId, photo_url, caption || null, uploaded_by?.trim() || 'Anonymous']
    );

    // Set as album cover if it's the first photo
    await pool.query(
      'UPDATE albums SET cover_url = $1 WHERE id = $2 AND cover_url IS NULL',
      [photo_url, req.params.albumId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/albums/:albumId/photos/:photoId', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM photos WHERE id = $1 AND album_id = $2', [
      req.params.photoId,
      req.params.albumId,
    ]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
