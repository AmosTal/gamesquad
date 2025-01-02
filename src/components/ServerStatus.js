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

// Dynamic backend URL configuration for production
const BACKEND_URL = 
  process.env.REACT_APP_BACKEND_URL || 
  'https://gamesquad-backend.up.railway.app';

console.log('Backend URL Configuration:', {
  envVar: process.env.REACT_APP_BACKEND_URL,
  resolvedURL: BACKEND_URL
});

// Axios configuration for API calls
const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false,
  validateStatus: function (status) {
    // Reject only if the status code is less than 200 or greater than or equal to 300
    return status >= 200 && status < 300;
  }
});

// Comprehensive error logging function
const logAxiosError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Axios Error Response:', {
      data: error.response.data,
      status: error.response.status,
      headers: error.response.headers
    });
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Axios No Response Error:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Axios Error:', error.message);
  }
};

// Health check function
const checkServerHealth = async () => {
  try {
    console.log('Performing server health check...');
    const response = await axiosInstance.get('/health');
    console.log('Health Check Response:', response.data);
    
    return {
      status: response.data.status === 'healthy',
      details: response.data
    };
  } catch (error) {
    logAxiosError(error);
    return {
      status: false,
      error: error.message
    };
  }
};

// Modify video fetching function with enhanced error handling
const fetchVideos = async () => {
  try {
    console.log(`Attempting to fetch videos from: ${BACKEND_URL}/api/videos`);
    const response = await axiosInstance.get('/api/videos');
    
    console.log('Video Fetch Response:', {
      status: response.status,
      count: response.data ? response.data.length : 0
    });
    
    return response.data;
  } catch (error) {
    logAxiosError(error);
    
    throw {
      message: 'Failed to fetch videos',
      details: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : 'Unknown'
    };
  }
};

const addVideo = async (videoData) => {
  try {
    const { data } = await axiosInstance.post('/api/videos', videoData);
    return data;
  } catch (error) {
    logAxiosError(error);
    throw error;
  }
};

const deleteVideo = async (videoId) => {
  try {
    const { data } = await axiosInstance.delete(`/api/videos/${videoId}`);
    return data;
  } catch (error) {
    logAxiosError(error);
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

    const createSocketConnection = (username) => {
      // Enhanced socket options for production
      const socketOptions = {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 25,
        reconnectionDelay: 5000,
        randomizationFactor: 0.5,
        timeout: 30000,
        forceNew: true,
        secure: true,
        rejectUnauthorized: false,
        withCredentials: false,
        path: '/socket.io/',
        query: { 
          username: username  // Pass username in connection query
        }
      };

      // Create socket with comprehensive error handling
      const socket = io(BACKEND_URL, {
        ...socketOptions,
        extraHeaders: {
          'X-Connection-Type': 'GameSquad-Socket'
        }
      });

      // Detailed socket event logging
      const logSocketEvent = (eventName) => {
        socket.on(eventName, (...args) => {
          console.log(`Socket Event [${eventName}]:`, {
            timestamp: new Date().toISOString(),
            args: args
          });
        });
      };

      // Log critical socket events
      [
        'connect', 
        'connect_error', 
        'disconnect', 
        'reconnect', 
        'reconnect_attempt',
        'reconnect_error',
        'reconnect_failed'
      ].forEach(logSocketEvent);

      // Enhanced connection handling
      socket.on('connect', async () => {
        console.log('Socket Connected Successfully', {
          id: socket.id,
          timestamp: new Date().toISOString()
        });

        try {
          // Perform health check before joining
          const healthCheck = await checkServerHealth();
          
          if (healthCheck.status) {
            console.log('Server Health Check Passed - Joining');
            socket.emit('join', username);
          } else {
            console.warn('Server Health Check Failed', healthCheck);
          }
        } catch (error) {
          console.error('Health Check Error:', error);
        }
      });

      // Detailed error handling
      socket.on('connect_error', (error) => {
        console.error('Detailed Socket Connection Error:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
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
      });

      return socket;
    };

    const socket = createSocketConnection(username);

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
