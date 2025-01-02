import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent 
} from '@mui/material';
import axios from 'axios';
import io from 'socket.io-client';

const VideoShare = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoHistory, setVideoHistory] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io('http://localhost:5002');
    setSocket(newSocket);

    // Fetch initial video history
    const fetchVideoHistory = async () => {
      try {
        const response = await axios.get('http://localhost:5002/api/videos');
        setVideoHistory(response.data);
      } catch (error) {
        console.error('Error fetching video history:', error);
      }
    };
    fetchVideoHistory();

    // Listen for new video additions
    newSocket.on('newVideoAdded', (video) => {
      setVideoHistory(prevHistory => [video, ...prevHistory]);
    });

    // Cleanup socket connection
    return () => newSocket.disconnect();
  }, []);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAddVideo = async () => {
    if (!videoUrl) return;

    const videoId = extractYouTubeId(videoUrl);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5002/api/videos', {
        url: videoUrl,
        title: `YouTube Video ${videoId}`,
        addedBy: 'GameMaster42'
      });

      setVideoUrl('');
    } catch (error) {
      console.error('Error adding video:', error);
    }
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
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAddVideo}
        >
          Add Video
        </Button>
      </Box>

      <Grid container spacing={3}>
        {videoHistory.map((video, index) => {
          const videoId = extractYouTubeId(video.url);
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ 
                background: 'rgba(26, 26, 26, 0.8)', 
                backdropFilter: 'blur(10px)' 
              }}>
                <CardMedia
                  component="iframe"
                  height="200"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube Video"
                  allowFullScreen
                />
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
