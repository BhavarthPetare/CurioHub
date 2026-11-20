import express from 'express';
import Room from '../models/Room.js';
import auth from '../middleware/auth.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { isObjectId } from '../utils/validate.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ activeUsersCount: -1, name: 1 });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/recommended', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const interests = user?.interests ?? [];

    // Interests are room names. Fall back to the busiest rooms when the user has
    // none, or only legacy interests that no longer match a room.
    const matched = interests.length
      ? await Room.find({ name: { $in: interests } }).sort({ activeUsersCount: -1, name: 1 })
      : [];
    if (matched.length) return res.json(matched);

    res.json(await Room.find().sort({ activeUsersCount: -1, name: 1 }).limit(5));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:roomId/messages', auth, async (req, res) => {
  const { roomId } = req.params;
  if (!isObjectId(roomId)) return res.status(400).json({ message: 'Invalid room id' });

  try {
    if (!(await Room.exists({ _id: roomId }))) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
