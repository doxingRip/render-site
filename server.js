const express = require('express');
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const PORT = 3000;
const MUSIC_PORT = 5000;
const RENDER_API_PATH = path.join(__dirname, '..', 'render - api');
const PLAYER_BUILD = path.join(RENDER_API_PATH, 'client', 'build');

const MUSIC_API_RE =
  /^\/api\/(tracks|search|lyrics|artists|sc-playlists|playlists|health|discord-presence)(\/|$)/;

app.use(express.json({ limit: '1mb' }));

function sendJson(res, data, status = 200) {
  res.status(status).json(data);
}

function proxyToMusicBackend(req, res) {
  const headers = { ...req.headers, host: `127.0.0.1:${MUSIC_PORT}` };
  delete headers.connection;

  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: MUSIC_PORT,
      path: req.originalUrl,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', () => {
    sendJson(res, { error: 'Music API unavailable. Start render - api server.' }, 502);
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
}

function checkMusicApi() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${MUSIC_PORT}/api/health`, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve(false);
          return;
        }
        try {
          const data = JSON.parse(body);
          resolve(data && data.ok === true);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureMusicBackend() {
  if (await checkMusicApi()) {
    console.log(`🎵 Music API уже работает на :${MUSIC_PORT}`);
    return;
  }

  if (!fs.existsSync(path.join(RENDER_API_PATH, 'server', 'index.js'))) {
    console.warn('⚠️  render - api не найден — плеер в hero не загрузит треки');
    return;
  }

  if (!fs.existsSync(PLAYER_BUILD)) {
    console.warn('⚠️  client/build не найден — выполните: cd "../render - api" && npm run build');
    return;
  }

  process.env.PORT = String(MUSIC_PORT);
  delete process.env.RENDER_DESKTOP;

  const { startServer } = require(path.join(RENDER_API_PATH, 'server', 'index.js'));
  await startServer();
  console.log(`🎵 Music API запущен на :${MUSIC_PORT}`);
}

// Music API (SoundCloud) — до заглушек landing-сайта
app.use((req, res, next) => {
  if (MUSIC_API_RE.test(req.path)) {
    return proxyToMusicBackend(req, res);
  }
  next();
});

// Заглушки API landing-сайта
app.all('/api/*', (req, res) => {
  const url = req.originalUrl || req.url;

  if (url.includes('/analytics/')) {
    return res.status(204).end();
  }

  if (url.includes('/market/cart')) {
    if (req.method === 'GET') {
      return sendJson(res, { success: true, cart: [] });
    }
    return sendJson(res, { success: true });
  }

  if (url.includes('/market/balance')) {
    return sendJson(res, {
      success: true,
      balanceRub: 0,
      totalTopupRub: 0,
      totalEarnedRub: 0,
      totalSpentRub: 0,
      ledger: [],
    });
  }

  if (url.includes('/market/meta') || url.includes('/market/terms')) {
    return sendJson(res, { success: true, items: [] });
  }

  if (url.includes('/auth/verify')) {
    return sendJson(res, { success: false, user: null });
  }

  if (url.includes('/user/profile')) {
    return sendJson(res, { success: false, user: null, profile: null });
  }

  if (url.includes('/auth/') || url.includes('/user/')) {
    return sendJson(res, { success: false, user: null, profile: null });
  }

  return sendJson(res, { success: true, items: [], data: null });
});

app.get('/_vercel/insights/script.js', (req, res) => {
  res.type('application/javascript').send('/* stub */');
});

app.all('/cdn-cgi/*', (req, res) => {
  res.status(204).end();
});

// React-плеер (CRA build из render - api)
if (fs.existsSync(PLAYER_BUILD)) {
  app.use('/static/js', express.static(path.join(PLAYER_BUILD, 'static/js')));
  app.use('/static/css', express.static(path.join(PLAYER_BUILD, 'static/css')));
  app.use('/sounds', express.static(path.join(PLAYER_BUILD, 'sounds')));
  app.get('/logo.png', (req, res) => {
    const playerLogo = path.join(PLAYER_BUILD, 'logo.png');
    const siteLogo = path.join(__dirname, 'images', 'logo.png');
    if (fs.existsSync(playerLogo)) {
      return res.sendFile(playerLogo);
    }
    if (fs.existsSync(siteLogo)) {
      return res.sendFile(siteLogo);
    }
    res.status(404).end();
  });
  app.use('/player', express.static(PLAYER_BUILD, { index: 'index.html' }));
  app.get('/player/*', (req, res) => {
    if (path.extname(req.path)) {
      return res.status(404).end();
    }
    res.sendFile(path.join(PLAYER_BUILD, 'index.html'));
  });
}

app.use('/_next/static/media', express.static(path.join(__dirname, 'fonts')));
app.use('/_next/static/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/_next/static/css', express.static(path.join(__dirname, 'css')));
app.use('/_next/static/chunks/app', express.static(path.join(__dirname, 'js')));
app.use('/_next/static/chunks', express.static(path.join(__dirname, 'js')));
app.use('/static/chunks/app', express.static(path.join(__dirname, 'js')));
app.use('/static/chunks', express.static(path.join(__dirname, 'js')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/img', express.static(path.join(__dirname, 'images')));
app.use('/downloads', express.static(path.join(__dirname, 'Setup')));

function serveHomePage(req, res) {
  const htmlPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');

  html = html.replace(/href="js\//g, 'href="/_next/static/chunks/');
  html = html.replace(/src="js\//g, 'src="/_next/static/chunks/');
  html = html.replace(/href="css\//g, 'href="/_next/static/css/');

  html = html.replace(/<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?<\/script>/gs, '');
  html = html.replace(/<iframe[^>]*><\/iframe>/g, '');

  if (!html.includes('/css/custom.css')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/css/custom.css"></head>');
  }

  const themeInitTag =
    '<script>(function(){try{var t=localStorage.getItem("render_site_theme");if(t==="light")document.documentElement.classList.add("theme-light");}catch(e){}})();</script>';
  if (!html.includes('render_site_theme')) {
    html = html.replace('</head>', themeInitTag + '</head>');
  }

  const customAssetsTag = '<script src="/_next/static/chunks/custom-assets.js" defer></script>';
  if (!html.includes('custom-assets.js')) {
    html = html.replace('</body>', customAssetsTag + '</body>');
  }

  res.set('Cache-Control', 'no-store');
  res.send(html);
}

app.get('/', serveHomePage);
app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

app.get('/.well-known/*', (req, res) => {
  res.status(204).end();
});

app.use(
  express.static(__dirname, {
    index: false,
  })
);

const server = http.createServer(app);

async function start() {
  try {
    await ensureMusicBackend();
  } catch (err) {
    console.warn('⚠️  Music API не запустился:', err.message);
  }

  server.listen(PORT, () => {
    console.log('╔════════════════════════════════════════╗');
    console.log(`║  🚀 Сервер запущен!                    ║`);
    console.log(`║  📍 http://localhost:${PORT}            ║`);
    if (fs.existsSync(PLAYER_BUILD)) {
      console.log(`║  🎧 Плеер: /player/                    ║`);
    }
    console.log('╚════════════════════════════════════════╝');
  });
}

start();

process.on('SIGINT', () => {
  server.close();
  process.exit();
});
