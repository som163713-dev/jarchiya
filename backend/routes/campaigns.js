// routes/campaigns.js — کمپین‌های واقعی قرعه‌کشی و مسابقه، ذخیره‌شده در دیتابیس
const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// ---------- لیست کمپین‌های کاربر ----------
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.userId);
  res.json({ campaigns: rows });
});

// ---------- ساخت کمپین جدید ----------
router.post('/', (req, res) => {
  const { title, type, prize, entry_condition, goal, ends_at } = req.body;
  if (!title) return res.status(400).json({ error: 'عنوان کمپین الزامی است.' });
  if (!['lottery', 'contest'].includes(type || 'lottery')) {
    return res.status(400).json({ error: 'نوع کمپین باید lottery یا contest باشد.' });
  }

  const info = db
    .prepare(
      `INSERT INTO campaigns (user_id, title, type, prize, entry_condition, goal, ends_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, title, type || 'lottery', prize || '', entry_condition || '', goal || 100, ends_at || null);

  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------- افزایش پیشرفت (مثلاً وقتی یک نفر شرکت می‌کند) ----------
router.post('/:id/progress', (req, res) => {
  const campaign = db
    .prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!campaign) return res.status(404).json({ error: 'کمپین یافت نشد.' });

  const newProgress = Math.min(campaign.goal, campaign.progress + 1);
  db.prepare('UPDATE campaigns SET progress = ? WHERE id = ?').run(newProgress, campaign.id);
  res.json({ progress: newProgress, goal: campaign.goal });
});

// ---------- پایان دادن به کمپین ----------
router.post('/:id/close', (req, res) => {
  const result = db
    .prepare("UPDATE campaigns SET status = 'closed' WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'کمپین یافت نشد.' });
  res.json({ ok: true });
});

// ---------- حذف کمپین ----------
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM campaigns WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'کمپین یافت نشد.' });
  res.json({ ok: true });
});

module.exports = router;
