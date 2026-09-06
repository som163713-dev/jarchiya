// backend/db.js
const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============ « ’«· »Â œÌ «»Ì” ============
// Å‘ Ì»«‰Ì «“ „ €Ì— „ÕÌÿÌ »—«Ì ”«“ê«—Ì »« Render Ê œÌ”ò Å«Ìœ«—
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'jarchiya.db');
const db = new Database(dbPath);

// ============ »ÂÌ‰Âù”«“ÌùÂ«Ì SQLite ============
db.pragma('journal_mode = WAL'); // Write-Ahead Logging »—«Ì Å—›Ê—„‰” »Â —
db.pragma('foreign_keys = ON'); // ›⁄«·ù”«“Ì ò·ÌœÂ«Ì Œ«—ÃÌ
db.pragma('busy_timeout = 5000'); // ’»— ? À«‰ÌÂù«Ì »—«Ì ﬁ›·ùÂ«Ì œÌ «»Ì”
db.pragma('synchronous = NORMAL'); //  ⁄«œ· »Ì‰ ”—⁄  Ê «„‰Ì 
db.pragma('cache_size = -64000'); // ò‘ ?? „ê«»«Ì Ì œ— Õ«›ŸÂ

// ============ ”«Œ  Ãœ«Ê· ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    avatar_url TEXT,
    settings_json TEXT NOT NULL DEFAULT '{}',
    last_login_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    theme TEXT NOT NULL DEFAULT 'violet',
    template_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    published_url TEXT,
    settings_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_homepage INTEGER DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    blocks_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    preview_url TEXT,
    pages_json TEXT NOT NULL DEFAULT '[]',
    theme TEXT NOT NULL DEFAULT 'violet',
    is_premium INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    prompt_template TEXT NOT NULL,
    input_label TEXT NOT NULL DEFAULT '„Ê÷Ê⁄ / Ê—ÊœÌ',
    output_type TEXT NOT NULL DEFAULT 'text',
    is_premium INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bot_executions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bot_id TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    output TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    amount_toman INTEGER NOT NULL,
    authority TEXT,
    ref_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS agent_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    input TEXT,
    output TEXT,
    status TEXT DEFAULT 'success',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS platform_integrations (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    api_key TEXT,
    settings_json TEXT DEFAULT '{}',
    is_active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS scheduled_campaigns (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    workflow_name TEXT NOT NULL,
    input_data TEXT,
    schedule_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id);
  CREATE INDEX IF NOT EXISTS idx_bots_category ON bots(category);
  CREATE INDEX IF NOT EXISTS idx_bot_executions_user ON bot_executions(user_id);
  CREATE INDEX IF NOT EXISTS idx_agent_tasks_project ON agent_tasks(project_id);
  CREATE INDEX IF NOT EXISTS idx_integrations_project ON platform_integrations(project_id);
`);

// ============ Seed: ﬁ«·»ùÂ«Ì ¬„«œÂ ============
const templatesCount = db.prepare('SELECT COUNT(*) as c FROM templates').get().c;
if (templatesCount === 0) {
  const seedTemplates = [
    {
      id: 'tpl-shop-1',
      name: '›—Ê‘ê«Â ç—„ „œ—‰',
      description: 'ﬁ«·» ›—Ê‘ê«ÂÌ ·Êò” »« «‰Ì„Ì‘‰ùÂ«Ì ‰—„',
      category: '›—Ê‘ê«ÂÌ',
      theme: 'violet',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: '›—Ê‘ê«Â ç—„ ¬—„«‰', subtitle: 'òÌ› Ê ò›‘ œ” ùœÊ“' },
            { id: 'b2', type: 'hero', title: 'ò«·ò‘‰ Å«ÌÌ“Â ????', subtitle: 'ÿ—«ÕÌ ‘œÂ »—«Ì œÊ«„ Ê Ÿ—«› ', cta: '„‘«ÂœÂ ò«·ò‘‰' },
            { id: 'b3', type: 'grid', title: 'Å—›—Ê‘ù —Ì‰ùÂ«' },
            { id: 'b4', type: 'cta', title: '??  Œ›Ì› «Ê·Ì‰ Œ—Ìœ', cta: 'œ—Ì«›  òœ' },
            { id: 'b5', type: 'footer', title: '© ???? ›—Ê‘ê«Â ç—„ ¬—„«‰' }
          ]
        },
        {
          name: '„Õ’Ê·« ',
          slug: 'products',
          blocks: [
            { id: 'b6', type: 'header', title: 'Â„Â „Õ’Ê·« ', subtitle: 'òÌ›° ò›‘° ò„—»‰œ' },
            { id: 'b7', type: 'grid', title: 'œ” Âù»‰œÌùÂ«' }
          ]
        }
      ])
    },
    {
      id: 'tpl-shop-2',
      name: '›—Ê‘ê«Â ÿ·« Ê ÃÊ«Â—',
      description: 'ﬁ«·»  Ì—Â Ê ·Êò” »—«Ì ÃÊ«Â—« ',
      category: '›—Ê‘ê«ÂÌ',
      theme: 'gold',
      is_premium: 1,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: 'ê«·—Ì ÃÊ«Â—', subtitle: 'œ—Œ‘‘ »Ìù‰Â«Ì ' },
            { id: 'b2', type: 'hero', title: 'ò·ò”ÌÊ‰ «·„«”', subtitle: 'ÿ—«ÕÌ „‰Õ’—ù»Âù›—œ', cta: '„‘«ÂœÂ' },
            { id: 'b3', type: 'grid', title: 'ÃœÌœ —Ì‰ùÂ«' }
          ]
        }
      ])
    },
    {
      id: 'tpl-shop-3',
      name: '›—Ê‘ê«Â ÅÊ‘«ò',
      description: 'ﬁ«·» „œ—‰ Ê „Ì‰Ì„«· »—«Ì ÅÊ‘«ò',
      category: '›—Ê‘ê«ÂÌ',
      theme: 'ocean',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: '«” «Ì·', subtitle: 'ÅÊ‘«ò „œ—‰' },
            { id: 'b2', type: 'hero', title: 'ò«·ò‘‰ »Â«—Â', subtitle: '—‰êùÂ«Ì  «“Â', cta: 'Œ—Ìœ ò‰Ìœ' }
          ]
        }
      ])
    },
    {
      id: 'tpl-portfolio-1',
      name: 'ÅÊ— ›Ê·ÌÊ ⁄ò«”',
      description: 'ﬁ«·» ê«·—Ì »—«Ì ⁄ò«”«‰',
      category: '‰„Ê‰Âùò«—',
      theme: 'ice',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: '¬—‘', subtitle: '⁄ò«” Å— —Â' },
            { id: 'b2', type: 'hero', title: '·ÕŸÂùÂ«', subtitle: 'À»  Œ«ÿ—ÂùÂ«', cta: '‰„Ê‰Âùò«—Â«' }
          ]
        }
      ])
    },
    {
      id: 'tpl-portfolio-2',
      name: 'ÅÊ— ›Ê·ÌÊ ÿ—«Õ',
      description: 'ﬁ«·» „Ì‰Ì„«· »—«Ì ÿ—«Õ«‰',
      category: '‰„Ê‰Âùò«—',
      theme: 'mars',
      is_premium: 1,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: '”«—«', subtitle: 'ÿ—«Õ ê—«›Ìò' },
            { id: 'b2', type: 'hero', title: 'Œ·«ﬁÌ  »Ìù„—“', subtitle: 'ÿ—«ÕÌ »—‰œ', cta: '„‘«ÂœÂ' }
          ]
        }
      ])
    },
    {
      id: 'tpl-blog-1',
      name: 'Ê»·«ê ‘Œ’Ì',
      description: 'ﬁ«·» ”«œÂ »—«Ì ‰ÊÌ”‰œê«‰',
      category: 'Ê»·«ê',
      theme: 'forest',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: 'Ì«œœ«‘ ùÂ«', subtitle: '‰Ê‘ ÂùÂ«Ì —Ê“«‰Â' },
            { id: 'b2', type: 'list', title: '¬Œ—Ì‰ „ÿ«·»' }
          ]
        }
      ])
    },
    {
      id: 'tpl-blog-2',
      name: '„Ã·Â Œ»—Ì',
      description: 'ﬁ«·» Õ—›Âù«Ì »—«Ì Œ»—ê“«—Ì',
      category: 'Ê»·«ê',
      theme: 'violet',
      is_premium: 1,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'header', title: 'Œ»— «„—Ê“', subtitle: '¬Œ—Ì‰ «Œ»«—' },
            { id: 'b2', type: 'grid', title: ' Ì —Â«' }
          ]
        }
      ])
    },
    {
      id: 'tpl-landing-1',
      name: '·‰œÌ‰ê «Å·ÌòÌ‘‰',
      description: 'ﬁ«·» ·‰œÌ‰ê »—«Ì „⁄—›Ì «Å',
      category: '·‰œÌ‰ê',
      theme: 'ocean',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'hero', title: '«Å·ÌòÌ‘‰ „‰', subtitle: 'œ«‰·Êœ ò‰Ìœ', cta: 'œ«‰·Êœ' },
            { id: 'b2', type: 'cta', title: '‘—Ê⁄ ò‰Ìœ', cta: 'À» ù‰«„' }
          ]
        }
      ])
    },
    {
      id: 'tpl-landing-2',
      name: '·‰œÌ‰ê —” Ê—«‰',
      description: 'ﬁ«·» “Ì»« »—«Ì —” Ê—«‰ùÂ«',
      category: '·‰œÌ‰ê',
      theme: 'mars',
      is_premium: 1,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'hero', title: '—” Ê—«‰ „‰', subtitle: '„‰ÊÌ «„—Ê“', cta: '—“—Ê' },
            { id: 'b2', type: 'list', title: '€–«Â«' }
          ]
        }
      ])
    },
    {
      id: 'tpl-landing-3',
      name: '·‰œÌ‰ê ¬„Ê“‘ê«Â',
      description: 'ﬁ«·» »—«Ì œÊ—ÂùÂ«Ì ¬„Ê“‘Ì',
      category: '·‰œÌ‰ê',
      theme: 'ice',
      is_premium: 0,
      pages_json: JSON.stringify([
        {
          name: 'Œ«‰Â',
          slug: 'home',
          is_homepage: 1,
          blocks: [
            { id: 'b1', type: 'hero', title: '¬„Ê“‘ ¬‰·«Ì‰', subtitle: 'Ì«œ »êÌ—Ìœ', cta: '‘—Ê⁄' },
            { id: 'b2', type: 'pricing', title: 'Å·‰ùÂ«' }
          ]
        }
      ])
    }
  ];

  const insertTemplate = db.prepare(`
    INSERT INTO templates (id, name, description, category, theme, is_premium, pages_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((templates) => {
    for (const t of templates) {
      insertTemplate.run(t.id, t.name, t.description, t.category, t.theme, t.is_premium, t.pages_json);
    }
  });

  insertMany(seedTemplates);
  console.log('? ?? ﬁ«·» ¬„«œÂ »« „Ê›ﬁÌ  «÷«›Â ‘œ');
}

// ============ Seed: ?? —»«  „Õ Ê« ============
const botsCount = db.prepare('SELECT COUNT(*) as c FROM bots').get().c;
if (botsCount === 0) {
  const seedBots = [
    // ===== —»« ùÂ«Ì ›—Ê‘ê«ÂÌ =====
    { id: 'bot-shop-1', name: ' Ê÷ÌÕ „Õ’Ê· ›—Ê‘ê«ÂÌ', category: '›—Ê‘ê«ÂÌ', icon: '???', is_premium: 0, input_label: '‰«„ „Õ’Ê· Ê ÊÌéêÌùÂ«', prompt_template: 'Ìò  Ê÷ÌÕ Ã–«» Ê Õ—›Âù«Ì »—«Ì „Õ’Ê· “Ì— »‰ÊÌ”. ‘«„·: „⁄—›Ì° ÊÌéêÌùÂ«° „“«Ì«° Ê œ⁄Ê  »Â Œ—Ìœ.\n„Õ’Ê·: {{input}}\n Ê÷ÌÕ:' },
    { id: 'bot-shop-2', name: '⁄‰Ê«‰ Ã–«» »—«Ì „Õ’Ê·', category: '›—Ê‘ê«ÂÌ', icon: '?', is_premium: 0, input_label: '‰«„ „Õ’Ê·', prompt_template: '?? ⁄‰Ê«‰ Ã–«» Ê Œ·«ﬁ«‰Â »—«Ì „Õ’Ê· “Ì— ÅÌ‘‰Â«œ »œÂ.\n„Õ’Ê·: {{input}}\n⁄‰«ÊÌ‰:' },
    { id: 'bot-shop-3', name: '‰ﬁœ Ê »——”Ì „Õ’Ê·', category: '›—Ê‘ê«ÂÌ', icon: '?', is_premium: 1, input_label: '‰«„ „Õ’Ê· Ê „‘Œ’« ', prompt_template: 'Ìò ‰ﬁœ Ê »——”Ì ò«„· Ê „‰’›«‰Â »—«Ì „Õ’Ê· “Ì— »‰ÊÌ”. ‘«„·: ‰ﬁ«ÿ ﬁÊ ° ‰ﬁ«ÿ ÷⁄›° Ê ‰ ÌÃÂùêÌ—Ì.\n„Õ’Ê·: {{input}}\n‰ﬁœ:' },
    { id: 'bot-shop-4', name: '”Ê«·«  „ œ«Ê· „Õ’Ê·', category: '›—Ê‘ê«ÂÌ', icon: '?', is_premium: 0, input_label: '‰«„ „Õ’Ê·', prompt_template: '?? ”Ê«· „ œ«Ê· „‘ —Ì«‰ »—«Ì „Õ’Ê· “Ì— »‰ÊÌ” Â„—«Â »« Å«”Œ.\n„Õ’Ê·: {{input}}\n”Ê«·« :' },
    { id: 'bot-shop-5', name: '«”·Êê«‰ »—‰œ', category: '›—Ê‘ê«ÂÌ', icon: '??', is_premium: 1, input_label: '‰«„ »—‰œ Ê ÕÊ“Â ›⁄«·Ì ', prompt_template: '?? «”·Êê«‰ Ã–«» Ê „«‰œê«— »—«Ì »—‰œ “Ì— ÅÌ‘‰Â«œ »œÂ.\n»—‰œ: {{input}}\n«”·Êê«‰ùÂ«:' },

    // ===== —»« ùÂ«Ì ”∆Ê =====
    { id: 'bot-seo-1', name: '⁄‰Ê«‰ ”∆Ê ‘œÂ', category: '”∆Ê', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄', prompt_template: '? ⁄‰Ê«‰ ”∆Ê ‘œÂ »« ò·„«  ò·ÌœÌ »—«Ì „Ê÷Ê⁄ “Ì— »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\n⁄‰«ÊÌ‰ ”∆Ê:' },
    { id: 'bot-seo-2', name: '„ «  Ê÷ÌÕ« ', category: '”∆Ê', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄ ’›ÕÂ', prompt_template: 'Ìò „ «  Ê÷ÌÕ«  ??-??? ò«—«ò —Ì »—«Ì ’›ÕÂ “Ì— »‰ÊÌ”.\n’›ÕÂ: {{input}}\n„ «  Ê÷ÌÕ« :' },
    { id: 'bot-seo-3', name: 'ò·„«  ò·ÌœÌ', category: '”∆Ê', icon: '??', is_premium: 1, input_label: 'ÕÊ“Â ò”»ùÊò«—', prompt_template: '?? ò·„Â ò·ÌœÌ „— »ÿ »« ò”»ùÊò«— “Ì— ÅÌ‘‰Â«œ »œÂ.\nò”»ùÊò«—: {{input}}\nò·„«  ò·ÌœÌ:' },
    { id: 'bot-seo-4', name: '”«Œ «— URL ”∆Ê ‘œÂ', category: '”∆Ê', icon: '??', is_premium: 0, input_label: '⁄‰Ê«‰ ’›ÕÂ', prompt_template: '? ”«Œ «— URL ”∆Ê ‘œÂ »—«Ì ’›ÕÂ “Ì— ÅÌ‘‰Â«œ »œÂ.\n’›ÕÂ: {{input}}\nURL Â«:' },
    { id: 'bot-seo-5', name: ' Õ·Ì· —ﬁ»«', category: '”∆Ê', icon: '??', is_premium: 1, input_label: 'ÕÊ“Â ò”»ùÊò«—', prompt_template: 'Ìò  Õ·Ì· ò«„· «“ —ﬁ»« œ— ÕÊ“Â “Ì— »‰ÊÌ”. ‘«„·: ‰ﬁ«ÿ ﬁÊ ° ÷⁄›° Ê ›—’ ùÂ«.\nÕÊ“Â: {{input}}\n Õ·Ì·:' },

    // ===== —»« ùÂ«Ì ‘»òÂ «Ã „«⁄Ì =====
    { id: 'bot-social-1', name: 'òÅ‘‰ «Ì‰” «ê—«„', category: '‘»òÂ «Ã „«⁄Ì', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄ Å” ', prompt_template: '? òÅ‘‰ Ã–«» »—«Ì «Ì‰” «ê—«„ »« Â‘ êùÂ«Ì „— »ÿ »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\nòÅ‘‰ùÂ«:' },
    { id: 'bot-social-2', name: 'Å”   ·ê—«„', category: '‘»òÂ «Ã „«⁄Ì', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄ Å” ', prompt_template: 'Ìò Å”  ò«„· »—«Ì ò«‰«·  ·ê—«„ »‰ÊÌ”. ‘«„·:  Ì —° „ ‰° Ê œ⁄Ê  »Â «ﬁœ«„.\n„Ê÷Ê⁄: {{input}}\nÅ” :' },
    { id: 'bot-social-3', name: ' ÊÌÌ  ›«—”Ì', category: '‘»òÂ «Ã „«⁄Ì', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄  ÊÌÌ ', prompt_template: '?  ÊÌÌ  ›«—”Ì òÊ «Â Ê Ã–«» »—«Ì „Ê÷Ê⁄ “Ì— »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\n ÊÌÌ ùÂ«:' },
    { id: 'bot-social-4', name: '«” Ê—Ì «Ì‰” «ê—«„', category: '‘»òÂ «Ã „«⁄Ì', icon: '??', is_premium: 1, input_label: '„Ê÷Ê⁄ «” Ê—Ì', prompt_template: '? „ ‰ òÊ «Â Ê Ã–«» »—«Ì «” Ê—Ì «Ì‰” «ê—«„ »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\n«” Ê—ÌùÂ«:' },
    { id: 'bot-social-5', name: ' ﬁÊÌ„ „Õ Ê«ÌÌ', category: '‘»òÂ «Ã „«⁄Ì', icon: '???', is_premium: 1, input_label: 'ÕÊ“Â ò”»ùÊò«—', prompt_template: 'Ìò  ﬁÊÌ„ „Õ Ê«ÌÌ ? —Ê“Â »—«Ì ‘»òÂùÂ«Ì «Ã „«⁄Ì »‰ÊÌ”.\nÕÊ“Â: {{input}}\n ﬁÊÌ„:' },
    { id: 'bot-social-6', name: 'Â‘ ê ”«“', category: '‘»òÂ «Ã „«⁄Ì', icon: '#??', is_premium: 0, input_label: '„Ê÷Ê⁄', prompt_template: '? Â‘ ê „— »ÿ Ê Å—ò«—»—œ »—«Ì „Ê÷Ê⁄ “Ì— »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\nÂ‘ êùÂ«:' },

    // ===== —»« ùÂ«Ì «Ì„Ì· =====
    { id: 'bot-email-1', name: '«Ì„Ì· ŒÊ‘ù¬„œêÊÌÌ', category: '«Ì„Ì·', icon: '??', is_premium: 0, input_label: '‰«„ »—‰œ', prompt_template: 'Ìò «Ì„Ì· ŒÊ‘ù¬„œêÊÌÌ ê—„ Ê Õ—›Âù«Ì »—«Ì „‘ —Ì«‰ ÃœÌœ »‰ÊÌ”.\n»—‰œ: {{input}}\n«Ì„Ì·:' },
    { id: 'bot-email-2', name: '«Ì„Ì· ›—Ê‘', category: '«Ì„Ì·', icon: '??', is_premium: 1, input_label: '„Õ’Ê· Ì« Œœ„« ', prompt_template: 'Ìò «Ì„Ì· ›—Ê‘ „ ﬁ«⁄œò‰‰œÂ »‰ÊÌ” òÂ „Œ«ÿ» —« »Â Œ—Ìœ  —€Ì» ò‰œ.\n„Õ’Ê·: {{input}}\n«Ì„Ì·:' },
    { id: 'bot-email-3', name: 'Œ»—‰«„Â', category: '«Ì„Ì·', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄ Œ»—‰«„Â', prompt_template: 'Ìò Œ»—‰«„Â Ã–«» »« ? »Œ‘ „Œ ·› »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\nŒ»—‰«„Â:' },
    { id: 'bot-email-4', name: '«Ì„Ì· ÅÌêÌ—Ì', category: '«Ì„Ì·', icon: '??', is_premium: 1, input_label: '„Ê÷Ê⁄ ÅÌêÌ—Ì', prompt_template: 'Ìò «Ì„Ì· ÅÌêÌ—Ì „Êœ»«‰Â Ê Õ—›Âù«Ì »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\n«Ì„Ì·:' },

    // ===== —»« ùÂ«Ì „Õ Ê«Ì Ê»·«ê =====
    { id: 'bot-blog-1', name: '„ﬁ«·Â ò«„· Ê»·«ê', category: 'Ê»·«ê', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄ „ﬁ«·Â', prompt_template: 'Ìò „ﬁ«·Â ò«„· ??? ò·„Âù«Ì »« ”«Œ «— Õ—›Âù«Ì »‰ÊÌ”. ‘«„·: „ﬁœ„Â° »œ‰Â° Ê ‰ ÌÃÂùêÌ—Ì.\n„Ê÷Ê⁄: {{input}}\n„ﬁ«·Â:' },
    { id: 'bot-blog-2', name: '«ÌœÂ „ﬁ«·Â', category: 'Ê»·«ê', icon: '??', is_premium: 0, input_label: 'ÕÊ“Â', prompt_template: '?? «ÌœÂ Ã–«» »—«Ì „ﬁ«·Â œ— ÕÊ“Â “Ì— ÅÌ‘‰Â«œ »œÂ.\nÕÊ“Â: {{input}}\n«ÌœÂùÂ«:' },
    { id: 'bot-blog-3', name: '⁄‰Ê«‰ „ﬁ«·Â', category: 'Ê»·«ê', icon: '?', is_premium: 0, input_label: '„Ê÷Ê⁄', prompt_template: '? ⁄‰Ê«‰ Ã–«» Ê ò·ÌòÌ »—«Ì „ﬁ«·Â “Ì— »‰ÊÌ”.\n„Ê÷Ê⁄: {{input}}\n⁄‰«ÊÌ‰:' },
    { id: 'bot-blog-4', name: 'Œ·«’Â „ﬁ«·Â', category: 'Ê»·«ê', icon: '??', is_premium: 1, input_label: '„ ‰ „ﬁ«·Â', prompt_template: 'Ìò Œ·«’Â ??? ò·„Âù«Ì «“ „ ‰ “Ì— »‰ÊÌ”.\n„ ‰: {{input}}\nŒ·«’Â:' },

    // ===== —»« ùÂ«Ì  »·Ì€« Ì =====
    { id: 'bot-ads-1', name: '„ ‰  »·Ì€« Ì', category: ' »·Ì€« ', icon: '??', is_premium: 0, input_label: '„Õ’Ê· Ì« Œœ„« ', prompt_template: '? „ ‰  »·Ì€« Ì òÊ «Â Ê „ ﬁ«⁄œò‰‰œÂ »‰ÊÌ”.\n„Õ’Ê·: {{input}}\n »·Ì€ùÂ«:' },
    { id: 'bot-ads-2', name: '»‰—  »·Ì€« Ì', category: ' »·Ì€« ', icon: '?', is_premium: 1, input_label: '„Õ’Ê· Ê ÅÌ«„', prompt_template: '„ ‰ Ê ÿ—Õ ÅÌ‘‰Â«œÌ »—«Ì Ìò »‰—  »·Ì€« Ì »‰ÊÌ”.\n„Õ’Ê·: {{input}}\n»‰—:' },
    { id: 'bot-ads-3', name: 'ò„ÅÌ‰  »·Ì€« Ì', category: ' »·Ì€« ', icon: '??', is_premium: 1, input_label: '„Õ’Ê· Ê Âœ›', prompt_template: 'Ìò »—‰«„Â ò«„· ò„ÅÌ‰  »·Ì€« Ì »‰ÊÌ”. ‘«„·: Âœ›° ÅÌ«„° Ê ò«‰«·ùÂ«.\n„Õ’Ê·: {{input}}\nò„ÅÌ‰:' },

    // ===== —»« ùÂ«Ì »—‰œÌ‰ê =====
    { id: 'bot-brand-1', name: 'œ«” «‰ »—‰œ', category: '»—‰œÌ‰ê', icon: '??', is_premium: 0, input_label: '‰«„ »—‰œ Ê ÕÊ“Â', prompt_template: 'Ìò œ«” «‰ Ã–«» Ê «Õ”«”Ì »—«Ì »—‰œ “Ì— »‰ÊÌ”.\n»—‰œ: {{input}}\nœ«” «‰:' },
    { id: 'bot-brand-2', name: '»Ì«‰ÌÂ „«„Ê—Ì ', category: '»—‰œÌ‰ê', icon: '??', is_premium: 0, input_label: '‰«„ »—‰œ', prompt_template: 'Ìò »Ì«‰ÌÂ „«„Ê—Ì  ﬁÊÌ Ê «·Â«„ù»Œ‘ »—«Ì »—‰œ “Ì— »‰ÊÌ”.\n»—‰œ: {{input}}\n„«„Ê—Ì :' },
    { id: 'bot-brand-3', name: '«—“‘ùÂ«Ì »—‰œ', category: '»—‰œÌ‰ê', icon: '??', is_premium: 1, input_label: '‰«„ »—‰œ', prompt_template: '? «—“‘ «’·Ì »—«Ì »—‰œ “Ì—  ⁄—Ì› ò‰ »«  Ê÷ÌÕ.\n»—‰œ: {{input}}\n«—“‘ùÂ«:' },

    // ===== —»« ùÂ«Ì Å‘ Ì»«‰Ì =====
    { id: 'bot-support-1', name: 'Å«”Œ »Â ‘ò«Ì ', category: 'Å‘ Ì»«‰Ì', icon: '', is_premium: 0, input_label: '„ ‰ ‘ò«Ì ', prompt_template: 'Ìò Å«”Œ „Êœ»«‰Â Ê Õ—›Âù«Ì »Â ‘ò«Ì  “Ì— »‰ÊÌ”.\n‘ò«Ì : {{input}}\nÅ«”Œ:' },
    { id: 'bot-support-2', name: '—«Â‰„«Ì «” ›«œÂ', category: 'Å‘ Ì»«‰Ì', icon: '??', is_premium: 1, input_label: '„Õ’Ê· Ì« Œœ„« ', prompt_template: 'Ìò —«Â‰„«Ì ò«„· «” ›«œÂ «“ „Õ’Ê· “Ì— »‰ÊÌ”.\n„Õ’Ê·: {{input}}\n—«Â‰„«:' },
    { id: 'bot-support-3', name: 'ÅÌ«„  ‘ò—', category: 'Å‘ Ì»«‰Ì', icon: '', is_premium: 0, input_label: '‰«„ „‘ —Ì', prompt_template: 'Ìò ÅÌ«„  ‘ò— ê—„ Ê ’„Ì„Ì »—«Ì „‘ —Ì “Ì— »‰ÊÌ”.\n„‘ —Ì: {{input}}\nÅÌ«„:' },

    // ===== —»« ùÂ«Ì ›—Ê‘ =====
    { id: 'bot-sales-1', name: '’›ÕÂ ›—Êœ ›—Ê‘', category: '›—Ê‘', icon: '??', is_premium: 0, input_label: '„Õ’Ê·', prompt_template: '„ ‰ ò«„· Ìò ’›ÕÂ ›—Êœ ›—Ê‘ —« »‰ÊÌ”. ‘«„·:  Ì —° „“«Ì«° Ê œ⁄Ê  »Â «ﬁœ«„.\n„Õ’Ê·: {{input}}\n’›ÕÂ ›—Êœ:' },
    { id: 'bot-sales-2', name: 'ÅÌ‘‰Â«œ ›—Ê‘', category: '›—Ê‘', icon: '??', is_premium: 1, input_label: '„Õ’Ê·', prompt_template: 'Ìò ÅÌ‘‰Â«œ ›—Ê‘ „‰Õ’—ù»Âù›—œ (USP) »—«Ì „Õ’Ê· “Ì— »‰ÊÌ”.\n„Õ’Ê·: {{input}}\nÅÌ‘‰Â«œ:' },
    { id: 'bot-sales-3', name: '«”ò—ÌÅ   „«” ›—Ê‘', category: '›—Ê‘', icon: '??', is_premium: 1, input_label: '„Õ’Ê·', prompt_template: 'Ìò «”ò—ÌÅ  ò«„· »—«Ì  „«” ›—Ê‘ »‰ÊÌ”.\n„Õ’Ê·: {{input}}\n«”ò—ÌÅ :' },

    // ===== —»« ùÂ«Ì ÃœÌœ »—«Ì œÌÊ«— Ê «Ì « =====
    { id: 'bot-divar-1', name: '¬êÂÌ œÌÊ«—', category: ' »·Ì€« ', icon: '??', is_premium: 0, input_label: '„Õ’Ê· Ê ﬁÌ„ ', prompt_template: 'Ìò ¬êÂÌ Ã–«» »—«Ì œÌÊ«— »‰ÊÌ”. ‘«„·: ⁄‰Ê«‰ ò·ÌòÌ°  Ê÷ÌÕ«  ò«„·° Ê ò·„«  ò·ÌœÌ.\n„Õ’Ê·: {{input}}\n¬êÂÌ:' },
    { id: 'bot-eitaa-1', name: 'Å”  «Ì «', category: '‘»òÂ «Ã „«⁄Ì', icon: '??', is_premium: 0, input_label: '„Ê÷Ê⁄', prompt_template: 'Ìò Å”  ’„Ì„Ì Ê Ã–«» »—«Ì ò«‰«· «Ì « »‰ÊÌ” »« «Ì„ÊÃÌ Ê Â‘ ê.\n„Ê÷Ê⁄: {{input}}\nÅ” :' },
    { id: 'bot-torob-1', name: '»ÂÌ‰Âù”«“Ì  —»', category: '›—Ê‘ê«ÂÌ', icon: '??', is_premium: 1, input_label: '„Õ’Ê·', prompt_template: '⁄‰Ê«‰ Ê  Ê÷ÌÕ«  „Õ’Ê· —« »—«Ì „Ê Ê— Ã” ÃÊÌ  —» »ÂÌ‰Â ò‰.\n„Õ’Ê·: {{input}}\n»ÂÌ‰Âù”«“Ì:' },
    { id: 'bot-sheypoor-1', name: '¬êÂÌ ‘ÌÅÊ—', category: ' »·Ì€« ', icon: '???', is_premium: 0, input_label: '„Õ’Ê·', prompt_template: 'Ìò ¬êÂÌ Õ—›Âù«Ì »—«Ì ‘ÌÅÊ— »‰ÊÌ”.\n„Õ’Ê·: {{input}}\n¬êÂÌ:' }
  ];

  const insertBot = db.prepare(`
    INSERT INTO bots (id, name, description, category, icon, is_premium, input_label, prompt_template)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertManyBots = db.transaction((bots) => {
    for (const b of bots) {
      insertBot.run(b.id, b.name, b.name + ' ó ' + b.category, b.category, b.icon, b.is_premium, b.input_label, b.prompt_template);
    }
  });

  insertManyBots(seedBots);
  console.log('? ?? —»«  „Õ Ê« »« „Ê›ﬁÌ  «÷«›Â ‘œ');
}

// ============ Export ============
module.exports = db;