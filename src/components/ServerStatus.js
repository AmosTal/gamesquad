import React, { useState, useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from 'react-query';

const fetchVideos = async () => {
  const { data } = await axios.get('http://localhost:5002/api/videos');
  return data;
};

const addVideo = async (videoData) => {
  const { data } = await axios.post('http://localhost:5002/api/videos', videoData);
  return data;
};

const deleteVideo = async (videoId) => {
  const { data } = await axios.delete(`http://localhost:5002/api/videos/${videoId}`);
  return data;
};

const ServerStatus = ({ username }) => {
  const [serverStatus, setServerStatus] = useState('offline');
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const queryClient = useQueryClient();
  
  // Fetch videos query
  const { 
    data: videoHistory = [], 
    isLoading: isVideoLoading, 
    error: videoError 
  } = useQuery('videoHistory', fetchVideos, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!username
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
    }
  });

  useEffect(() => {
    if (!username) return;

    const socket = io('http://localhost:5002');
    
    // Emit join event with username when connected
    socket.on('connect', () => {
      socket.emit('join', username);
    });

    socket.on('serverConnected', () => {
      setServerStatus('online');
    });

    socket.on('friendsUpdate', (friends) => {
      setOnlineFriends(friends);
    });

    return () => socket.disconnect();
  }, [username]);

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
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
          Online Friends
        </Typography>
        {onlineFriends.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No friends online
          </Typography>
        ) : (
          onlineFriends.map((friend, index) => (
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
      </Card>
    </Box>
  );
};

export default ServerStatus;
