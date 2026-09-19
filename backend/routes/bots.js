/**
 * ۲۰ ربات تولید محتوا — هر کدام کارت/محصول جدا
 * هوش مصنوعی: اول ارزان/رایگان (Groq → Gemini → OpenRouter)، بعد Anthropic در صورت وجود
 */
const express = require('express');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

/** متادیتای فروش و گروه برای هر ربات */
const BOTS = {
  caption: {
    name: 'نویسنده‌ی کپشن',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 49000,
    icon: '✍️',
    blurb: 'کپشن کوتاه و جذاب برای ایتا و اینستاگرام',
    system: 'تو یک کپشن‌نویس حرفه‌ای فارسی برای اینستاگرام و ایتا هستی. کپشن کوتاه، جذاب و با ایموجی مناسب بنویس.',
  },
  hashtags: {
    name: 'پیشنهاددهنده‌ی هشتگ',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 29000,
    icon: '#️⃣',
    blurb: '۱۰ تا ۱۵ هشتگ مرتبط فارسی و انگلیسی',
    system: 'تو متخصص هشتگ فارسی و انگلیسی برای شبکه‌های اجتماعی هستی. ۱۰ تا ۱۵ هشتگ مرتبط پیشنهاد بده.',
  },
  product_desc: {
    name: 'نویسنده‌ی توضیحات محصول',
    group: 'sales',
    groupLabel: 'فروش',
    price_toman: 59000,
    icon: '📦',
    blurb: 'توضیح متقاعدکننده برای صفحه محصول',
    system: 'تو متخصص نوشتن توضیحات فروش محصول به فارسی هستی. متنی متقاعدکننده و کوتاه بنویس که مزایای محصول را برجسته کند.',
  },
  ad_copy_short: {
    name: 'نویسنده‌ی تبلیغ کوتاه',
    group: 'sales',
    groupLabel: 'فروش',
    price_toman: 39000,
    icon: '⚡',
    blurb: 'متن تبلیغاتی ضربتی زیر ۲۰ کلمه',
    system: 'تو کپی‌رایتر تبلیغات فارسی هستی. یک متن تبلیغاتی بسیار کوتاه (زیر ۲۰ کلمه) و ضربتی بنویس.',
  },
  ad_copy_long: {
    name: 'نویسنده‌ی تبلیغ بلند',
    group: 'sales',
    groupLabel: 'فروش',
    price_toman: 69000,
    icon: '📢',
    blurb: 'تبلیغ کامل با مقدمه، بدنه و CTA',
    system: 'تو کپی‌رایتر تبلیغات فارسی هستی. یک متن تبلیغاتی کامل با مقدمه، بدنه و فراخوان اقدام (CTA) بنویس.',
  },
  headline: {
    name: 'تیترنویس',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 35000,
    icon: '🎯',
    blurb: '۵ تیتر جذاب برای موضوع تو',
    system: 'تو متخصص نوشتن تیتر جذاب فارسی هستی. ۵ گزینه‌ی تیتر متفاوت برای موضوع داده‌شده پیشنهاد بده.',
  },
  blog_intro: {
    name: 'نویسنده‌ی مقدمه‌ی مقاله',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 45000,
    icon: '📝',
    blurb: 'مقدمه گیرا برای مقاله یا پست بلند',
    system: 'تو نویسنده‌ی حرفه‌ای مقاله‌ی فارسی هستی. یک مقدمه‌ی جذاب و گیرا برای مقاله بنویس که خواننده را کنجکاو نگه دارد.',
  },
  seo_meta: {
    name: 'نویسنده‌ی متا سئو',
    group: 'seo',
    groupLabel: 'سئو',
    price_toman: 39000,
    icon: '🔍',
    blurb: 'متا‌توضیح زیر ۱۶۰ کاراکتر',
    system: 'تو متخصص سئوی فارسی هستی. یک متا-توضیح (meta description) دقیقاً زیر ۱۶۰ کاراکتر بنویس.',
  },
  faq_writer: {
    name: 'نویسنده‌ی سوالات متداول',
    group: 'support',
    groupLabel: 'پشتیبانی',
    price_toman: 55000,
    icon: '❓',
    blurb: '۵ پرسش و پاسخ آماده',
    system: 'تو متخصص تولید محتوای پشتیبانی فارسی هستی. ۵ سوال متداول به همراه پاسخ کوتاه درباره‌ی موضوع بنویس.',
  },
  review_reply: {
    name: 'پاسخ‌دهنده‌ی نظرات',
    group: 'support',
    groupLabel: 'پشتیبانی',
    price_toman: 42000,
    icon: '💬',
    blurb: 'پاسخ محترمانه به نظر مشتری',
    system: 'تو مسئول روابط مشتری فارسی هستی. یک پاسخ محترمانه و حرفه‌ای به نظر مشتری (مثبت یا منفی) بنویس.',
  },
  welcome_msg: {
    name: 'پیام خوش‌آمدگویی',
    group: 'community',
    groupLabel: 'انجمن',
    price_toman: 32000,
    icon: '👋',
    blurb: 'خوش‌آمد گرم برای عضو جدید',
    system: 'تو مسئول تجربه‌ی مشتری فارسی هستی. یک پیام خوش‌آمدگویی گرم برای عضو جدید کانال یا فروشگاه بنویس.',
  },
  promo_msg: {
    name: 'پیام تبلیغاتی کانال',
    group: 'sales',
    groupLabel: 'فروش',
    price_toman: 48000,
    icon: '📣',
    blurb: 'پیام صمیمی برای کانال ایتا',
    system: 'تو ادمین کانال ایتا هستی. یک پیام تبلیغاتی برای ارسال در کانال، با لحن صمیمی و فارسی بنویس.',
  },
  contest_announce: {
    name: 'اعلان قرعه‌کشی',
    group: 'campaign',
    groupLabel: 'کمپین',
    price_toman: 52000,
    icon: '🎁',
    blurb: 'متن هیجان‌انگیز شروع مسابقه',
    system: 'تو مسئول کمپین‌های بازاریابی فارسی هستی. یک متن هیجان‌انگیز برای اعلام شروع یک قرعه‌کشی یا مسابقه بنویس.',
  },
  holiday_greet: {
    name: 'تبریک مناسبتی',
    group: 'community',
    groupLabel: 'انجمن',
    price_toman: 29000,
    icon: '🎉',
    blurb: 'پیام تبریک عید و مناسبت‌ها',
    system: 'تو مسئول ارتباطات فارسی هستی. یک پیام تبریک مناسبتی گرم و کوتاه بنویس (مثلاً عید، یلدا و غیره بسته به موضوع).',
  },
  email_subject: {
    name: 'موضوع ایمیل',
    group: 'sales',
    groupLabel: 'فروش',
    price_toman: 35000,
    icon: '✉️',
    blurb: '۵ موضوع ایمیل جذاب',
    system: 'تو متخصص بازاریابی ایمیلی فارسی هستی. ۵ گزینه‌ی موضوع ایمیل (Subject) جذاب و کوتاه پیشنهاد بده.',
  },
  social_post: {
    name: 'پست شبکه اجتماعی',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 49000,
    icon: '📱',
    blurb: 'یک پست کامل و آماده انتشار',
    system: 'تو مدیر شبکه‌های اجتماعی فارسی هستی. یک پست کامل و جذاب برای انتشار بنویس.',
  },
  content_ideas: {
    name: 'ایده‌پرداز محتوا',
    group: 'content',
    groupLabel: 'تولید محتوا',
    price_toman: 45000,
    icon: '💡',
    blurb: '۷ ایده محتوایی متنوع',
    system: 'تو استراتژیست محتوای فارسی هستی. ۷ ایده‌ی محتوایی متنوع درباره‌ی موضوع داده‌شده پیشنهاد بده، به‌صورت فهرست.',
  },
  bio_writer: {
    name: 'نویسنده‌ی بیو',
    group: 'brand',
    groupLabel: 'برند',
    price_toman: 39000,
    icon: '👤',
    blurb: 'بیوی کوتاه برای پروفایل کسب‌وکار',
    system: 'تو متخصص برندسازی شخصی فارسی هستی. یک بیوی کوتاه و جذاب برای پروفایل کسب‌وکار بنویس.',
  },
  translator: {
    name: 'مترجم',
    group: 'tools',
    groupLabel: 'ابزار',
    price_toman: 55000,
    icon: '🌐',
    blurb: 'ترجمه فارسی↔انگلیسی با حفظ لحن',
    system: 'تو مترجم حرفه‌ای فارسی-انگلیسی هستی. متن داده‌شده را با حفظ لحن اصلی ترجمه کن.',
  },
  grammar_editor: {
    name: 'ویراستار',
    group: 'tools',
    groupLabel: 'ابزار',
    price_toman: 42000,
    icon: '✏️',
    blurb: 'اصلاح دستور و نگارش فارسی',
    system: 'تو ویراستار حرفه‌ای فارسی هستی. متن داده‌شده را از نظر دستور زبان، نگارش و روانی اصلاح کن و نسخه‌ی نهایی را برگردان.',
  },
  summary_writer: {
    name: 'خلاصه‌نویس',
    group: 'tools',
    groupLabel: 'ابزار',
    price_toman: 32000,
    icon: '📋',
    blurb: 'خلاصه در حداکثر ۳ جمله',
    system: 'تو متخصص خلاصه‌نویسی فارسی هستی. متن داده‌شده را در حداکثر ۳ جمله خلاصه کن.',
  },
};

