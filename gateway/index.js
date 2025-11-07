const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: f})=> f(...args));
const path = require('path');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const app = express();
app.use(cors());
app.use(express.json());

const PY_SERVICE = process.env.PY_SERVICE || "http://localhost:5001";
const USER_SERVICE = process.env.USER_SERVICE || "http://localhost:5002";

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/api/movies', async (req, res) => {
  const q = req.query;
  const url = new URL(`${PY_SERVICE}/movies`);
  Object.keys(q).forEach(k => url.searchParams.append(k, q[k]));
  const r = await fetch(url);
  const data = await r.json();
  res.status(r.status).json(data);
});

app.use('/api/users', async (req, res) => {
  const target = `${USER_SERVICE}${req.originalUrl.replace(/^\/api\/users/,'')}`;
  const opts = { method: req.method, headers: { 'content-type': 'application/json' } };
  if (['POST','PUT','PATCH'].includes(req.method)) opts.body = JSON.stringify(req.body);
  const r = await fetch(target, opts);
  const data = await r.json();
  res.status(r.status).json(data);
});

const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(8080, () => console.log("Gateway listening on 8080"));
