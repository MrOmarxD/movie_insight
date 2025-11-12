const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user','admin'], default: 'user' },
  favorites: [String],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);
