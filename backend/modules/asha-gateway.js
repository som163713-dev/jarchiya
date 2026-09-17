/**
 * ماژول دروازه‌ی آشا (Asha / boteit)
 * فرانت آشا از جارچیا سرو می‌شود؛ API به سرویس FastAPI جدا پروکسی می‌شود.
 */
const path = require('path');
const express = require('express');

function createAshaProxy(ashaUrl) {
  const { createProxyMiddleware } = require('http-proxy-middleware');
  return createProxyMiddleware({
    target: ashaUrl,
    changeOrigin: true,
    onError(err, req, res) {
      console.error('Asha proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'اتصال به سرویس آشا برقرار نشد',
          detail: err.message,
        });
      }
    },
  });
}

function offlineHandler(req, res) {
  res.status(503).json({
    error: 'ماژول آشا پیکربندی نشده است',
    hint: 'متغیر محیطی ASHA_API_URL را روی آدرس سرویس FastAPI آشا تنظیم کن',
  });
}

/**
 * @param {import('express').Express} app
 * @param {{ frontendRoot: string }} opts
 */
function mountAshaGateway(app, { frontendRoot }) {
  const ashaRoot = path.join(frontendRoot, 'asha');
  const ashaUrl = (process.env.ASHA_API_URL || '').replace(/\/$/, '');

  // استاتیک با مسیرهای اصلی آشا
  app.use('/static', express.static(ashaRoot));
  app.use('/admin-panel', express.static(path.join(ashaRoot, 'admin')));
  app.use('/customer-assets', express.static(path.join(ashaRoot, 'customer')));

  // صفحات آشا
  app.get(['/ai', '/asha'], (req, res) => {
    res.sendFile(path.join(ashaRoot, 'index.html'));
  });
  app.get('/panel', (req, res) => {
    res.sendFile(path.join(ashaRoot, 'admin', 'index.html'));
  });
  app.get('/my', (req, res) => {
    res.sendFile(path.join(ashaRoot, 'customer', 'index.html'));
  });

  if (!ashaUrl) {
    app.use(['/chat', '/factory', '/stats', '/payment'], offlineHandler);
    console.warn('⚠️  ASHA_API_URL تنظیم نشده — پروکسی آشا غیرفعال است');
    return {
      enabled: false,
      /** بعد از route صفحه /admin جارچیا صدا بزن */
      mountAdminProxy(appInner) {
        appInner.use('/admin', offlineHandler);
      },
    };
  }

  let proxy;
  try {
    proxy = createAshaProxy(ashaUrl);
  } catch (e) {
    console.error('نصب http-proxy-middleware لازم است:', e.message);
    return {
      enabled: false,
      mountAdminProxy(appInner) {
        appInner.use('/admin', offlineHandler);
      },
    };
  }

  app.use('/chat', proxy);
  app.use('/factory', proxy);
  app.use('/stats', proxy);
  app.use('/payment', proxy);

  const { createProxyMiddleware } = require('http-proxy-middleware');
  app.use(
    '/asha-api',
    createProxyMiddleware({
      target: ashaUrl,
      changeOrigin: true,
      pathRewrite: { '^/asha-api': '' },
      onError(err, req, res) {
        console.error('Asha proxy error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: 'اتصال به سرویس آشا برقرار نشد' });
        }
      },
    })
  );

  console.log(`✔ دروازه آشا فعال → ${ashaUrl}`);

  return {
    enabled: true,
    ashaUrl,
    /** باید بعد از app.get('/admin') صفحه پنل جارچیا صدا زده شود */
    mountAdminProxy(appInner) {
      appInner.use('/admin', proxy);
    },
  };
}

module.exports = { mountAshaGateway };
