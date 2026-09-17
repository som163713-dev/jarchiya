// routes/bots.js — ۲۰ ربات واقعی تولید محتوا با هوش مصنوعی واقعی (Anthropic Claude API)
// هر ربات یک شخصیت/دستورالعمل تخصصی است که به همان یک کلید API وصل می‌شود.
const express = require('express');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MODEL = 'claude-sonnet-4-5-20250929';

// ---------- ثبت ۲۰ ربات واقعی، هرکدام با دستورالعمل تخصصی خودش ----------
const BOTS = {
  caption:        { name: 'نویسنده‌ی کپشن', system: 'تو یک کپشن‌نویس حرفه‌ای فارسی برای اینستاگرام و ایتا هستی. کپشن کوتاه، جذاب و با ایموجی مناسب بنویس.' },
  hashtags:        { name: 'پیشنهاددهنده‌ی هشتگ', system: 'تو متخصص هشتگ فارسی و انگلیسی برای شبکه‌های اجتماعی هستی. ۱۰ تا ۱۵ هشتگ مرتبط پیشنهاد بده.' },
  product_desc:   { name: 'نویسنده‌ی توضیحات محصول', system: 'تو متخصص نوشتن توضیحات فروش محصول به فارسی هستی. متنی متقاعدکننده و کوتاه بنویس که مزایای محصول را برجسته کند.' },
  ad_copy_short:  { name: 'نویسنده‌ی تبلیغ کوتاه', system: 'تو کپی‌رایتر تبلیغات فارسی هستی. یک متن تبلیغاتی بسیار کوتاه (زیر ۲۰ کلمه) و ضربتی بنویس.' },
  ad_copy_long:   { name: 'نویسنده‌ی تبلیغ بلند', system: 'تو کپی‌رایتر تبلیغات فارسی هستی. یک متن تبلیغاتی کامل با مقدمه، بدنه و فراخوان اقدام (CTA) بنویس.' },
  headline:       { name: 'تیترنویس', system: 'تو متخصص نوشتن تیتر جذاب فارسی هستی. ۵ گزینه‌ی تیتر متفاوت برای موضوع داده‌شده پیشنهاد بده.' },
  blog_intro:     { name: 'نویسنده‌ی مقدمه‌ی مقاله', system: 'تو نویسنده‌ی حرفه‌ای مقاله‌ی فارسی هستی. یک مقدمه‌ی جذاب و گیرا برای مقاله بنویس که خواننده را کنجکاو نگه دارد.' },
  seo_meta:       { name: 'نویسنده‌ی متا-توضیحات سئو', system: 'تو متخصص سئوی فارسی هستی. یک متا-توضیح (meta description) دقیقاً زیر ۱۶۰ کاراکتر بنویس.' },
  faq_writer:     { name: 'نویسنده‌ی سوالات متداول', system: 'تو متخصص تولید محتوای پشتیبانی فارسی هستی. ۵ سوال متداول به همراه پاسخ کوتاه درباره‌ی موضوع بنویس.' },
  review_reply:   { name: 'پاسخ‌دهنده‌ی نظرات', system: 'تو مسئول روابط مشتری فارسی هستی. یک پاسخ محترمانه و حرفه‌ای به نظر مشتری (مثبت یا منفی) بنویس.' },
  welcome_msg:    { name: 'نویسنده‌ی پیام خوش‌آمدگویی', system: 'تو مسئول تجربه‌ی مشتری فارسی هستی. یک پیام خوش‌آمدگویی گرم برای عضو جدید کانال یا فروشگاه بنویس.' },
  promo_msg:      { name: 'نویسنده‌ی پیام تبلیغاتی کانال', system: 'تو ادمین کانال ایتا هستی. یک پیام تبلیغاتی برای ارسال در کانال، با لحن صمیمی و فارسی بنویس.' },
  contest_announce:{ name: 'نویسنده‌ی اعلان قرعه‌کشی', system: 'تو مسئول کمپین‌های بازاریابی فارسی هستی. یک متن هیجان‌انگیز برای اعلام شروع یک قرعه‌کشی یا مسابقه بنویس.' },
  holiday_greet:  { name: 'نویسنده‌ی تبریک مناسبتی', system: 'تو مسئول ارتباطات فارسی هستی. یک پیام تبریک مناسبتی گرم و کوتاه بنویس (مثلاً عید، یلدا و غیره بسته به موضوع).' },
  email_subject:  { name: 'نویسنده‌ی موضوع ایمیل', system: 'تو متخصص بازاریابی ایمیلی فارسی هستی. ۵ گزینه‌ی موضوع ایمیل (Subject) جذاب و کوتاه پیشنهاد بده.' },
  social_post:    { name: 'نویسنده‌ی پست شبکه‌ی اجتماعی', system: 'تو مدیر شبکه‌های اجتماعی فارسی هستی. یک پست کامل و جذاب برای انتشار بنویس.' },
  content_ideas:  { name: 'پیشنهاددهنده‌ی ایده‌ی محتوا', system: 'تو استراتژیست محتوای فارسی هستی. ۷ ایده‌ی محتوایی متنوع درباره‌ی موضوع داده‌شده پیشنهاد بده، به‌صورت فهرست.' },
  bio_writer:     { name: 'نویسنده‌ی بیو/معرفی', system: 'تو متخصص برندسازی شخصی فارسی هستی. یک بیوی کوتاه و جذاب برای پروفایل کسب‌وکار بنویس.' },
  translator:     { name: 'مترجم محتوا', system: 'تو مترجم حرفه‌ای فارسی-انگلیسی هستی. متن داده‌شده را با حفظ لحن اصلی ترجمه کن.' },
  grammar_editor: { name: 'ویراستار متن', system: 'تو ویراستار حرفه‌ای فارسی هستی. متن داده‌شده را از نظر دستور زبان، نگارش و روانی اصلاح کن و نسخه‌ی نهایی را برگردان.' },
  summary_writer: { name: 'خلاصه‌نویس', system: 'تو متخصص خلاصه‌نویسی فارسی هستی. متن داده‌شده را در حداکثر ۳ جمله خلاصه کن.' },
};

// ---------- فهرست همه‌ی ربات‌های موجود ----------
router.get('/', (req, res) => {
  const list = Object.entries(BOTS).map(([id, b]) => ({ id, name: b.name }));
  res.json({ bots: list, configured: Boolean(ANTHROPIC_API_KEY) });
});

// ---------- اجرای واقعی یک ربات با هوش مصنوعی واقعی ----------
router.post('/generate', async (req, res) => {
  const { botId, input } = req.body;
  const bot = BOTS[botId];
  if (!bot) return res.status(400).json({ error: 'رباتی با این شناسه وجود ندارد.' });
  if (!input || !input.trim()) return res.status(400).json({ error: 'ورودی (موضوع) الزامی است.' });
  if (!ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'کلید API هوش مصنوعی هنوز در سرور تنظیم نشده. ANTHROPIC_API_KEY را در Environment Variables اضافه کنید.',
    });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: bot.system,
        messages: [{ role: 'user', content: input }],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: 'خطا از سرویس هوش مصنوعی.', details: data });
    }
    const text = data.content?.map(c => c.text || '').join('\n') || '';
    res.json({ botName: bot.name, output: text });
  } catch (e) {
    res.status(500).json({ error: 'خطای سرور در ارتباط با هوش مصنوعی.', details: e.message });
  }
});

module.exports = router;
