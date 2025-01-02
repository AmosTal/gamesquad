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

// Dynamic port configuration
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://web-production-0f014.up.railway.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://gamesquad-backend.up.railway.app';

// Comprehensive CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000', 
      'https://web-production-0f014.up.railway.app',
      FRONTEND_URL,
      'https://gamesquad-frontend.up.railway.app',
      /\.railway\.app$/,
      'http://localhost:8080'
    ];
    
    console.log('Incoming request origin:', origin);
    
    // Always allow if no origin (like server-to-server requests)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? allowed === origin 
        : allowed.test(origin)
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PUT'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Origin', 
    'X-Requested-With', 
    'Accept', 
    'x-client-key', 
    'x-client-token', 
    'x-client-secret', 
    'Access-Control-Allow-Origin'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Global CORS and security middleware
app.use((req, res, next) => {
  // Allow any origin temporarily
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight requests for all routes

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.get('origin') || 'Unknown Origin'}`);
  next();
});

app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// API routes with comprehensive error handling
app.post('/api/videos', async (req, res) => {
  try {
    const { url, title, addedBy } = req.body;
    const video = await addVideoToHistory({ url, title, addedBy });
    
    if (video) {
      io.emit('newVideoAdded', video);
      res.status(201).json(video);
    } else {
      res.status(500).json({ error: 'Failed to add video' });
    }
  } catch (error) {
    console.error('Video add error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const videos = await getVideoHistory();
    res.json(videos);
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos', details: error.message });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteVideoById(id);
    res.json({ success });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video', details: error.message });
  }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
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
    const onlineFriendsList = Array.from(connectedUsers.values());
    console.log('Emitting friends update:', onlineFriendsList);
    io.emit('friendsUpdate', onlineFriendsList);
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    if (username) {
      console.log(`${username} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Broadcast updated friends list
      const onlineFriendsList = Array.from(connectedUsers.values());
      console.log('Emitting friends update after disconnect:', onlineFriendsList);
      io.emit('friendsUpdate', onlineFriendsList);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use');
  }
});
