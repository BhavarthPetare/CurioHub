require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const Room = require('./models/Room');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedRooms();
  })
  .catch(err => console.log(err));

// Predefined Rooms Seeding
const predefinedRooms = [
  { name: 'Cricket', topicIcon: '🏏', category: 'Sports', description: 'Discuss everything about cricket.' },
  { name: 'Football', topicIcon: '⚽', category: 'Sports', description: 'The beautiful game.' },
  { name: 'Technology', topicIcon: '💻', category: 'Technology', description: 'Latest tech news and discussions.' },
  { name: 'AI & Machine Learning', topicIcon: '🧠', category: 'Technology', description: 'AI discussions.' },
  { name: 'Gaming', topicIcon: '🎮', category: 'Entertainment', description: 'Video games talk.' },
  { name: 'Music', topicIcon: '🎵', category: 'Entertainment', description: 'Share and discuss music.' },
  { name: 'Cinema', topicIcon: '🎬', category: 'Entertainment', description: 'Movies and TV shows.' },
  { name: 'History', topicIcon: '🏛️', category: 'Education', description: 'World history and Renaissance Art.' },
  { name: 'Science', topicIcon: '🔬', category: 'Education', description: 'Science and Space Exploration.' },
  { name: 'Literature', topicIcon: '📚', category: 'Education', description: 'Books and literature.' },
  { name: 'Travel', topicIcon: '✈️', category: 'Lifestyle', description: 'Travel experiences and tips.' }
];

async function seedRooms() {
  const count = await Room.countDocuments();
  if (count === 0) {
    await Room.insertMany(predefinedRooms);
    console.log('Rooms seeded');
  }
}

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', async ({ roomId, user }) => {
    socket.join(roomId);
    socket.roomId = roomId;
    socket.user = user;
    
    // Broadcast join
    if(user) {
        io.to(roomId).emit('message', {
            type: 'system',
            text: `${user.name} joined the room`,
            createdAt: new Date()
        });
    }

    // Update room count
    try {
        await Room.findByIdAndUpdate(roomId, { $inc: { activeUsersCount: 1 } });
    } catch (e) {
        console.error(e)
    }
  });

  socket.on('chatMessage', async (msgData) => {
    const { roomId, userId, text, userName } = msgData;
    
    // Save to DB
    try {
      const message = new Message({ room: roomId, sender: userId, text });
      await message.save();
      
      const populatedMsg = await Message.findById(message._id).populate('sender', 'name');

      io.to(roomId).emit('message', {
        _id: populatedMsg._id,
        type: 'user',
        sender: populatedMsg.sender,
        text: populatedMsg.text,
        createdAt: populatedMsg.createdAt
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.roomId) {
        if(socket.user) {
            io.to(socket.roomId).emit('message', {
                type: 'system',
                text: `${socket.user.name} left the room`,
                createdAt: new Date()
            });
        }
      try {
        await Room.findByIdAndUpdate(socket.roomId, { $inc: { activeUsersCount: -1 } });
      } catch (err) {
        console.error(err);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
