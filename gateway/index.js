const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PY_SERVICE = process.env.PY_SERVICE || "http://movie-service:5001";
const USER_SERVICE = process.env.USER_SERVICE || "http://user-service:5002";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

app.use('/', express.static(path.join(__dirname, 'public')));

// AUTH MIDDLEWARE
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: "missing token" });
  }

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
}

// MOVIE SERVICE PROXY
app.get('/api/movies', async (req, res) => {
  try {
    const url = new URL(`${PY_SERVICE}/movies`);
    Object.keys(req.query).forEach(k => url.searchParams.append(k, req.query[k]));

    const r = await fetch(url);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error("❌ movie-service error:", err.message);
    res.status(502).json({ error: "movie-service unavailable" });
  }
});

// AUTH PASSTHROUGH
app.post('/api/auth/register', async (req, res) => {
  try {
    const r = await fetch(`${USER_SERVICE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error("❌ register error:", e.message);
    res.status(502).json({ error: "user-service unavailable" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const r = await fetch(`${USER_SERVICE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error("❌ login error:", e.message);
    res.status(502).json({ error: "user-service unavailable" });
  }
});

// AÑADIR FAVORITO (POST)
app.post('/api/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites`;
    console.log("➡️ Gateway → User:", target);

    const r = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error('❌ USER SERVICE ERROR:', e.message);
    res.status(502).json({ error: 'User service unavailable' });
  }
});

// OBTENER FAVORITOS (GET)
app.get('/api/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites`;
    console.log("➡️ Gateway → User (GET):", target);

    const r = await fetch(target, {
      headers: { Authorization: req.headers.authorization }
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error('❌ FAVORITES GET ERROR:', e.message);
    res.status(502).json({ error: 'User service unavailable' });
  }
});

// ELIMINAR FAVORITO (DELETE)
app.delete('/api/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites/${req.params.imdbid}`;
    console.log("🗑️ Gateway → User:", target);

    const r = await fetch(target, {
      method: 'DELETE',
      headers: {
        Authorization: req.headers.authorization
      }
    });

    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error('❌ DELETE FAVORITE ERROR:', e.message);
    res.status(502).json({ error: 'User service unavailable' });
  }
});

// SWAGGER
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(8080, () => console.log("✅ Gateway listening on 8080"));