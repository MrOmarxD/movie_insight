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

async function proxyJson(url, options = {}) {
  const response = await fetch(url, options);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { error: "invalid response from upstream" };
  }
  return { response, data };
}

app.get('/api/movies', async (req, res) => {
  try {
    const url = new URL(`${PY_SERVICE}/movies`);
    Object.entries(req.query || {}).forEach(([k, v]) => url.searchParams.append(k, v));

    const { response, data } = await proxyJson(url);
    res.status(response.status).json(data);
  } catch (err) {
    console.error("movie-service error:", err.message);
    res.status(502).json({ error: "movie-service unavailable" });
  }
});
app.get('/api/trending', async (_req, res) => {
  try {
    const { response, data } = await proxyJson(`${PY_SERVICE}/trending`);
    res.status(response.status).json(data);
  } catch (err) {
    console.error("trending error:", err.message);
    res.status(502).json({ error: "movie-service unavailable" });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { response, data } = await proxyJson(`${USER_SERVICE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error("register error:", e.message);
    res.status(502).json({ error: "user-service unavailable" });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { response, data } = await proxyJson(`${USER_SERVICE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error("login error:", e.message);
    res.status(502).json({ error: "user-service unavailable" });
  }
});

app.post('/api/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites`;
    const { response, data } = await proxyJson(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error('user-service add favorite error:', e.message);
    res.status(502).json({ error: 'user-service unavailable' });
  }
});

app.get('/api/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites`;
    const { response, data } = await proxyJson(target, {
      headers: { Authorization: req.headers.authorization }
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error('user-service get favorites error:', e.message);
    res.status(502).json({ error: 'user-service unavailable' });
  }
});

app.delete('/api/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites/${req.params.imdbid}`;
    const { response, data } = await proxyJson(target, {
      method: 'DELETE',
      headers: {
        Authorization: req.headers.authorization
      }
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error('user-service delete favorite error:', e.message);
    res.status(502).json({ error: 'user-service unavailable' });
  }
});

app.put('/api/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  try {
    const target = `${USER_SERVICE}/users/${req.params.id}/favorites/${req.params.imdbid}`;
    const { response, data } = await proxyJson(target, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: req.headers.authorization
      },
      body: JSON.stringify(req.body)
    });

    res.status(response.status).json(data);
  } catch (e) {
    console.error('user-service update favorite error:', e.message);
    res.status(502).json({ error: 'user-service unavailable' });
  }
});

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(8080, () => console.log("gateway listening on 8080"));
