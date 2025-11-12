const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/movieinsight";
const JWT_SECRET = process.env.JWT_SECRET || "changemeinprod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log("Mongo connected"))
  .catch(err => console.error(err));

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if(!username || !email || !password) return res.status(400).json({error: "username, email and password required"});
    const existing = await User.findOne({ username });
    if(existing) return res.status(409).json({error: "username already exists"});
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    const u = new User({ username, email, passwordHash: hash, favorites: [] });
    await u.save();
    res.json({ id: u._id, username: u.username, email: u.email });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "internal" });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if(!username || !password) return res.status(400).json({error: "username and password required"});
    const u = await User.findOne({ username });
    if(!u) return res.status(401).json({error: "invalid credentials"});
    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) return res.status(401).json({error: "invalid credentials"});
    const token = jwt.sign({ sub: u._id.toString(), username: u.username, role: u.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ token, user: { id: u._id, username: u.username, role: u.role } });
  } catch(e) {
    console.error(e);
    res.status(500).json({error: "internal" });
  }
});

// Middleware to require auth for protected routes (used by gateway too)
const requireAuth = async (req, res, next) => {
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
};

// Create user (non-auth)
app.post('/users', async (req, res) => {
  const { username, email, password } = req.body;
  if(!username||!email||!password) return res.status(400).json({error: "username, email and password required"});
  const hash = await bcrypt.hash(password, 10);
  const u = new User({ username, email, passwordHash: hash, favorites: [] });
  await u.save();
  res.json({ id: u._id, username: u.username, email: u.email });
});

// Get user (protected, only owner or admin)
app.get('/users/:id', requireAuth, async (req, res) => {
  const requester = req.user;
  if(requester.sub !== req.params.id && requester.role !== 'admin') return res.status(403).json({error: "forbidden"});
  const u = await User.findById(req.params.id).select('-passwordHash');
  if(!u) return res.status(404).json({error: "not found"});
  res.json(u);
});

// Get favorites (protected)
app.get('/users/:id/favorites', requireAuth, async (req, res) => {
  const requester = req.user;
  if(requester.sub !== req.params.id && requester.role !== 'admin') return res.status(403).json({error: "forbidden"});
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  res.json({ favorites: u.favorites });
});

// Add favorite
app.post('/users/:id/favorites', requireAuth, async (req, res) => {
  const { imdbid } = req.body;
  if(!imdbid) return res.status(400).json({error: "imdbid required"});
  const requester = req.user;
  if(requester.sub !== req.params.id && requester.role !== 'admin') return res.status(403).json({error: "forbidden"});
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  if(!u.favorites.includes(imdbid)) u.favorites.push(imdbid);
  await u.save();
  res.json({ favorites: u.favorites });
});

// Remove favorite
app.delete('/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  const requester = req.user;
  if(requester.sub !== req.params.id && requester.role !== 'admin') return res.status(403).json({error: "forbidden"});
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  u.favorites = u.favorites.filter(id => id !== req.params.imdbid);
  await u.save();
  res.json({ favorites: u.favorites });
});

app.listen(5002, ()=> console.log("User service running on 5002"));