/** بسته‌های گروهی قابل فروش */
const BUNDLES = [
  {
    id: 'bundle-content',
    name: 'بسته تولید محتوا',
    botIds: ['caption', 'hashtags', 'headline', 'social_post', 'content_ideas', 'blog_intro'],
    price_toman: 199000,
    blurb: 'شش ربات محتوا با قیمت کمتر از خرید تکی',
  },
  {
    id: 'bundle-sales',
    name: 'بسته فروش و تبلیغ',
    botIds: ['product_desc', 'ad_copy_short', 'ad_copy_long', 'promo_msg', 'email_subject'],
    price_toman: 179000,
    blurb: 'پنج ربات مخصوص فروش و کمپین',
  },
  {
    id: 'bundle-all',
    name: 'بسته کامل ۲۰ ربات',
    botIds: Object.keys(BOTS),
    price_toman: 490000,
    blurb: 'دسترسی به همه ربات‌های تولید محتوا',
  },
];

function providersStatus() {
  return {
    groq: Boolean(GROQ_API_KEY),
    gemini: Boolean(GEMINI_API_KEY),
    openrouter: Boolean(OPENROUTER_API_KEY),
    anthropic: Boolean(ANTHROPIC_API_KEY),
    any: Boolean(GROQ_API_KEY || GEMINI_API_KEY || OPENROUTER_API_KEY || ANTHROPIC_API_KEY),
  };
}

