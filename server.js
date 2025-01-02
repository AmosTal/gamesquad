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

// Detailed logging function
const logRequest = (req, res, next) => {
  console.log('-------------------------------------------');
  console.log(`[${new Date().toISOString()}] Request Received:`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Origin: ${req.get('origin') || 'No Origin'}`);
  console.log(`Referrer: ${req.get('referrer') || 'No Referrer'}`);
  console.log(`Host: ${req.get('host') || 'No Host'}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`Body: ${JSON.stringify(req.body || {}, null, 2)}`);
  console.log('-------------------------------------------');
  next();
};

// Dynamic port configuration
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://web-production-0f014.up.railway.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://gamesquad-backend.up.railway.app';

console.log('Server Configuration:');
console.log(`PORT: ${PORT}`);
console.log(`FRONTEND_URL: ${FRONTEND_URL}`);
console.log(`BACKEND_URL: ${BACKEND_URL}`);

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
    
    console.log('CORS Check - Incoming Origin:', origin);
    
    // Always allow if no origin (like server-to-server requests)
    if (!origin) {
      console.log('No origin - allowing request');
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowed => 
      typeof allowed === 'string' 
        ? allowed === origin 
        : allowed.test(origin)
    );

    if (isAllowed) {
      console.log('Origin allowed:', origin);
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
    'Access-Control-Allow-Origin'
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Global middleware for logging and CORS
app.use(logRequest);
app.use((req, res, next) => {
  // Explicitly set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS Preflight Request');
    return res.sendStatus(200);
  }
  
  next();
});

// Apply CORS middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight requests for all routes

app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Comprehensive error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Health check endpoint with detailed diagnostics
app.get('/health', async (req, res) => {
  try {
    // Perform basic database connectivity check
    const videoCount = await getVideoHistory().catch(err => {
      console.error('Database health check failed:', err);
      return null;
    });

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      diagnostics: {
        database: videoCount !== null ? 'connected' : 'disconnected',
        videoCount: videoCount ? videoCount.length : 0
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Detailed video API routes
app.post('/api/videos', async (req, res) => {
  try {
    console.log('Received video add request:', req.body);
    const { url, title, addedBy } = req.body;
    
    if (!url || !title) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'url and title are required' 
      });
    }

    const video = await addVideoToHistory({ url, title, addedBy });
    
    if (video) {
      console.log('Video added successfully:', video);
      io.emit('newVideoAdded', video);
      res.status(201).json(video);
    } else {
      console.error('Failed to add video');
      res.status(500).json({ error: 'Failed to add video' });
    }
  } catch (error) {
    console.error('Video add error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    console.log('Fetching video history');
    const videos = await getVideoHistory();
    console.log(`Fetched ${videos.length} videos`);
    res.json(videos);
  } catch (error) {
    console.error('Fetch videos error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch videos', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.delete('/api/videos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await deleteVideoById(id);
    res.json({ success });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ 
      error: 'Failed to delete video', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Catch-all route to serve React app
app.get('*', (req, res) => {
  console.log('Catch-all route hit:', req.path);
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',  // Allow all origins for production flexibility
    methods: ['GET', 'POST', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With'
    ],
    credentials: true
  },
  pingTimeout: 60000,     // 1 minute
  pingInterval: 25000,    // 25 seconds
  transports: ['websocket', 'polling'],
  path: '/socket.io/',    // Explicit socket.io path
  serveClient: false,     // Disable client-side socket.io script serving
  allowEIO3: false        // Disable older socket.io protocol versions
});

// Enhanced socket connection logging and validation
io.use((socket, next) => {
  const handshakeData = socket.handshake;
  console.log('Socket Connection Attempt:', {
    origin: handshakeData.headers.origin || 'Unknown',
    time: new Date().toISOString(),
    address: socket.handshake.address,
    query: socket.handshake.query
  });

  // Optional: Add basic authentication if needed
  const username = socket.handshake.query.username;
  if (username) {
    // You can add more sophisticated authentication here
    next();
  } else {
    next(new Error('Authentication error'));
  }
});

// Initialize database on server start
initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Immediately send server connected event
  socket.emit('serverConnected');
  
  // Handle user join
  socket.on('join', (username) => {
    console.log(`${username} joined with socket ID: ${socket.id}`);
    
    // Store user connection
    connectedUsers.set(socket.id, username);
    
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

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use');
  }
  console.error('Server startup error:', error);
});
