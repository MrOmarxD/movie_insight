require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/movieinsight";

async function run() {
  await mongoose.connect(MONGO_URI);
  const username = "demo";
  const email = "demo@example.com";
  const password = "demo123";

  let user = await User.findOne({ $or: [{ username }, { email }] });
  if (user) {
    console.log("Usuario demo ya existe:", user.username);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  user = await User.create({
    username,
    email,
    passwordHash: hash,
    favorites: []
  });
  console.log("Usuario demo creado:", { username, email, password });
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
