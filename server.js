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

// Comprehensive CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', 
      'https://web-production-0f014.up.railway.app',
      /\.railway\.app$/
    ];
    
    if (!origin || allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? allowed === origin 
        : allowed.test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight requests for all routes

app.use(express.json());

// API routes
app.post('/api/videos', async (req, res) => {
  const { url, title, addedBy } = req.body;
  const video = await addVideoToHistory({ url, title, addedBy });
  
  if (video) {
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

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'public')));

// Serve React app for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

// Initialize database on server start
initializeDatabase();

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Handle user join
  socket.on('join', (username) => {
    console.log(`${username} joined with socket ID: ${socket.id}`);
    
    // Store user connection
    connectedUsers.set(socket.id, username);
    
    // Explicitly send server connected event
    socket.emit('serverConnected');
    
    // Broadcast updated friends list
    io.emit('friendsUpdate', Array.from(connectedUsers.values()));
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      console.log(`${username} disconnected`);
      connectedUsers.delete(socket.id);
      io.emit('friendsUpdate', Array.from(connectedUsers.values()));
    }
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use');
  }
});
