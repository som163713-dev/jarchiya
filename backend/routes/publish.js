/**
 * انتشار برنامک — واقعی
 * HTML ساخته می‌شود، در دیتابیس می‌ماند، با لینک /p/:slug در دسترس است
 */
const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');
const crypto = require('crypto');

const router = express.Router();

db.exec(`
CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'violet',
  html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function slugify() {
  return 'app-' + crypto.randomBytes(6).toString('hex');
}

function buildHTML({ title, theme, pages }) {
  const themeColors = {
    violet: { a: '#7C5CFF', b: '#FF5CAA' },
    ocean: { a: '#35E6C6', b: '#4C8DFF' },
    mars: { a: '#FF7A45', b: '#FF4CA0' },
    forest: { a: '#3ADC8F', b: '#2FB6C9' },
    gold: { a: '#F2C94C', b: '#C77DFF' },
    ice: { a: '#8FD1FF', b: '#C4A8FF' },
  };
  const c = themeColors[theme] || themeColors.violet;
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const pageList = pages && typeof pages === 'object' ? pages : { home: { blocks: [] } };
  let body = '';
  for (const [pid, page] of Object.entries(pageList)) {
    const blocks = (page && page.blocks) || [];
    body += `<section data-page="${esc(pid)}" class="page">`;
    for (const b of blocks) {
      const t = esc(b.title);
      const sub = esc(b.subtitle);
      const cta = esc(b.cta);
      switch (b.type) {
        case 'header':
          body += `<div class="blk blk-header"><div class="ic">◆</div><div><b>${t}</b><div class="muted">${sub}</div></div></div>`;
          break;
        case 'hero':
          body += `<div class="blk blk-hero"><h2>${t}</h2><p>${sub}</p>${cta ? `<span class="cta">${cta}</span>` : ''}</div>`;
          break;
        case 'grid':
          body += `<div class="blk"><h3>${t || 'گالری'}</h3><div class="blk-grid"><div class="card">مورد ۱</div><div class="card">مورد ۲</div><div class="card">مورد ۳</div><div class="card">مورد ۴</div></div></div>`;
          break;
        case 'cta':
          body += `<div class="blk blk-cta"><h3>${t}</h3>${cta ? `<span class="cta">${cta}</span>` : ''}</div>`;
          break;
        case 'list':
          body += `<div class="blk"><h3>${t}</h3><div class="row"><span class="dot"></span><span>مورد نمونه</span></div></div>`;
          break;
        case 'pricing':
          body += `<div class="blk"><h3>${t || 'پلن‌ها'}</h3><div class="blk-pricing"><div class="plan">پایه</div><div class="plan hi">ویژه</div></div></div>`;
          break;
        case 'footer':
          body += `<div class="blk blk-footer">${t}</div>`;
          break;
        default:
          body += `<div class="blk"><b>${t}</b><p class="muted">${sub}</p></div>`;
      }
    }
    body += `</section>`;
  }

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{--r-a:${c.a};--r-b:${c.b}}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Vazirmatn,sans-serif;background:#0F0F1A;color:#F2F1FA;line-height:1.7}
.blk{padding:16px;border-bottom:1px solid rgba(255,255,255,.06)}
.blk-header{display:flex;align-items:center;gap:10px;padding:20px 16px}
.ic{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--r-a),var(--r-b));display:flex;align-items:center;justify-content:center}
.blk-hero{text-align:center;padding:28px 18px}
.blk-hero h2{font-size:22px;margin-bottom:8px;background:linear-gradient(135deg,var(--r-a),var(--r-b));-webkit-background-clip:text;background-clip:text;color:transparent}
.muted{color:#9092AC;font-size:13px}
.cta{display:inline-block;margin-top:10px;padding:10px 22px;border-radius:10px;font-weight:700;background:linear-gradient(135deg,var(--r-a),var(--r-b));color:#0B0B14}
.blk-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px;font-size:12px}
.blk-pricing{display:flex;gap:9px;margin-top:10px}
.plan{flex:1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;text-align:center}
.plan.hi{border-color:var(--r-a)}
.blk-cta{text-align:center;padding:28px 18px}
.blk-footer{text-align:center;font-size:12px;color:#9092AC;padding:20px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--r-a);display:inline-block;margin-left:8px}
.row{display:flex;align-items:flex-start;gap:8px;padding:6px 0}
</style>
</head>
<body>${body}</body>
</html>`;
}

router.post('/', requireAuth, (req, res) => {
  const { title, theme, pages, projectId } = req.body || {};
  if (!title || !pages) {
    return res.status(400).json({ error: 'عنوان و محتوای صفحات الزامی است.' });
  }
  const html = buildHTML({ title, theme: theme || 'violet', pages });
  const slug = slugify();
  const info = db
    .prepare(
      `INSERT INTO publications (user_id, project_id, slug, title, theme, html)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, projectId || null, slug, title, theme || 'violet', html);

  res.status(201).json({
    id: info.lastInsertRowid,
    slug,
    url: `/p/${slug}`,
    message: 'برنامک منتشر شد و لینک پایدار گرفت.',
  });
});

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, slug, title, theme, status, created_at FROM publications
       WHERE user_id = ? ORDER BY created_at DESC`
    )
    .all(req.userId);
  res.json({
    publications: rows.map((r) => ({ ...r, url: `/p/${r.slug}` })),
  });
});

function mountPublicPages(app) {
  app.get('/p/:slug', (req, res) => {
    const row = db.prepare(`SELECT html, status FROM publications WHERE slug = ?`).get(req.params.slug);
    if (!row || row.status !== 'live') {
      return res.status(404).send('این برنامک پیدا نشد یا غیرفعال است.');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(row.html);
  });
}

router.mountPublicPages = mountPublicPages;
module.exports = router;
