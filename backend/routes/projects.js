// routes/projects.js — ذخیره‌سازی واقعی برنامک‌های ساخته‌شده‌ی هر کاربر
const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

// ---------- لیست پروژه‌های کاربر لاگین‌شده ----------
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, category, theme, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC')
    .all(req.userId);
  res.json({ projects: rows });
});

// ---------- ساخت پروژه‌ی جدید ----------
router.post('/', (req, res) => {
  const { name, category, theme, blocks } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'نام و دسته‌بندی الزامی است.' });
  }

  // محدودیت تعداد پروژه بر اساس پلن کاربر (واقعی، نه نمایشی)
  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.userId);
  const limits = { free: 1, pro: 3, enterprise: Infinity };
  const count = db.prepare('SELECT COUNT(*) AS c FROM projects WHERE user_id = ?').get(req.userId).c;
  const limit = limits[user.plan] ?? 1;
  if (count >= limit) {
    return res.status(403).json({ error: `پلن «${user.plan}» شما اجازه‌ی بیش از ${limit} برنامک را نمی‌دهد. ارتقا بده.` });
  }

  const info = db
    .prepare('INSERT INTO projects (user_id, name, category, theme, blocks_json) VALUES (?, ?, ?, ?, ?)')
    .run(req.userId, name, category, theme || 'violet', JSON.stringify(blocks || []));

  res.status(201).json({ id: info.lastInsertRowid });
});

// ---------- دریافت یک پروژه ----------
router.get('/:id', (req, res) => {
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!project) return res.status(404).json({ error: 'پروژه یافت نشد.' });
  project.blocks = JSON.parse(project.blocks_json);
  delete project.blocks_json;
  res.json({ project });
});

// ---------- ویرایش پروژه ----------
router.put('/:id', (req, res) => {
  const { name, theme, blocks } = req.body;
  const project = db
    .prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!project) return res.status(404).json({ error: 'پروژه یافت نشد.' });

  db.prepare(
    `UPDATE projects SET name = COALESCE(?, name), theme = COALESCE(?, theme),
     blocks_json = COALESCE(?, blocks_json), updated_at = datetime('now') WHERE id = ?`
  ).run(name, theme, blocks ? JSON.stringify(blocks) : null, req.params.id);

  res.json({ ok: true });
});

// ---------- حذف پروژه ----------
router.delete('/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  if (result.changes === 0) return res.status(404).json({ error: 'پروژه یافت نشد.' });
  res.json({ ok: true });
});

module.exports = router;
