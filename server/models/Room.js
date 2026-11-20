import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  topicIcon: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  activeUsersCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Room', RoomSchema);
