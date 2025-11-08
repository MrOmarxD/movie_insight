const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: f})=> f(...args));
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PY_SERVICE = process.env.PY_SERVICE || "http://localhost:5001";
const USER_SERVICE = process.env.USER_SERVICE || "http://localhost:5002";
const JWT_SECRET = process.env.JWT_SECRET || "changemeinprod";

// Serve static frontend
app.use('/', express.static(path.join(__dirname, 'public')));

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer ')) return res.status(401).json({error: "missing token"});
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch(e) {
    return res.status(401).json({error: "invalid token"});
  }
}

// Proxy search movies (public)
app.get('/api/movies', async (req, res) => {
  const q = req.query;
  const url = new URL(`${PY_SERVICE}/movies`);
  Object.keys(q).forEach(k => url.searchParams.append(k, q[k]));
  const r = await fetch(url);
  const data = await r.json();
  res.status(r.status).json(data);
});

// Auth routes passthrough (register/login) - public
app.post('/api/auth/register', async (req, res) => {
  const r = await fetch(`${USER_SERVICE}/auth/register`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(req.body) });
  const data = await r.json();
  res.status(r.status).json(data);
});
app.post('/api/auth/login', async (req, res) => {
  const r = await fetch(`${USER_SERVICE}/auth/login`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(req.body) });
  const data = await r.json();
  res.status(r.status).json(data);
});

// Protected user routes - requireAuth middleware; proxy to user service including token
app.use('/api/users', requireAuth, async (req, res) => {
  const target = `${USER_SERVICE}${req.originalUrl.replace(/^\/api\/users/,'')}`;
  const opts = { method: req.method, headers: { 'content-type': 'application/json', 'authorization': req.headers.authorization } };
  if (['POST','PUT','PATCH'].includes(req.method)) opts.body = JSON.stringify(req.body);
  const r = await fetch(target, opts);
  const data = await r.json();
  res.status(r.status).json(data);
});

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(8080, () => console.log("Gateway listening on 8080"));
