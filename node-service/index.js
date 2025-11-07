const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models/user');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/movieinsight";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log("Mongo connected"))
  .catch(err => console.error(err));

app.post('/users', async (req, res) => {
  const { username, email } = req.body;
  if(!username||!email) return res.status(400).json({error: "username and email required"});
  const u = new User({ username, email, favorites: [] });
  await u.save();
  res.json(u);
});

app.get('/users/:id', async (req, res) => {
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  res.json(u);
});

app.post('/users/:id/favorites', async (req, res) => {
  const { imdbid } = req.body;
  if(!imdbid) return res.status(400).json({error: "imdbid required"});
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  if(!u.favorites.includes(imdbid)) u.favorites.push(imdbid);
  await u.save();
  res.json(u);
});

app.delete('/users/:id/favorites/:imdbid', async (req, res) => {
  const u = await User.findById(req.params.id);
  if(!u) return res.status(404).json({error: "not found"});
  u.favorites = u.favorites.filter(id => id !== req.params.imdbid);
  await u.save();
  res.json(u);
});

app.listen(5002, ()=> console.log("User service running on 5002"));
