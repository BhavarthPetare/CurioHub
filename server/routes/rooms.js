const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');
const Message = require('../models/Message');

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().sort({ activeUsersCount: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/recommended', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (!user || !user.interests.length) {
      const rooms = await Room.find().limit(5).sort({ activeUsersCount: -1 });
      return res.json(rooms);
    }
    const rooms = await Room.find({ category: { $in: user.interests } }).sort({ activeUsersCount: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.get('/:roomId/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
