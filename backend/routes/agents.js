/**
 * کاتالوگ ایجنت‌های قابل‌فروش جارچیا
 * - ربات‌های تکی و بسته‌ها از bots
 * - ایجنت فروش (هسته خارجی sales-agent) به‌صورت محصول جدا + قابل اتصال
 */
const express = require('express');
const router = express.Router();

const SALES_AGENT_URL = (process.env.SALES_AGENT_URL || '').replace(/\/$/, '');

router.get('/catalog', (req, res) => {
  res.json({
    products: [
      {
        id: 'bots-single',
        type: 'bot_card',
        name: 'ربات تولید محتوا (تکی)',
        description: 'هر ربات روی کارت خودش؛ قابل خرید جدا',
        href: '/bots',
        sellable: true,
      },
      {
        id: 'bots-bundle-content',
        type: 'bot_bundle',
        name: 'بسته تولید محتوا',
        description: 'چند ربات محتوا با قیمت گروهی',
        href: '/bots?bundle=bundle-content',
        sellable: true,
      },
      {
        id: 'bots-bundle-sales',
        type: 'bot_bundle',
        name: 'بسته فروش و تبلیغ',
        href: '/bots?bundle=bundle-sales',
        sellable: true,
      },
      {
        id: 'sales-agent',
        type: 'sales_agent',
        name: 'ایجنت فروش چندکاناله',
        description:
          'گفتگوی خودکار در پیام‌رسان‌ها و جمع‌آوری سرنخ. داخل جارچیا و به‌صورت سرویس مستقل قابل استقرار.',
        href: SALES_AGENT_URL || '/bots',
        external: Boolean(SALES_AGENT_URL),
        standalone: true,
        in_jarchiya: true,
        configured: Boolean(SALES_AGENT_URL),
        sellable: true,
      },
    ],
    sales_agent: {
      api_base: SALES_AGENT_URL || null,
      status: SALES_AGENT_URL ? 'linked' : 'not_configured',
      hint: SALES_AGENT_URL
        ? 'به سرویس sales-agent وصل است'
        : 'SALES_AGENT_URL را روی آدرس سرویس ایجنت فروش بگذار',
    },
  });
});

/** پروکسی سبک health ایجنت فروش — اگر URL ست شده باشد */
router.get('/sales/health', async (req, res) => {
  if (!SALES_AGENT_URL) {
    return res.status(503).json({ ok: false, error: 'SALES_AGENT_URL تنظیم نشده' });
  }
  try {
    const r = await fetch(`${SALES_AGENT_URL}/health`, { method: 'GET' });
    const text = await r.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
    res.status(r.status).json({ ok: r.ok, upstream: body });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
});

module.exports = router;