async function callGroq(system, user) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Groq error');
  return { text: data.choices?.[0]?.message?.content || '', provider: 'groq' };
}

async function callGemini(system, user) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error');
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return { text, provider: 'gemini' };
}

async function callOpenRouter(system, user) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free',
      max_tokens: 800,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'OpenRouter error');
  return { text: data.choices?.[0]?.message?.content || '', provider: 'openrouter' };
}

async function callAnthropic(system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Anthropic error');
  const text = data.content?.map((c) => c.text || '').join('\n') || '';
  return { text, provider: 'anthropic' };
}

/** ترتیب: ارزان/رایگان اول */
async function generateText(system, user) {
  const errors = [];
  const chain = [];
  if (GROQ_API_KEY) chain.push(callGroq);
  if (GEMINI_API_KEY) chain.push(callGemini);
  if (OPENROUTER_API_KEY) chain.push(callOpenRouter);
  if (ANTHROPIC_API_KEY) chain.push(callAnthropic);
  if (!chain.length) {
    const err = new Error('NO_PROVIDER');
    err.code = 'NO_PROVIDER';
    throw err;
  }
  for (const fn of chain) {
    try {
      return await fn(system, user);
    } catch (e) {
      errors.push(e.message);
    }
  }
  const err = new Error(errors.join(' | ') || 'all providers failed');
  err.code = 'ALL_FAILED';
  throw err;
}

router.get('/', (req, res) => {
  const list = Object.entries(BOTS).map(([id, b]) => ({
    id,
    name: b.name,
    group: b.group,
    groupLabel: b.groupLabel,
    price_toman: b.price_toman,
    icon: b.icon,
    blurb: b.blurb,
  }));
  res.json({
    bots: list,
    bundles: BUNDLES,
    configured: providersStatus().any,
    providers: providersStatus(),
  });
});

router.get('/catalog', (req, res) => {
  const byGroup = {};
  for (const [id, b] of Object.entries(BOTS)) {
    if (!byGroup[b.group]) {
      byGroup[b.group] = { id: b.group, label: b.groupLabel, bots: [] };
    }
    byGroup[b.group].bots.push({
      id,
      name: b.name,
      price_toman: b.price_toman,
      icon: b.icon,
      blurb: b.blurb,
    });
  }
  res.json({ groups: Object.values(byGroup), bundles: BUNDLES });
});

router.post('/generate', async (req, res) => {
  const { botId, input } = req.body || {};
  const bot = BOTS[botId];
  if (!bot) return res.status(400).json({ error: 'رباتی با این شناسه وجود ندارد.' });
  if (!input || !String(input).trim()) {
    return res.status(400).json({ error: 'ورودی (موضوع) الزامی است.' });
  }
  try {
    const { text, provider } = await generateText(bot.system, String(input).trim());
    res.json({ botName: bot.name, botId, output: text, provider });
  } catch (e) {
    if (e.code === 'NO_PROVIDER') {
      return res.status(503).json({
        error:
          'هیچ کلید هوش مصنوعی تنظیم نشده. یکی از GROQ_API_KEY (رایگان)، GEMINI_API_KEY، OPENROUTER_API_KEY یا ANTHROPIC_API_KEY را در Environment بگذار.',
        providers: providersStatus(),
      });
    }
    res.status(502).json({ error: 'خطا از سرویس هوش مصنوعی.', details: e.message });
  }
});

module.exports = router;
