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

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/movieinsight";
const JWT_SECRET = process.env.JWT_SECRET || "changemeinprod";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Mongo connected"))
  .catch(err => console.error("❌ Mongo error:", err));


// REGISTER
app.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "User already exists" });

  const hash = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    passwordHash: hash,
    favorites: []
  });

  await user.save();
  res.json({ message: "Registered" });
});


// LOGIN (EMAIL O USERNAME)
app.post('/auth/login', async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }]
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { sub: user._id.toString(), role: "user" },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email }
  });
});


// AUTH MIDDLEWARE
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = auth.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}


// ADD FAVORITE (ARREGLADO)
app.post('/users/:id/favorites', requireAuth, async (req, res) => {
  const { imdbid } = req.body;

  if (!imdbid) return res.status(400).json({ error: "imdbid required" });

  if (req.user.sub !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "forbidden" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.favorites.includes(imdbid)) {
    user.favorites.push(imdbid);
    await user.save();
  }

  res.json({ favorites: user.favorites });
});


// GET FAVORITES
app.get('/users/:id/favorites', requireAuth, async (req, res) => {
  if (req.user.sub !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "forbidden" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ favorites: user.favorites });
});


// DELETE FAVORITE
app.delete('/users/:id/favorites', requireAuth, async (req, res) => {
  const imdbid = req.query.imdbid;

  if (req.user.sub !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: "forbidden" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.favorites = user.favorites.filter(id => id !== imdbid);
  await user.save();

  res.json({ favorites: user.favorites });
});


app.listen(5002, () => console.log("✅ user-service listening on 5002"));