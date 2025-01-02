const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { 
  initializeDatabase, 
  addVideoToHistory, 
  getVideoHistory,
  deleteVideoById 
} = require('./src/db/database');

const app = express();

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(express.json());

// API routes
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

app.delete('/api/videos/:id', async (req, res) => {
  const { id } = req.params;
  const success = await deleteVideoById(id);
  res.json({ success });
});

// Serve React app for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE"]
  }
});

// Initialize database on server start
initializeDatabase();

// Store connected users
const connectedUsers = new Map();

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

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use');
  }
});
