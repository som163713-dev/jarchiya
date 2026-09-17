// routes/payment.js — اتصال واقعی به درگاه پرداخت زرین‌پال
// راهنما: مقدار ZARINPAL_MERCHANT_ID را در فایل .env با کد پذیرنده‌ی واقعی خودتان جایگزین کنید.
// مستندات رسمی: https://www.zarinpal.com/docs/paymentGateway/
const express = require('express');
const fetch = require('node-fetch');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();
router.use(requireAuth);

const MERCHANT_ID = process.env.ZARINPAL_MERCHANT_ID || '00000000-0000-0000-0000-000000000000';
const IS_SANDBOX = process.env.ZARINPAL_SANDBOX !== 'false'; // پیش‌فرض: حالت آزمایشی و امن
const BASE = IS_SANDBOX ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
const CALLBACK_BASE = process.env.PUBLIC_URL || 'http://localhost:3000';

const PLAN_PRICES = { pro: 199000, enterprise: 599000 }; // تومان — با پلن‌های واقعی خودتان هماهنگ کنید

// ---------- مرحله‌ی اول: درخواست پرداخت و دریافت لینک درگاه ----------
router.post('/request', async (req, res) => {
  const { plan } = req.body;
  const amount = PLAN_PRICES[plan];
  if (!amount) return res.status(400).json({ error: 'پلن نامعتبر است.' });

  try {
    const response = await fetch(`${BASE}/pg/v4/payment/request.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: amount * 10, // زرین‌پال مبلغ را به ریال می‌گیرد
        callback_url: `${CALLBACK_BASE}/api/payment/verify`,
        description: `ارتقا به پلن ${plan} — ایشِته`,
      }),
    });
    const data = await response.json();

    if (data?.data?.code === 100) {
      db.prepare(
        'INSERT INTO payments (user_id, plan, amount_toman, authority, status) VALUES (?, ?, ?, ?, ?)'
      ).run(req.userId, plan, amount, data.data.authority, 'pending');

      return res.json({
        paymentUrl: `${BASE}/pg/StartPay/${data.data.authority}`,
      });
    }
    res.status(502).json({ error: 'خطا در ارتباط با درگاه پرداخت.', details: data });
  } catch (e) {
    res.status(500).json({ error: 'خطای سرور در برقراری ارتباط با زرین‌پال.', details: e.message });
  }
});

// ---------- مرحله‌ی دوم: تایید پرداخت بعد از بازگشت کاربر از درگاه ----------
router.get('/verify', async (req, res) => {
  const { Authority, Status } = req.query;
  const payment = db.prepare('SELECT * FROM payments WHERE authority = ?').get(Authority);

  if (!payment) return res.status(404).send('تراکنش یافت نشد.');
  if (Status !== 'OK') {
    db.prepare("UPDATE payments SET status = 'canceled' WHERE id = ?").run(payment.id);
    return res.redirect(`${CALLBACK_BASE}/pricing?payment=canceled`);
  }

  try {
    const response = await fetch(`${BASE}/pg/v4/payment/verify.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: MERCHANT_ID,
        amount: payment.amount_toman * 10,
        authority: Authority,
      }),
    });
    const data = await response.json();

    if (data?.data?.code === 100 || data?.data?.code === 101) {
      db.prepare("UPDATE payments SET status = 'paid', ref_id = ? WHERE id = ?").run(
        String(data.data.ref_id || ''),
        payment.id
      );
      db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(payment.plan, payment.user_id);
      return res.redirect(`${CALLBACK_BASE}/dashboard?payment=success`);
    }
    db.prepare("UPDATE payments SET status = 'failed' WHERE id = ?").run(payment.id);
    res.redirect(`${CALLBACK_BASE}/pricing?payment=failed`);
  } catch (e) {
    res.status(500).send('خطا در تایید پرداخت: ' + e.message);
  }
});

module.exports = router;
