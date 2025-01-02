const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { initializeDatabase, addVideoToHistory, getVideoHistory } = require('./src/db/database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize database on server start
initializeDatabase();

// Store connected users
const connectedUsers = new Map();

// Video History Endpoint
app.post('/api/videos', async (req, res) => {
  const { url, title, addedBy } = req.body;
  const video = await addVideoToHistory({ url, title, addedBy });
  
  if (video) {
    // Broadcast new video to all clients
    io.emit('newVideoAdded', video);
    res.status(201).json(video);
  } else {
    res.status(500).json({ error: 'Failed to add video' });
  }
});

app.get('/api/videos', async (req, res) => {
  const videos = await getVideoHistory();
  res.json(videos);
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.emit('serverConnected'); // Use a custom event instead of 'connect'

  socket.on('join', (username) => {
    connectedUsers.set(socket.id, username);
    io.emit('friendsUpdate', Array.from(connectedUsers.values()));
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('friendsUpdate', Array.from(connectedUsers.values()));
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using this port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});
