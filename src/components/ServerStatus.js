import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Typography, 
  Box, 
  CircularProgress, 
  TextField, 
  Button, 
  Grid, 
  CardMedia,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';

// Dynamic backend URL configuration
const BACKEND_URL = 
  process.env.REACT_APP_BACKEND_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://gamesquad-backend.up.railway.app');

console.log('Backend URL:', BACKEND_URL);

// Axios configuration for API calls
const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Health check function
const checkServerHealth = async () => {
  try {
    const response = await axiosInstance.get('/health');
    console.log('Server health check:', response.data);
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Modify video fetching function with enhanced error handling
const fetchVideos = async () => {
  try {
    console.log('Attempting to fetch videos from:', `${BACKEND_URL}/api/videos`);
    const response = await axiosInstance.get('/api/videos');
    return response.data;
  } catch (error) {
    console.error('Error fetching videos:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response',
      status: error.response ? error.response.status : 'Unknown'
    });
    throw error;
  }
};

const addVideo = async (videoData) => {
  try {
    const { data } = await axiosInstance.post('/api/videos', videoData);
    return data;
  } catch (error) {
    console.error('Error adding video:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const deleteVideo = async (videoId) => {
  try {
    const { data } = await axiosInstance.delete(`/api/videos/${videoId}`);
    return data;
  } catch (error) {
    console.error('Error deleting video:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const DISCORD_VOICE_CHANNEL_LINK = 'discord://discord.com/channels/1091057132771750030';

const ServerStatus = ({ username }) => {
  const [serverStatus, setServerStatus] = useState('offline');
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const queryClient = useQueryClient();
  
  // Memoized safe online friends to prevent unnecessary re-renders
  const safeOnlineFriends = useMemo(() => {
    // Ensure onlineFriends is always an array and filter out any non-string values
    return Array.isArray(onlineFriends) 
      ? onlineFriends.filter(friend => typeof friend === 'string') 
      : [];
  }, [onlineFriends]);
  
  // Fetch videos query
  const { 
    data: videoHistory = [], 
    isLoading: isVideoLoading, 
    error: videoError 
  } = useQuery('videoHistory', fetchVideos, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!username,
    onError: (error) => {
      console.error('Video history fetch error:', error);
      setConnectionError(error.message || 'Failed to fetch videos');
    }
  });

  // Add video mutation
  const addVideoMutation = useMutation(addVideo, {
    onSuccess: (newVideo) => {
      // Optimistically update the cache
      queryClient.setQueryData('videoHistory', (oldVideos) => [
        newVideo,
        ...(oldVideos || [])
      ]);
      setVideoUrl('');
    },
    onError: (error) => {
      console.error('Error adding video:', error);
      setConnectionError(error.message || 'Failed to add video');
    }
  });

  // Delete video mutation
  const deleteVideoMutation = useMutation(deleteVideo, {
    onSuccess: (_, videoId) => {
      // Optimistically remove the video from cache
      queryClient.setQueryData('videoHistory', (oldVideos) => 
        (oldVideos || []).filter(video => video.id !== videoId)
      );
    },
    onError: (error) => {
      console.error('Error deleting video:', error);
      setConnectionError(error.message || 'Failed to delete video');
    }
  });

  useEffect(() => {
    if (!username) return;

    // Extensive logging for socket connection
    console.log('Attempting to connect to socket at:', BACKEND_URL);

    // Socket connection configuration with extensive error handling
    const socketOptions = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 2000,
      randomizationFactor: 0.5,
      timeout: 15000,
      forceNew: true,
      secure: true,
      rejectUnauthorized: false,
      withCredentials: false
    };

    // Create socket with detailed logging
    const socket = io(BACKEND_URL, socketOptions);
    
    // Comprehensive socket event logging
    const logSocketEvent = (eventName) => {
      socket.on(eventName, (...args) => {
        console.log(`Socket event: ${eventName}`, args);
      });
    };

    // Log all standard socket events
    ['connect', 'connect_error', 'disconnect', 'reconnect', 'reconnect_error'].forEach(logSocketEvent);
    
    // Enhanced error logging for socket connection
    const logSocketError = (error) => {
      console.error('Detailed Socket Connection Error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    };

    // Log socket events
    socket.on('connect', async () => {
      console.log('Socket connected successfully');
      const isHealthy = await checkServerHealth();
      if (isHealthy) {
        socket.emit('join', username);
      } else {
        console.error('Server is not healthy');
        setConnectionError('Server is not healthy');
      }
    });

    socket.on('serverConnected', () => {
      console.log('Server explicitly confirmed connection');
      setServerStatus('online');
      setConnectionError(null);
    });

    socket.on('friendsUpdate', (friends) => {
      console.log('Friends update received:', friends);
      // Ensure friends is an array and contains only strings
      const safeFriends = Array.isArray(friends) 
        ? friends.filter(friend => typeof friend === 'string')
        : [];
      setOnlineFriends(safeFriends);
    });

    // Comprehensive error handling
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setServerStatus('offline');
      setConnectionError(`Connection failed: ${error.message}`);
      logSocketError(error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setServerStatus('offline');
      setConnectionError(`Disconnected: ${reason}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setServerStatus('online');
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setServerStatus('offline');
      setConnectionError(`Reconnection failed: ${error.message}`);
      logSocketError(error);
    });

    return () => {
      socket.disconnect();
    };
  }, [username]);

  // Render connection error if exists
  const renderConnectionError = () => {
    if (!connectionError) return null;
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {connectionError}
      </Alert>
    );
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddVideo = () => {
    if (!videoUrl || !username) return;

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    addVideoMutation.mutate({
      url: videoUrl,
      title: `YouTube Video ${videoId}`,
      addedBy: username
    });
  };

  const handleDeleteVideo = (videoId) => {
    deleteVideoMutation.mutate(videoId);
  };

  const handleJoinVoiceChannel = () => {
    // Open Discord and navigate directly to the voice channel
    window.open(DISCORD_VOICE_CHANNEL_LINK, '_self');
  };

  if (!username) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card
        sx={{
          p: 3,
          background: 'rgba(26, 26, 26, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 255, 159, 0.2)',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
          Server Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CircularProgress
            size={20}
            sx={{
              color: serverStatus === 'online' ? '#00ff9f' : '#ff0000',
              mr: 2,
            }}
          />
          <Typography>
            Status: {serverStatus.toUpperCase()}
            {serverStatus === 'offline' && ' (Trying to reconnect...)'}
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Online Friends
          </Typography>
        {safeOnlineFriends.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No friends online
          </Typography>
        ) : (
          safeOnlineFriends.map((friend, index) => (
            <Typography key={index} variant="body2">
              {friend}
            </Typography>
          ))
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Video Share
          </Typography>
          
          <Box sx={{ display: 'flex', mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="YouTube Video URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              sx={{ mr: 2 }}
              error={addVideoMutation.isError}
              helperText={addVideoMutation.isError && 'Failed to add video'}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddVideo}
              disabled={addVideoMutation.isLoading || !username}
            >
              Add Video
            </Button>
          </Box>

          {isVideoLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {videoError && (
            <Typography color="error" sx={{ mb: 2 }}>
              Failed to load videos
            </Typography>
          )}

          <Grid container spacing={2}>
            {videoHistory.map((video) => {
              const videoId = extractYouTubeId(video.url);
              return (
                <Grid item xs={12} sm={6} key={video.id}>
                  <Card sx={{ 
                    background: 'rgba(26, 26, 26, 0.6)', 
                    position: 'relative'
                  }}>
                    <CardMedia
                      component="iframe"
                      height="150"
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title="YouTube Video"
                      allowFullScreen
                    />
                    <Tooltip title="Delete Video">
                      <IconButton
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'white',
                          backgroundColor: 'rgba(255,0,0,0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,0,0,0.7)'
                          }
                        }}
                        onClick={() => handleDeleteVideo(video.id)}
                        disabled={deleteVideoMutation.isLoading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ p: 1 }}>
                      <Typography variant="body2">
                        Added by: {video.addedBy}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(video.addedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        {renderConnectionError()}
      </Card>
    </Box>
  );
};

export default ServerStatus;
