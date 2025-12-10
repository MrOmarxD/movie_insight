const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true },
  email:      { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  // ⭐ FAVORITOS BIEN DEFINIDOS
  favorites: {
    type: [String],
    default: []
  },

  role: { type: String, default: "user" }
});

module.exports = mongoose.model('User', userSchema);