const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/movieinsight";
const JWT_SECRET = process.env.JWT_SECRET || "changemeinprod";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Mongo connected"))
  .catch(err => console.error("Mongo connection error:", err));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

function buildToken(userId) {
  return jwt.sign({ sub: userId.toString(), role: "user" }, JWT_SECRET, { expiresIn: "2h" });
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "token faltante" });
  }

  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "token invalido" });
  }
}

async function loadUserOr404(id, res) {
  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ error: "usuario no encontrado" });
    return null;
  }
  return user;
}

function normalizeFavorites(favorites = []) {
  return favorites
    .map(fav => {
      if (typeof fav === 'string') {
        return { imdbid: fav, rating: 5, comment: "", addedAt: new Date() };
      }
      if (!fav || typeof fav !== 'object') return null;
      const imdbid = fav.imdbid || fav.id || fav.movieId;
      if (!imdbid) return null;
      return {
        imdbid,
        rating: Math.max(1, Math.min(5, Number(fav.rating) || 5)),
        comment: fav.comment || "",
        addedAt: fav.addedAt ? new Date(fav.addedAt) : new Date()
      };
    })
    .filter(Boolean);
}

// REGISTER
app.post('/auth/register', async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email and password are required" });
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: "user already exists" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash: hash, favorites: [] });

    res.status(201).json({
      message: "registered",
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "could not register user" });
  }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
  try {
    const identifier = (req.body.identifier || "").trim();
    const password = req.body.password || "";

    if (!identifier || !password) {
      return res.status(400).json({ error: "identifier and password are required" });
    }

    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier.toLowerCase() }]
    });

    if (!user) return res.status(401).json({ error: "invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "invalid credentials" });

    const token = buildToken(user._id);

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "could not login" });
  }
});

// ADD FAVORITE
app.post('/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    const { imdbid, rating = 5, comment = "" } = req.body;

    if (!imdbid) return res.status(400).json({ error: "imdbid requerido" });
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: "prohibido" });

    const user = await loadUserOr404(req.params.id, res);
    if (!user) return;

    user.favorites = normalizeFavorites(user.favorites);

    if (user.favorites.some(f => f.imdbid === imdbid)) {
      return res.status(409).json({ error: "La pelicula ya esta en favoritos" });
    }

    user.favorites.push({
      imdbid,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment || "",
      addedAt: new Date()
    });
    user.markModified('favorites');
    await user.save();

    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("add favorite error:", err);
    res.status(500).json({ error: "No se pudo anadir a favoritos" });
  }
});

// UPDATE FAVORITE (rating/comment)
app.put('/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  try {
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: "prohibido" });

    const user = await loadUserOr404(req.params.id, res);
    if (!user) return;

    user.favorites = normalizeFavorites(user.favorites);
    const fav = user.favorites.find(f => f.imdbid === req.params.imdbid);
    if (!fav) return res.status(404).json({ error: "favorito no encontrado" });

    if (req.body.rating !== undefined) {
      fav.rating = Math.max(1, Math.min(5, Number(req.body.rating) || 1));
    }
    if (req.body.comment !== undefined) {
      fav.comment = req.body.comment || "";
    }

    user.markModified('favorites');
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("update favorite error:", err);
    res.status(500).json({ error: "No se pudo actualizar el favorito" });
  }
});

// GET FAVORITES
app.get('/users/:id/favorites', requireAuth, async (req, res) => {
  try {
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: "prohibido" });

    const user = await loadUserOr404(req.params.id, res);
    if (!user) return;

    user.favorites = normalizeFavorites(user.favorites);
    user.markModified('favorites');
    await user.save();

    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("get favorites error:", err);
    res.status(500).json({ error: "No se pudieron obtener los favoritos" });
  }
});

// DELETE FAVORITE
app.delete('/users/:id/favorites/:imdbid', requireAuth, async (req, res) => {
  try {
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: "prohibido" });

    const user = await loadUserOr404(req.params.id, res);
    if (!user) return;

    user.favorites = normalizeFavorites(user.favorites)
      .filter(f => f.imdbid !== req.params.imdbid);
    user.markModified('favorites');
    await user.save();

    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("delete favorite error:", err);
    res.status(500).json({ error: "No se pudo eliminar el favorito" });
  }
});

app.listen(5002, () => console.log("user-service listening on 5002"));
