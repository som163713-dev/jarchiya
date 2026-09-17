/**
 * جارچیا — هسته ماژولار
 * ماژول‌ها: pages | jarchiya-api | asha-gateway
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { mountJarchiyaPages } = require('./modules/pages');
const { mountJarchiyaApi } = require('./modules/jarchiya-api');
const { mountAshaGateway } = require('./modules/asha-gateway');

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '2mb' }));

const frontendPath = path.join(__dirname, '../frontend');

// 1) API هسته جارچیا
mountJarchiyaApi(app);

// 2) دروازه آشا (استاتیک + پروکسی) — قبل از صفحه /admin جارچیا برای static؛
//    پروکسی /admin بعد از تعریف صفحه /admin ثبت می‌شود
const asha = mountAshaGateway(app, { frontendRoot: frontendPath });

// 3) صفحات جارچیا (شامل GET /admin)
mountJarchiyaPages(app, frontendPath);

// 4) پروکسی API ادمین آشا (/admin/login و ...) بعد از صفحه HTML
if (asha && typeof asha.mountAdminProxy === 'function') {
  asha.mountAdminProxy(app);
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'خطای غیرمنتظره‌ی سرور.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ جارچیا ماژولار روی پورت ${PORT}`);
  console.log(`   health → http://localhost:${PORT}/api/health`);
  console.log(`   آشا UI → http://localhost:${PORT}/ai`);
});
