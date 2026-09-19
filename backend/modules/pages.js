/**
 * ماژول صفحات فرانت جارچیا
 */
const path = require('path');

function mountJarchiyaPages(app, frontendPath) {
  app.use(require('express').static(frontendPath));

  const page = (file) => path.join(frontendPath, file);

  app.get('/', (req, res) => res.sendFile(page('1-jarchiya-landing.html')));
  app.get('/generator', (req, res) => res.sendFile(page('2-generator-mvp.html')));
  app.get('/studio', (req, res) => res.sendFile(page('3-studio.html')));
  app.get('/dashboard', (req, res) => res.sendFile(page('4-user-dashboard.html')));
  app.get('/admin', (req, res) => res.sendFile(page('5-admin-panel.html')));
  app.get('/pricing', (req, res) => res.sendFile(page('6-pricing.html')));
  app.get('/login', (req, res) => res.sendFile(page('7-auth-login.html')));
  app.get('/bots', (req, res) => res.sendFile(page('8-bots-studio.html')));
}

module.exports = { mountJarchiyaPages };
