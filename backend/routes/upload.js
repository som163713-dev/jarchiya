/**
 * آپلود ساده تصویر به‌صورت base64 در دیتابیس (بدون وابستگی multer)
 * برای لوگو/بنر در استودیو — محدودیت حجم ~1.5MB
 */
const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');
const crypto = require('crypto');

const router = express.Router();

db.exec(`
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  data_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

router.post('/', requireAuth, (req, res) => {
  const { dataUrl, mime } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return res.status(400).json({ error: 'فایل معتبر نیست (data URL لازم است).' });
  }
  if (dataUrl.length > 2_000_000) {
    return res.status(400).json({ error: 'حجم فایل زیاد است (حداکثر حدود ۱.۵ مگابایت).' });
  }
  const id = crypto.randomBytes(8).toString('hex');
  db.prepare(
    `INSERT INTO uploads (id, user_id, mime, data_url) VALUES (?, ?, ?, ?)`
  ).run(id, req.userId, mime || 'image/*', dataUrl);
  res.status(201).json({ id, url: `/api/upload/${id}` });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`SELECT data_url, mime FROM uploads WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'یافت نشد' });
  // redirect-style: return json with dataUrl for studio, or raw
  if (req.query.raw === '1') {
    const m = row.data_url.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return res.status(500).json({ error: 'فرمت نامعتبر' });
    res.setHeader('Content-Type', m[1]);
    return res.send(Buffer.from(m[2], 'base64'));
  }
  res.json({ id: req.params.id, dataUrl: row.data_url, mime: row.mime });
});

module.exports = router;
