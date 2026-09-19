/**
 * قالب‌های استاندارد جارچیا — هر قالب حداقل ۱۰ صفحه کامل
 */
const express = require('express');
const db = require('../db');
const router = express.Router();

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

let _id = 1000;
const nid = () => ++_id;

function blk(type, fields) {
  return { id: nid(), type, ...fields };
}

/** ساخت ۱۰ صفحه استاندارد برای یک برند */
function buildTenPages(brand, lines) {
  return {
    home: {
      name: 'خانه',
      blocks: [
        blk('header', { title: brand, subtitle: lines.tagline }),
        blk('hero', { title: lines.hero, subtitle: lines.heroSub, cta: lines.cta }),
        blk('grid', { title: lines.grid }),
        blk('counter', { title: lines.stats || 'آمار و اعتماد' }),
        blk('testimonial', { title: 'نظر مشتریان', subtitle: lines.testimonial || 'خدمات عالی و پشتیبانی سریع' }),
        blk('cta', { title: lines.ctaBlock, cta: lines.cta }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    shop: {
      name: 'فروشگاه / خدمات',
      blocks: [
        blk('header', { title: 'فهرست خدمات و محصولات', subtitle: brand }),
        blk('hero', { title: lines.shopHero || 'همه آنچه نیاز دارید', subtitle: lines.shopSub || 'دسته‌بندی‌های منتخب', cta: 'مشاهده همه' }),
        blk('grid', { title: 'دسته‌بندی‌ها' }),
        blk('pricing', { title: 'پلن‌ها و قیمت‌ها' }),
        blk('cta', { title: 'سوال دارید؟ با ما در تماس باشید', cta: 'تماس' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    product: {
      name: 'نمونه محصول',
      blocks: [
        blk('header', { title: lines.productTitle || 'محصول ویژه', subtitle: 'جزئیات' }),
        blk('hero', { title: lines.productTitle || 'محصول ویژه', subtitle: lines.productSub || 'توضیح کوتاه محصول', cta: 'افزودن به سبد' }),
        blk('list', { title: 'ویژگی‌ها و مشخصات' }),
        blk('faq', { title: 'سوالات متداول این محصول' }),
        blk('cta', { title: 'همین حالا سفارش دهید', cta: 'خرید' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    about: {
      name: 'درباره ما',
      blocks: [
        blk('header', { title: 'درباره ' + brand, subtitle: 'داستان برند' }),
        blk('hero', { title: lines.aboutHero || 'ما که هستیم', subtitle: lines.about, cta: 'همکاری با ما' }),
        blk('list', { title: 'ارزش‌ها و رویکرد' }),
        blk('counter', { title: 'مسیر رشد ما' }),
        blk('testimonial', { title: 'از زبان همکاران', subtitle: 'تجربه همکاری حرفه‌ای' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    contact: {
      name: 'تماس',
      blocks: [
        blk('header', { title: 'تماس با ما', subtitle: brand }),
        blk('hero', { title: 'در ارتباط باشید', subtitle: 'پاسخ‌گویی در کوتاه‌ترین زمان', cta: 'ارسال پیام' }),
        blk('list', { title: 'راه‌های ارتباطی' }),
        blk('cta', { title: 'یا از طریق شبکه‌های اجتماعی', cta: 'ایتا / اینستاگرام' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    blog: {
      name: 'بلاگ',
      blocks: [
        blk('header', { title: 'مجله و آموزش', subtitle: brand }),
        blk('hero', { title: 'آخرین مطالب', subtitle: 'نکته‌ها و راهنماهای کاربردی', cta: 'مشاهده همه' }),
        blk('grid', { title: 'مقالات منتخب' }),
        blk('list', { title: 'دسته‌بندی مطالب' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    faq: {
      name: 'سوالات متداول',
      blocks: [
        blk('header', { title: 'سوالات متداول', subtitle: brand }),
        blk('faq', { title: 'پاسخ سوالات پرتکرار' }),
        blk('cta', { title: 'جواب نگرفتید؟', cta: 'تماس با پشتیبانی' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    pricing: {
      name: 'قیمت‌گذاری',
      blocks: [
        blk('header', { title: 'پلن‌ها', subtitle: brand }),
        blk('hero', { title: 'پلن مناسب خود را انتخاب کنید', subtitle: 'شفاف و بدون هزینه پنهان', cta: 'شروع رایگان' }),
        blk('pricing', { title: 'مقایسه پلن‌ها' }),
        blk('list', { title: 'چه چیزی در همه پلن‌ها مشترک است؟' }),
        blk('cta', { title: 'آماده شروع هستید؟', cta: 'ثبت‌نام' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    cart: {
      name: 'سبد خرید',
      blocks: [
        blk('header', { title: 'سبد خرید', subtitle: 'بررسی سفارش' }),
        blk('list', { title: 'کالاها / خدمات انتخاب‌شده' }),
        blk('cta', { title: 'ادامه و پرداخت', cta: 'تسویه‌حساب' }),
        blk('footer', { title: `© ${brand}` }),
      ],
    },
    landing: {
      name: 'فرود کمپین',
      blocks: [
        blk('header', { title: brand, subtitle: 'پیشنهاد ویژه' }),
        blk('hero', { title: lines.campaign || 'فرصت محدود این هفته', subtitle: lines.campaignSub || 'ثبت‌نام سریع و شروع فوری', cta: lines.cta }),
        blk('counter', { title: 'چرا الان؟' }),
        blk('testimonial', { title: 'نتیجه مشتریان قبلی', subtitle: lines.testimonial || 'رضایت بالا' }),
        blk('cta', { title: lines.ctaBlock, cta: lines.cta }),
        blk('footer', { title: `© ${brand}` }),
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
    description: '۱۰ صفحه کامل — برند شخصی و خدمات خلاق',
    preview_gradient: 'linear-gradient(135deg,#1a1035,#8B7CFF 50%,#FF7CC0)',
    pages: buildTenPages('برند نوآ', {
      tagline: 'دنیایی برای رشد ایده',
      hero: 'از ایده تا حضور دیجیتال',
      heroSub: 'برنامک و سایت با هویت رویایی',
      cta: 'شروع کن',
      grid: 'خدمات اصلی',
      ctaBlock: 'اولین قدم را همین امروز بردار',
      about: 'طراحی، استراتژی و اجرای یکپارچه',
      aboutHero: 'داستان نوآ',
      productTitle: 'بسته طراحی هویت',
      productSub: 'لوگو تا صفحه فرود',
      campaign: 'مشاوره رایگان این ماه',
      campaignSub: 'ظرفیت محدود',
      testimonial: 'همکاری دقیق و نتیجه‌محور',
      stats: 'پروژه‌ها و رضایت',
    }),
  },
  {
    id: 'ocean-neon',
    name: 'اقیانوس نئون',
    name_en: 'Ocean Neon',
    category: 'shop',
    theme: 'ocean',
    description: '۱۰ صفحه کامل — فروشگاه و کاتالوگ',
    preview_gradient: 'linear-gradient(135deg,#041820,#35E6C6 45%,#4C8DFF)',
    pages: buildTenPages('فروشگاه موج', {
      tagline: 'کالکشن تازه',
      hero: 'محصولات منتخب این فصل',
      heroSub: 'ارسال سریع · ضمانت اصالت',
      cta: 'مشاهده محصولات',
      grid: 'پرفروش‌ها',
      ctaBlock: 'با کد WELCOME ده درصد تخفیف',
      about: 'فروش مستقیم از تامین‌کننده',
      shopHero: 'کاتالوگ کامل',
      shopSub: 'فیلتر و دسته‌بندی',
      productTitle: 'محصول پرفروش',
      productSub: 'موجودی محدود',
      campaign: 'حراج پایان فصل',
      campaignSub: 'تا ۴۰٪ تخفیف',
      testimonial: 'بسته‌بندی عالی و ارسال به‌موقع',
    }),
  },
  {
    id: 'coral-dusk',
    name: 'غروب مرجانی',
    name_en: 'Coral Dusk',
    category: 'cafe',
    theme: 'mars',
    description: '۱۰ صفحه کامل — کافه، رستوران، رویداد',
    preview_gradient: 'linear-gradient(135deg,#2a1010,#FF7A45 40%,#FF4CA0)',
    pages: buildTenPages('کافه شفق', {
      tagline: 'طعم و فضا',
      hero: 'رزرو میز و منوی روز',
      heroSub: 'صبح تا نیمه‌شب',
      cta: 'رزرو میز',
      grid: 'منوی ویژه',
      ctaBlock: 'اولین قهوه مهمان ما',
      about: 'دان تازه و فضای گرم',
      shopHero: 'منو',
      shopSub: 'نوشیدنی و غذا',
      productTitle: 'لاته مخصوص شفق',
      productSub: 'پیشنهاد باریستا',
      campaign: 'شب موسیقی زنده',
      campaignSub: 'پنجشنبه این هفته',
      testimonial: 'بهترین قهوه محله',
    }),
  },
  {
    id: 'digital-forest',
    name: 'جنگل دیجیتال',
    name_en: 'Digital Forest',
    category: 'education',
    theme: 'forest',
    description: '۱۰ صفحه کامل — آموزش و دوره',
    preview_gradient: 'linear-gradient(135deg,#0a1a12,#3ADC8F 45%,#2FB6C9)',
    pages: buildTenPages('آکادمی ریشه', {
      tagline: 'یادگیری عمیق',
      hero: 'دوره‌های کاربردی، قدم‌به‌قدم',
      heroSub: 'از صفر تا پروژه واقعی',
      cta: 'مشاهده دوره‌ها',
      grid: 'مسیرهای یادگیری',
      ctaBlock: 'جلسه معارفه رایگان',
      about: 'مدرسان باتجربه و پشتیبانی مستمر',
      shopHero: 'کاتالوگ دوره',
      shopSub: 'آنلاین و حضوری',
      productTitle: 'دوره جامع مهارت',
      productSub: '۱۲ هفته · پروژه محور',
      campaign: 'ثبت‌نام زودهنگام',
      campaignSub: 'ظرفیت کلاس محدود',
      testimonial: 'از دوره به شغل رسیدم',
    }),
  },
  {
    id: 'gold-mist',
    name: 'مه طلایی',
    name_en: 'Gold Mist',
    category: 'premium',
    theme: 'gold',
    description: '۱۰ صفحه کامل — خدمات ویژه و مشاوره',
    preview_gradient: 'linear-gradient(135deg,#1a1408,#F2C94C 40%,#C77DFF)',
    pages: buildTenPages('استودیو زرین', {
      tagline: 'خدمات ممتاز',
      hero: 'همراهی حرفه‌ای برای کسب‌وکار تو',
      heroSub: 'طراحی · استراتژی · اجرا',
      cta: 'درخواست مشاوره',
      grid: 'بسته‌های همکاری',
      ctaBlock: 'نوبت مشاوره رایگان این هفته',
      about: 'تیم متخصص با تمرکز بر نتیجه',
      shopHero: 'خدمات',
      shopSub: 'بسته و پروژه سفارشی',
      productTitle: 'بسته رشد ۹۰ روزه',
      productSub: 'استراتژی تا اجرا',
      campaign: 'ممیزی رایگان کسب‌وکار',
      campaignSub: 'فقط این ماه',
      testimonial: 'بازگشت سرمایه مشخص',
    }),
  },
];

// همیشه قالب‌ها را با نسخه کامل ۱۰صفحه‌ای هم‌تراز کن
const upsert = db.prepare(`
  INSERT INTO templates (id, name, name_en, category, theme, description, preview_gradient, pages_json)
  VALUES (@id, @name, @name_en, @category, @theme, @description, @preview_gradient, @pages_json)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,
    name_en=excluded.name_en,
    category=excluded.category,
    theme=excluded.theme,
    description=excluded.description,
    preview_gradient=excluded.preview_gradient,
    pages_json=excluded.pages_json
`);
const tx = db.transaction((rows) => {
  for (const t of rows) {
    upsert.run({
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
console.log('✔ قالب‌های ۱۰صفحه‌ای جارچیا به‌روز شد (' + SEED.length + ' قالب)');

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      `SELECT id, name, name_en, category, theme, description, preview_gradient, pages_json
       FROM templates WHERE is_public = 1 ORDER BY name`
    )
    .all()
    .map((r) => {
      let pageCount = 0;
      try {
        pageCount = Object.keys(JSON.parse(r.pages_json || '{}')).length;
      } catch (_) {}
      const { pages_json, ...rest } = r;
      return { ...rest, pageCount };
    });
  res.json({ templates: rows, count: rows.length });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM templates WHERE id = ? AND is_public = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'قالب یافت نشد.' });
  let pages = {};
  try {
    pages = JSON.parse(row.pages_json);
  } catch (_) {}
  res.json({
    template: {
      id: row.id,
      name: row.name,
      name_en: row.name_en,
      category: row.category,
      theme: row.theme,
      description: row.description,
      preview_gradient: row.preview_gradient,
      pageCount: Object.keys(pages).length,
      pages,
    },
  });
});

module.exports = router;
