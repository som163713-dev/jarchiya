// routes/auth.js — احراز هویت واقعی: ثبت‌نام، ورود، و توکن JWT
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-.env-file';

// اعتبارسنجی ساده‌ی شماره موبایل ایران
function isValidIranPhone(phone) {
  return /^09\d{9}$/.test(phone);
}

// ---------- ثبت‌نام ----------
router.post('/signup', (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'نام، شماره موبایل و رمز عبور الزامی است.' });
  }
  if (!isValidIranPhone(phone)) {
    return res.status(400).json({ error: 'شماره موبایل معتبر نیست.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت‌نام کرده است.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  // اگر شماره‌ی این کاربر در فهرست مدیران (ADMIN_PHONES در .env) باشد، نقش او مدیر می‌شود
  const adminPhones = (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim()).filter(Boolean);
  const role = adminPhones.includes(phone) ? 'admin' : 'user';

  const info = db
    .prepare('INSERT INTO users (name, phone, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, phone, passwordHash, role);

  const token = jwt.sign({ userId: info.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({
    token,
    user: { id: info.lastInsertRowid, name, phone, plan: 'free', role },
  });
});

// ---------- ورود ----------
router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'شماره موبایل و رمز عبور الزامی است.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'شماره موبایل یا رمز عبور اشتباه است.' });
  }
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'حساب شما توسط مدیر سامانه معلق شده است.' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, phone: user.phone, plan: user.plan, role: user.role },
  });
});

// ---------- میان‌افزار احراز هویت (برای مسیرهای محافظت‌شده) ----------
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'ورود لازم است.' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'نشست شما منقضی شده، دوباره وارد شوید.' });
  }
}

// ---------- دریافت پروفایل کاربر لاگین‌شده ----------
router.get('/me', requireAuth, (req, res) => {
  const user = db
    .prepare('SELECT id, name, phone, plan, role, status, created_at FROM users WHERE id = ?')
    .get(req.userId);
  if (!user) return res.status(404).json({ error: 'کاربر یافت نشد.' });
  res.json({ user });
});

// ---------- میان‌افزار مخصوص مسیرهای مدیر ----------
function requireAdmin(req, res, next) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'این بخش فقط برای مدیر سامانه است.' });
  }
  next();
}

module.exports = { router, requireAuth, requireAdmin };
