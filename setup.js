// setup.js
const fs = require('fs');
const path = require('path');

console.log('🚀 در حال ساخت ساختار پروژه جارچیا...\n');

// ساخت پوشه‌ها
const dirs = [
  'frontend/css',
  'backend/routes',
  'backend/services',
  'backend/uploads',
  'backend/public/sites'
];

dirs.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📁 پوشه ساخته شد: ${dir}`);
});

// ساخت فایل‌های پیکربندی
const configFiles = {
  'backend/package.json': `{
  "name": "jarchiya-backend",
  "version": "2.1.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "better-sqlite3": "^11.3.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "node-fetch": "^2.7.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.4.0",
    "morgan": "^1.10.0",
    "zod": "^3.23.8",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.4",
    "compression": "^1.7.4"
  }
}`,
  'backend/.env': `PORT=3000
NODE_ENV=production
PUBLIC_URL=https://your-frontend-domain.com
JWT_ACCESS_SECRET=change-me-to-a-strong-random-string
JWT_REFRESH_SECRET=change-me-to-another-strong-string
ADMIN_PHONES=09123456789
ALLOWED_ORIGINS=*
ANTHROPIC_API_KEY=sk-ant-your-key-here
ZARINPAL_MERCHANT_ID=your-zarinpal-merchant-id
ZARINPAL_SANDBOX=true
DATABASE_PATH=/data/jarchiya.db
UPLOAD_DIR=/data/uploads`,
  '.gitignore': `node_modules/
.env
backend/jarchiya.db
backend/uploads/*
!backend/uploads/.gitkeep
backend/public/sites/*
!backend/public/sites/.gitkeep
.DS_Store`
};

Object.entries(configFiles).forEach(([filePath, content]) => {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`📄 فایل ساخته شد: ${filePath}`);
});

// ساخت فایل‌های خالی برای کپی کردن کدها
const emptyFiles = [
  'backend/server.js',
  'backend/db.js',
  'backend/routes/auth.js',
  'backend/routes/projects.js',
  'backend/routes/bots.js',
  'backend/routes/templates.js',
  'backend/routes/payment.js',
  'backend/routes/admin.js',
  'backend/routes/upload.js',
  'backend/routes/publish.js',
  'frontend/index.html',
  'frontend/login.html',
  'frontend/dashboard.html',
  'frontend/studio.html',
  'frontend/bots.html',
  'frontend/templates.html',
  'frontend/pricing.html',
  'frontend/css/style.css'
];

emptyFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '', 'utf-8');
  }
});

// ساخت فایل‌های .gitkeep برای پوشه‌های خالی
fs.writeFileSync('backend/uploads/.gitkeep', '', 'utf-8');
fs.writeFileSync('backend/public/sites/.gitkeep', '', 'utf-8');

console.log('\n✅ ساختار پروژه با موفقیت ساخته شد!');
console.log('👉 حالا کدهای ارسالی در چت‌های قبلی را در فایل‌های مربوطه کپی کنید.');
console.log('👉 سپس در پوشه backend دستور npm install را اجرا کنید.');