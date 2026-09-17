// server.js — نقطه‌ی ورود بک‌اند واقعی ایشِته
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { router: authRouter } = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const paymentRouter = require('./routes/payment');
const adminRouter = require('./routes/admin');
const botsRouter = require('./routes/bots');
const campaignsRouter = require('./routes/campaigns');

const app = express();
app.use(cors({ origin: true, credentials: false })); // برای تست محلی از روی فایل هم کار می‌کند
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'eshete-backend' }));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bots', botsRouter);
app.use('/api/campaigns', campaignsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای غیرمنتظره‌ی سرور.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✔ سرور ایشِته روی پورت ${PORT} اجرا شد → http://localhost:${PORT}/api/health`);
});
