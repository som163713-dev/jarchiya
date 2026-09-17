// server.js — نقطه‌ی ورود بک‌اند واقعی ایشِته
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { router: authRouter } = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');
const botsRouter = require('./routes/bots');
const campaignsRouter = require('./routes/campaigns');

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

// مسیر فایل‌های فرانت‌اند (یک پوشه بالاتر از backend)
const frontendPath = path.join(__dirname, '../frontend');

// سرو کردن فایل‌های استاتیک فرانت‌اند
app.use(express.static(frontendPath));

// صفحه اصلی → لندینگ
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, '1-jarchiya-landing.html'));
});

// مسیرهای کوتاه برای بقیه صفحات
app.get('/generator', (req, res) => {
  res.sendFile(path.join(frontendPath, '2-generator-mvp.html'));
});
app.get('/studio', (req, res) => {
  res.sendFile(path.join(frontendPath, '3-studio.html'));
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, '4-user-dashboard.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(frontendPath, '5-admin-panel.html'));
});
app.get('/pricing', (req, res) => {
  res.sendFile(path.join(frontendPath, '6-pricing.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, '7-auth-login.html'));
});
app.get('/bots', (req, res) => {
  res.sendFile(path.join(frontendPath, '8-bots-studio.html'));
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'eshete-backend' }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bots', botsRouter);
app.use('/api/campaigns', campaignsRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای غیرمنتظره‌ی سرور.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ سرور ایشِته روی پورت ${PORT} اجرا شد → http://localhost:${PORT}/api/health`);
});
