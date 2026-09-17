// routes/admin.js — مسیرهای واقعی پنل مدیر: آمار کلی، مدیریت کاربران، هدیه‌ی پلن
const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('./auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ---------- نمای کلی سامانه (اعداد واقعی از دیتابیس) ----------
router.get('/overview', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalProjects = db.prepare('SELECT COUNT(*) AS c FROM projects').get().c;
  const revenue = db
    .prepare("SELECT COALESCE(SUM(amount_toman),0) AS s FROM payments WHERE status = 'paid'")
    .get().s;
  const paidCount = db.prepare("SELECT COUNT(*) AS c FROM payments WHERE status = 'paid'").get().c;

  res.json({ totalUsers, totalProjects, revenueToman: revenue, paidCount });
});

// ---------- لیست همه‌ی کاربران با تعداد برنامک هرکدام ----------
router.get('/users', (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.phone, u.plan, u.role, u.status, u.created_at,
              (SELECT COUNT(*) FROM projects p WHERE p.user_id = u.id) AS project_count
       FROM users u ORDER BY u.created_at DESC`
    )
    .all();
  res.json({ users: rows });
});

// ---------- هدیه دادن یا تغییر پلن یک کاربر ----------
router.post('/users/:id/plan', (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro', 'enterprise'].includes(plan)) {
    return res.status(400).json({ error: 'پلن نامعتبر است.' });
  }
  const result = db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ ok: true });
});

// ---------- تعلیق یا فعال‌سازی کاربر ----------
router.post('/users/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'وضعیت نامعتبر است.' });
  }
  const result = db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ ok: true });
});

module.exports = router;
