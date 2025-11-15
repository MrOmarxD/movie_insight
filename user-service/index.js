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

// ENV
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/movieinsight";
const JWT_SECRET = process.env.JWT_SECRET || "changemeinprod";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "8h";

// DB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log("✅ Mongo connected"))
  .catch(err => console.error("❌ Mongo error:", err));


// REGISTER
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if(!username || !email || !password)
      return res.status(400).json({ error: "username, email and password required" });

    const existing = await User.findOne({ email });
    if(existing) return res.status(409).json({ error: "email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const u = new User({
      username,
      email,
      passwordHash: hash
    });

    await u.save();

    return res.json({ message: "registered", user: { id: u._id, username, email }});
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "internal error" });
  }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "email/username and password required" });
    }

    // Buscar por email o username
    const u = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });

    if (!u) return res.status(401).json({ error: "invalid credentials" });

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });

    // Token JWT
    const token = jwt.sign(
      { sub: u._id.toString(), username: u.username, role: u.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: { id: u._id, username: u.username, email: u.email, role: u.role }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal" });
  }
});

// AUTH MIDDLEWARE
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if(!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({error: "missing token"});

  try {
    const token = auth.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: "invalid token" });
  }
};

// GET USER
app.get('/users/:id', requireAuth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "forbidden" });

  const u = await User.findById(req.params.id).select('-passwordHash');
  if(!u) return res.status(404).json({error: "not found"});
    
  res.json(u);
});

// GET FAVORITES
app.get('/users/:id/favorites', requireAuth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "forbidden" });

  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});

  res.json({ favorites: u.favorites });
});

// ADD FAVORITE
app.post('/users/:id/favorites', requireAuth, async (req, res) => {
  const { imdbid } = req.body;
  if(!imdbid) return res.status(400).json({error: "imdbid required"});

  if (req.user.sub !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "forbidden" });

  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});

  if(!u.favorites.includes(imdbid))
    u.favorites.push(imdbid);

  await u.save();
  res.json({ favorites: u.favorites });
});

// REMOVE FAVORITE
app.delete('/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin')
    return res.status(403).json({ error: "forbidden" });

  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});

  u.favorites = u.favorites.filter(id => id !== req.params.imdbid);
  await u.save();

  res.json({ favorites: u.favorites });
});

app.listen(5002, () => console.log("🚀 user-service running on 5002"));