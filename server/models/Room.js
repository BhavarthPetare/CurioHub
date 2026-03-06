const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  topicIcon: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  activeUsersCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
