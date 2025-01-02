import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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

const VideoShare = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const queryClient = useQueryClient();

  // Fetch videos query
  const { 
    data: videoHistory = [], 
    isLoading, 
    error 
  } = useQuery('videoHistory', fetchVideos, {
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
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

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddVideo = () => {
    if (!videoUrl) return;

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    addVideoMutation.mutate({
      url: videoUrl,
      title: `YouTube Video ${videoId}`,
      addedBy: 'GameMaster42'
    });
  };

  const handleDeleteVideo = (videoId) => {
    deleteVideoMutation.mutate(videoId);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'primary.main' }}>
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
          disabled={addVideoMutation.isLoading}
        >
          Add Video
        </Button>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load videos. Please try again later.
        </Alert>
      )}

      <Grid container spacing={3}>
        {videoHistory.map((video) => {
          const videoId = extractYouTubeId(video.url);
          return (
            <Grid item xs={12} sm={6} md={4} key={video.id}>
              <Card sx={{ 
                background: 'rgba(26, 26, 26, 0.8)', 
                backdropFilter: 'blur(10px)',
                position: 'relative'
              }}>
                <CardMedia
                  component="iframe"
                  height="200"
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
                <CardContent>
                  <Typography variant="body2">
                    Added by: {video.addedBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(video.addedAt).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default VideoShare;
