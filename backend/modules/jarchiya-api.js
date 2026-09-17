/**
 * ماژول API هسته جارچیا (Express routes موجود)
 */
function mountJarchiyaApi(app) {
  const { router: authRouter } = require('../routes/auth');
  const projectsRouter = require('../routes/projects');
  const paymentRouter = require('../routes/payment');
  const adminRouter = require('../routes/admin');
  const botsRouter = require('../routes/bots');
  const campaignsRouter = require('../routes/campaigns');

  app.get('/api/health', (req, res) =>
    res.json({
      ok: true,
      service: 'jarchiya',
      modules: ['core', 'apps', 'asha-gateway'],
    })
  );

  app.get('/api/modules', (req, res) => {
    res.json({
      core: ['auth', 'projects', 'payment', 'admin'],
      apps: ['bots', 'campaigns', 'generator', 'studio'],
      asha: {
        ui: ['/ai', '/panel', '/my'],
        api: ['/chat', '/factory', '/stats', '/payment', '/admin/*'],
        configured: Boolean(process.env.ASHA_API_URL),
      },
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/payment', paymentRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/bots', botsRouter);
  app.use('/api/campaigns', campaignsRouter);
}

module.exports = { mountJarchiyaApi };
