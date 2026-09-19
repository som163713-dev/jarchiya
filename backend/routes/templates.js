/**
 * قالب‌های استاندارد جارچیا
 * ۵ دنیای بصری انتزاعی — قابل بارگذاری در استودیو
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

// جدول قالب‌ها
db.exec(`
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'violet',
  description TEXT,
  preview_gradient TEXT,
  pages_json TEXT NOT NULL DEFAULT '{}',
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

/** بلوک‌های آماده برای هر قالب (ساختار سازگار با استودیو) */
function makePages(brand, themeHint, lines) {
  let id = 100;
  const nid = () => ++id;
  return {
    home: {
      blocks: [
        { id: nid(), type: 'header', title: brand, subtitle: lines.tagline },
        { id: nid(), type: 'hero', title: lines.hero, subtitle: lines.heroSub, cta: lines.cta },
        { id: nid(), type: 'grid', title: lines.grid },
        { id: nid(), type: 'cta', title: lines.ctaBlock, cta: lines.cta },
        { id: nid(), type: 'footer', title: `© ${brand}` },
      ],
    },
    about: {
      blocks: [
        { id: nid(), type: 'header', title: 'درباره ما', subtitle: brand },
        { id: nid(), type: 'list', title: lines.about },
        { id: nid(), type: 'footer', title: `© ${brand}` },
      ],
    },
    contact: {
      blocks: [
        { id: nid(), type: 'header', title: 'تماس', subtitle: brand },
        { id: nid(), type: 'list', title: 'راه‌های ارتباطی' },
        { id: nid(), type: 'footer', title: `© ${brand}` },
      ],
    },
  };
}

const SEED = [
  {
    id: 'violet-dream',
    name: 'رویای بنفش',
    name_en: 'Violet Dream',
    category: 'brand',
    theme: 'violet',
    description: 'فضای شب‌رنگ با هاله‌ی بنفش — مناسب برند شخصی و خدمات خلاق',
    preview_gradient: 'linear-gradient(135deg,#1a1035,#8B7CFF 50%,#FF7CC0)',
    pages: makePages('برند نوآ', 'violet', {
      tagline: 'دنیایی برای رشد ایده',
      hero: 'از ایده تا حضور دیجیتال',
      heroSub: 'یک برنامک آماده با هویت بصری رویایی',
      cta: 'شروع کن',
      grid: 'خدمات اصلی',
      ctaBlock: 'اولین قدم را همین امروز بردار',
      about: 'چرا این برند؟',
    }),
  },
  {
    id: 'ocean-neon',
    name: 'اقیانوس نئون',
    name_en: 'Ocean Neon',
    category: 'shop',
    theme: 'ocean',
    description: 'آبی‌سبز نئونی — مناسب فروشگاه و کاتالوگ محصول',
    preview_gradient: 'linear-gradient(135deg,#041820,#35E6C6 45%,#4C8DFF)',
    pages: makePages('فروشگاه موج', 'ocean', {
      tagline: 'کالکشن تازه رسید',
      hero: 'محصولات منتخب این فصل',
      heroSub: 'ارسال سریع · ضمانت اصالت',
      cta: 'مشاهده محصولات',
      grid: 'پرفروش‌ها',
      ctaBlock: 'با کد WELCOME۱۰٪ تخفیف بگیر',
      about: 'داستان فروشگاه',
    }),
  },
  {
    id: 'coral-dusk',
    name: 'غروب مرجانی',
    name_en: 'Coral Dusk',
    category: 'cafe',
    theme: 'mars',
    description: 'نارنجی و صورتی گرم — مناسب کافه، رستوران و رویداد',
    preview_gradient: 'linear-gradient(135deg,#2a1010,#FF7A45 40%,#FF4CA0)',
    pages: makePages('کافه شفق', 'mars', {
      tagline: 'طعم و فضا',
      hero: 'رزرو میز و منوی روز',
      heroSub: 'صبح تا نیمه‌شب بازیم',
      cta: 'رزرو میز',
      grid: 'منوی ویژه',
      ctaBlock: 'اولین قهوه مهمان ما باش',
      about: 'درباره کافه',
    }),
  },
  {
    id: 'digital-forest',
    name: 'جنگل دیجیتال',
    name_en: 'Digital Forest',
    category: 'education',
    theme: 'forest',
    description: 'سبز و فیروزه‌ای — مناسب آموزش، دوره و محتوای تخصصی',
    preview_gradient: 'linear-gradient(135deg,#0a1a12,#3ADC8F 45%,#2FB6C9)',
    pages: makePages('آکادمی ریشه', 'forest', {
      tagline: 'یادگیری عمیق',
      hero: 'دوره‌های کاربردی، قدم‌به‌قدم',
      heroSub: 'از صفر تا پروژه‌ی واقعی',
      cta: 'مشاهده دوره‌ها',
      grid: 'مسیرهای یادگیری',
      ctaBlock: 'جلسه معارفه رایگان',
      about: 'روش آموزش ما',
    }),
  },
  {
    id: 'gold-mist',
    name: 'مه طلایی',
    name_en: 'Gold Mist',
    category: 'premium',
    theme: 'gold',
    description: 'طلایی و بنفش لوکس — مناسب خدمات ویژه و مشاوره',
    preview_gradient: 'linear-gradient(135deg,#1a1408,#F2C94C 40%,#C77DFF)',
    pages: makePages('استودیو زرین', 'gold', {
      tagline: 'خدمات ممتاز',
      hero: 'همراهی حرفه‌ای برای کسب‌وکار تو',
      heroSub: 'طراحی · استراتژی · اجرا',
      cta: 'درخواست مشاوره',
      grid: 'بسته‌های همکاری',
      ctaBlock: 'نوبت مشاوره رایگان این هفته',
      about: 'تیم و رویکرد',
    }),
  },
];

// Seed اگر خالی بود
const count = db.prepare('SELECT COUNT(*) AS c FROM templates').get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO templates (id, name, name_en, category, theme, description, preview_gradient, pages_json)
    VALUES (@id, @name, @name_en, @category, @theme, @description, @preview_gradient, @pages_json)
  `);
  const tx = db.transaction((rows) => {
    for (const t of rows) {
      insert.run({
        id: t.id,
        name: t.name,
        name_en: t.name_en,
        category: t.category,
        theme: t.theme,
        description: t.description,
        preview_gradient: t.preview_gradient,
        pages_json: JSON.stringify(t.pages),
      });
    }
  });
  tx(SEED);
  console.log('✔ ۵ قالب استاندارد جارچیا در دیتابیس ثبت شد');
}

// ---------- لیست قالب‌های عمومی ----------
router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, name_en, category, theme, description, preview_gradient
       FROM templates WHERE is_public = 1 ORDER BY name`
    )
    .all();
  res.json({ templates: rows, count: rows.length });
});

// ---------- یک قالب کامل (با صفحات و بلوک‌ها) ----------
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM templates WHERE id = ? AND is_public = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'قالب یافت نشد.' });
  let pages;
  try {
    pages = JSON.parse(row.pages_json);
  } catch {
    pages = {};
  }
  res.json({
    template: {
      id: row.id,
      name: row.name,
      name_en: row.name_en,
      category: row.category,
      theme: row.theme,
      description: row.description,
      preview_gradient: row.preview_gradient,
      pages,
    },
  });
});

module.exports = router;
