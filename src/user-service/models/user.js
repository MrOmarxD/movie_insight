const mongoose = require('mongoose');

// Stored as flexible objects to avoid casting issues with legacy string arrays
const favoriteSchema = new mongoose.Schema({
  imdbid: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  comment: { type: String, default: "" },
  addedAt: { type: Date, default: Date.now }
}, { _id: false, strict: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  favorites: { type: [mongoose.Schema.Types.Mixed], default: [] },
  role: { type: String, default: "user" }
});

module.exports = mongoose.model('User', userSchema);
